const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MintWBTC and MASSsmartContract Tests", function () {
  let mintWBTCContract;
  let massSmartContract;
  let deployer;
  let bitcoinPrice;

  before(async () => {
    [deployer] = await ethers.getSigners();
    console.log("Deployer Address:", deployer.address);

    // Deploy aBTC Contract
    const MintWBTC = await ethers.getContractFactory("aBTC");
    mintWBTCContract = await MintWBTC.deploy();
    await mintWBTCContract.waitForDeployment();
    console.log("MintWBTC Contract Address:", mintWBTCContract.target);

    // Deploy MASSsmartContract
    const MASSsmartContract = await ethers.getContractFactory("MASSsmartContract");
    massSmartContract = await MASSsmartContract.deploy(
      mintWBTCContract.target, // WBTC contract
      mintWBTCContract.target // Mock USDC contract
    );
    await massSmartContract.waitForDeployment();
    console.log("MASSsmartContract Address:", massSmartContract.target);

    bitcoinPrice = 60000; // $60,000 in USD

    // Mint initial balance (100 BTC in Satoshis)
    const initialBalance = 100 * 1e8; // 100 BTC, scaled to Satoshis
    await mintWBTCContract.mint(initialBalance, 0); // Mint to deployer
    await mintWBTCContract.mint(initialBalance, 0); // Mint to MASSsmartContract
  });

  describe("MintWBTC Contract", function () {
    it("Should allow the owner to mint WBTC with valid parameters", async function () {
      // Directly use BTC, scale it to Satoshis by multiplying with 1e8
      const arellsBTC = 0.00121 * 1e8;  // 0.00121 BTC in Satoshis (12100000 Satoshis)
      const acVactTas = 0.00021 * 1e8;  // 0.00021 BTC in Satoshis (2100000 Satoshis)
      const expectedMintAmount = arellsBTC - acVactTas;  // Expected mint amount in Satoshis

      console.log("Expected Mint Amount in Satoshis: ", expectedMintAmount);

      const tx = await mintWBTCContract.mint(arellsBTC, acVactTas);
      await tx.wait();

      const totalMinted = await mintWBTCContract.balanceOf(deployer.address);
      console.log("Deployer Balance after minting: ", totalMinted.toString());

      // Assert that the total minted matches the expected amount
      expect(totalMinted.toString()).to.equal(expectedMintAmount.toString());
    });

    it("Should not allow minting if the amount to mint is below the threshold", async function () {
      const arellsBTC = 0.00000001 * 1e8;  // Below 1 satoshi
      const acVactTas = 0;

      await expect(
        mintWBTCContract.mint(arellsBTC, acVactTas)
      ).to.be.revertedWith("Amount to mint is too small");
    });
  });

  describe("MASSsmartContract Supplicating", function () {
    before(async () => {
      const initialBalance = 100n * 10n ** 8n;
      await mintWBTCContract.mint(initialBalance, 0n);
      await mintWBTCContract.mint(initialBalance, 0n);
    });

    it("Should supplicate WBTC to USDC", async function () {
      const usdcAmount = 121202n; // $1212.02 in cents
      const wbtcAmount = (usdcAmount * 10n ** 8n) / BigInt(bitcoinPrice);

      await mintWBTCContract.approve(massSmartContract.target, wbtcAmount);

      const tx = await massSmartContract.supplicateWBTCtoUSDC(usdcAmount, bitcoinPrice);
      const receipt = await tx.wait();

      const event = receipt.logs.find((log) => log.address === massSmartContract.target);
      expect(event, "Supplicate event not found").to.not.be.undefined;

      const parsedEvent = massSmartContract.interface.parseLog(event);
      expect(parsedEvent.args.amount.toString()).to.equal(usdcAmount.toString());
      expect(parsedEvent.args.supplicateType).to.equal("WBTC to USDC");
    });

    it("Should supplicate USDC to WBTC", async function () {
      const wbtcAmount = BigInt(50000000); // 0.5 BTC in satoshis
      const usdcAmount = (wbtcAmount * BigInt(bitcoinPrice)) / 10n ** 8n;

      await mintWBTCContract.approve(massSmartContract.target, usdcAmount);

      const tx = await massSmartContract.supplicateUSDCtoWBTC(wbtcAmount, bitcoinPrice);
      const receipt = await tx.wait();

      const event = receipt.logs.find((log) => log.address === massSmartContract.target);
      expect(event, "Supplicate event not found").to.not.be.undefined;

      const parsedEvent = massSmartContract.interface.parseLog(event);
      expect(parsedEvent.args.amount.toString()).to.equal(wbtcAmount.toString());
      expect(parsedEvent.args.supplicateType).to.equal("USDC to WBTC");
    });
  });
});