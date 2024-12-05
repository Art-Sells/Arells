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

    const MintWBTC = await ethers.getContractFactory("aBTC");
    mintWBTCContract = await MintWBTC.deploy();
    await mintWBTCContract.waitForDeployment();
    console.log("MintWBTC Contract Address:", mintWBTCContract.target);

    const MASSsmartContract = await ethers.getContractFactory("MASSsmartContract");
    massSmartContract = await MASSsmartContract.deploy(
      mintWBTCContract.target,
      mintWBTCContract.target
    );
    await massSmartContract.waitForDeployment();
    console.log("MASSsmartContract Address:", massSmartContract.target);

    bitcoinPrice = 60000; // Example price in USD

    // Mint initial balances
    const initialBalance = ethers.parseUnits("100000", 18); // Increased mint amount for testing
    await mintWBTCContract.mint(deployer.address, initialBalance);
    await mintWBTCContract.mint(massSmartContract.target, initialBalance);
  });

  describe("MintWBTC Contract", function () {
    it("Should allow the owner to mint WBTC", async function () {
      const mintAmount = ethers.parseUnits("5", 18);
      const tx = await mintWBTCContract.mint(deployer.address, mintAmount);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => log.address === mintWBTCContract.target);
      expect(event, "Transfer event not found").to.not.be.undefined;

      const transferEvent = mintWBTCContract.interface.parseLog(event);
      expect(transferEvent.name).to.equal("Transfer");
      expect(transferEvent.args.from).to.equal(ethers.ZeroAddress);
      expect(transferEvent.args.to).to.equal(deployer.address);
      expect(transferEvent.args.value.toString()).to.equal(mintAmount.toString());
    });

    it("Should not allow non-owner to mint WBTC", async function () {
      const [_, nonOwner] = await ethers.getSigners();
      const mintAmount = ethers.parseUnits("5", 18);
      await expect(
        mintWBTCContract.connect(nonOwner).mint(nonOwner.address, mintAmount)
      ).to.be.revertedWith("Only owner can mint");
    });
  });

  describe("MASSsmartContract Supplicating", function () {
    it("Should supplicate WBTC to USDC", async function () {
      const supplicateAmount = ethers.parseUnits("1", 18);

      // Approve the MASSsmartContract to spend WBTC
      await mintWBTCContract.approve(massSmartContract.target, supplicateAmount);

      // Perform the supplication
      const tx = await massSmartContract.supplicateWBTCtoUSDC(supplicateAmount, bitcoinPrice);
      const receipt = await tx.wait();

      // Locate the Supplicate event
      const event = receipt.logs.find(log => log.address === massSmartContract.target);
      expect(event, "Supplicate event not found").to.not.be.undefined;

      const supplicateEvent = massSmartContract.interface.parseLog(event);
      expect(supplicateEvent.name).to.equal("Supplicate");
      expect(supplicateEvent.args.from).to.equal(deployer.address);
      expect(supplicateEvent.args.amount.toString()).to.equal(supplicateAmount.toString());
      expect(supplicateEvent.args.supplicateType).to.equal("WBTC to USDC");
    });

    it("Should supplicate USDC to WBTC", async function () {
      const supplicateAmount = ethers.parseUnits("60000", 18); // Equivalent USDC for 1 WBTC at 60,000 price

      // Approve the MASSsmartContract to spend USDC
      await mintWBTCContract.approve(massSmartContract.target, supplicateAmount);

      // Perform the supplication
      const tx = await massSmartContract.supplicateUSDCtoWBTC(supplicateAmount, bitcoinPrice);
      const receipt = await tx.wait();

      // Locate the Supplicate event
      const event = receipt.logs.find(log => log.address === massSmartContract.target);
      expect(event, "Supplicate event not found").to.not.be.undefined;

      const supplicateEvent = massSmartContract.interface.parseLog(event);
      expect(supplicateEvent.name).to.equal("Supplicate");
      expect(supplicateEvent.args.from).to.equal(deployer.address);
      expect(supplicateEvent.args.amount.toString()).to.equal(supplicateAmount.toString());
      expect(supplicateEvent.args.supplicateType).to.equal("USDC to WBTC");
    });
  });
});