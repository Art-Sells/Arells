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

    const initialBalance = BigInt(100) * BigInt(10 ** 8); // 100 BTC in Satoshis (100 * 10^8)
    await mintWBTCContract.mint(initialBalance, 0n); // Mint to deployer
    await mintWBTCContract.mint(initialBalance, 0n); // Mint to MASSsmartContract
  });

  describe("MintWBTC Contract", function () {
    it("Should allow the owner to mint WBTC with valid parameters", async function () {
      const arellsBTC = BigInt(0.00121 * 10 ** 8);  // Convert 0.00121 BTC to satoshis (121000 Satoshis)
      const acVactTas = BigInt(0.00021 * 10 ** 8);   // Convert 0.00021 BTC to satoshis (21000 Satoshis)
      const expectedMintAmount = arellsBTC - acVactTas;  // Expected mint amount in Satoshis

      console.log("Expected Mint Amount in Satoshis: ", expectedMintAmount.toString());

      const tx = await mintWBTCContract.mint(arellsBTC, acVactTas);
      await tx.wait();

      const totalMinted = await mintWBTCContract.totalMinted();
      console.log("Total Minted: ", totalMinted.toString());

      // Assert that the total minted matches the expected amount in Satoshis
      expect(totalMinted.toString()).to.equal(expectedMintAmount.toString());
    });

    it("Should not allow minting if the amount to mint is below the threshold", async function () {
      const arellsBTC = BigInt(0.00000001 * 10 ** 8);  // Below 0.00001 BTC (1 Satoshi)
      const acVactTas = BigInt(0);

      await expect(
        mintWBTCContract.mint(arellsBTC, acVactTas)
      ).to.be.revertedWith("Amount to mint is too small");
    });

    it("Should update total minted after minting", async function () {
      const arellsBTC = BigInt(2 * 10 ** 8);  // 2 BTC in Satoshis
      const acVactTas = BigInt(1 * 10 ** 8);  // 1 BTC in Satoshis
      const expectedMintAmount = arellsBTC - acVactTas;

      const initialTotalMinted = BigInt(await mintWBTCContract.totalMinted());
      const tx = await mintWBTCContract.mint(arellsBTC, acVactTas);
      await tx.wait();

      const finalTotalMinted = BigInt(await mintWBTCContract.totalMinted());
      expect(finalTotalMinted - initialTotalMinted).to.equal(expectedMintAmount);
    });
  });

  describe("MASSsmartContract Supplicating", function () {
    before(async () => {
      const initialBalance = 100n * 10n ** 8n;
      await mintWBTCContract.mint(initialBalance, 0n);
      await mintWBTCContract.mint(initialBalance, 0n);
    });

    it("Should supplicate WBTC to USDC", async function () {
      const usdcAmount = BigInt(121202); // $1212.02 in cents
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