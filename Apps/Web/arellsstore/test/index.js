const { expect } = require("chai");
const { ethers } = require("hardhat");

// Helper functions for formatting
const formatUSDC = (cents) => {
  const dollars = (cents / 100).toFixed(2);
  return dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatWBTC = (sats) => {
  return (sats / 1e8).toFixed(6);
};

describe("MASSsmartContract Tests", function () {
  let massSmartContract;
  let arellsInitial, user1, user2;
  let bitcoinPrice = 60000;

  before(async () => {
    // Get pre-funded test account
    [arellsInitial] = await ethers.getSigners();
  
    console.log("ArellsInitial Address:", arellsInitial.address);
  
    // Generate random wallets for User1 and User2
    user1 = ethers.Wallet.createRandom().connect(ethers.provider);
    user2 = ethers.Wallet.createRandom().connect(ethers.provider);
  
    console.log("User1 Address:", user1.address);
    console.log("User1 Private Key:", user1.privateKey);
    console.log("User2 Address:", user2.address);
    console.log("User2 Private Key:", user2.privateKey);
  
    // Fund the random wallets from arellsInitial
    const fundUser1Tx = await arellsInitial.sendTransaction({
      to: user1.address, // Correct wallet address
      value: ethers.parseEther("0.01"), // Fund with 0.01 MATIC
    });
    await fundUser1Tx.wait();
  
    const fundUser2Tx = await arellsInitial.sendTransaction({
      to: user2.address, // Correct wallet address
      value: ethers.parseEther("0.01"), // Fund with 0.01 MATIC
    });
    await fundUser2Tx.wait();
  
    console.log("User1 and User2 Wallets Funded with 0.01 MATIC Each");
  
    // Deploy the contract with the correct address parameter
    const MassSmartContract = await ethers.getContractFactory("MASSsmartContract");
    massSmartContract = await MassSmartContract.deploy(arellsInitial.address);
    await massSmartContract.waitForDeployment();
  
    console.log("Contract Deployed at:", massSmartContract.target);
  });

  describe("createMASS", function () {
    it("Should allow User1 to create MASS", async function () {
      await massSmartContract.connect(user1).createMASS(); // No argument needed
  
      const storedUsdcUser1 = await massSmartContract.userToUsdcAddress(user1.address);
      console.log("User1 Stored USDC Address:", storedUsdcUser1);
  
      expect(storedUsdcUser1).to.equal(user1.address); // Ensure the address is stored
    });
  
    it("Should revert if MASS is already created by User1", async function () {
      await expect(
        massSmartContract.connect(user1).createMASS()
      ).to.be.revertedWith("MASS already created by this user");
    });
  
    it("Should allow User2 to create MASS", async function () {
      await massSmartContract.connect(user2).createMASS(); // No argument needed
  
      const storedUsdcUser2 = await massSmartContract.userToUsdcAddress(user2.address);
      console.log("User2 Stored USDC Address:", storedUsdcUser2);
  
      expect(storedUsdcUser2).to.equal(user2.address); // Ensure the address is stored
    });
  
    it("Should revert if MASS is already created by User2", async function () {
      await expect(
        massSmartContract.connect(user2).createMASS()
      ).to.be.revertedWith("MASS already created by this user");
    });
  });

  describe("Minting WBTC by Multiple Users", function () {
    it("Should allow User1 to mint WBTC", async function () {
      const aBTC = 40000000; // 0.4 BTC in Satoshis
      const acVactTas = 20000000; // 0.2 BTC in Satoshis
      const expectedMintAmount = aBTC - acVactTas;

      await massSmartContract.connect(user1).mint(aBTC, acVactTas);

      const user1Balance = await massSmartContract.wbtcBalances(user1.address);
      console.log("User1 Balance After Minting:", formatWBTC(user1Balance.toString()), "BTC");

      expect(user1Balance.toString()).to.equal(expectedMintAmount.toString());
    });

    it("Should allow User2 to mint WBTC", async function () {
      const aBTC = 15000000; // 0.15 BTC in Satoshis
      const acVactTas = 5000000; // 0.05 BTC in Satoshis
      const expectedMintAmount = aBTC - acVactTas;

      await massSmartContract.connect(user2).mint(aBTC, acVactTas);

      const user2Balance = await massSmartContract.wbtcBalances(user2.address);
      console.log("User2 Balance After Minting:", formatWBTC(user2Balance.toString()), "BTC");

      expect(user2Balance.toString()).to.equal(expectedMintAmount.toString());
    });
  });

  describe("Supplicating WBTC to USDC and USDC to WBTC for Multiple Users", function () {
    it("Should allow User1 to supplicate WBTC to USDC first", async function () {
      const usdcAmount = 112202; // $1122.02 x 100 (in cents)
      const bitcoinPrice = 60000; // Example Bitcoin price in USD
  
      // Calculate expected WBTC equivalent
      const expectedWbtcEquivalent = Math.floor(((usdcAmount * 1e8) / 100) / bitcoinPrice);
  
      // Check initial balances
      const initialWbtcBalance = await massSmartContract.wbtcBalances(user1.address); // Satoshis
      const initialUsdcBalance = await massSmartContract.usdcBalances(user1.address); // USDC (in cents)
  
      console.log("User1 Initial WBTC Balance:", formatWBTC(initialWbtcBalance.toString()), "BTC");
      console.log("Expected WBTC Equivalent:", formatWBTC(expectedWbtcEquivalent.toString()), "BTC");
      console.log("User1 Initial USDC Balance:", formatUSDC(initialUsdcBalance.toString()), "USD");
  
      // Call the supplicateWBTCtoUSDC function
      await massSmartContract.connect(user1).supplicateWBTCtoUSDC(usdcAmount, bitcoinPrice);
  
      // Check final balances
      const finalWbtcBalance = await massSmartContract.wbtcBalances(user1.address); // Satoshis
      const finalUsdcBalance = await massSmartContract.usdcBalances(user1.address); // USDC (in cents)
  
      console.log("User1 Final WBTC Balance:", formatWBTC(finalWbtcBalance.toString()), "BTC");
      console.log("User1 Final USDC Balance:", formatUSDC(finalUsdcBalance.toString()), "USD");
  
      // Assertions
      expect(finalWbtcBalance.toString()).to.equal(
        (BigInt(initialWbtcBalance) - BigInt(expectedWbtcEquivalent)).toString()
      );
      expect(finalUsdcBalance.toString()).to.equal(
        (BigInt(initialUsdcBalance) + BigInt(usdcAmount)).toString()
      );
    });
  
    it("Should allow User2 to supplicate WBTC to USDC first", async function () {
      const usdcAmount = 75000; // $750 x 100 (in cents)
      const expectedWbtcEquivalent = Math.floor(((usdcAmount * 1e8) / 100) / bitcoinPrice);
  
      const initialWbtcBalance = await massSmartContract.wbtcBalances(user2.address); // Satoshis
      const initialUsdcBalance = await massSmartContract.usdcBalances(user2.address); // Cents
  
      console.log("User2 Initial WBTC Balance:", formatWBTC(initialWbtcBalance.toString()), "BTC");
      console.log("Expected WBTC Equivalent:", formatWBTC(expectedWbtcEquivalent.toString()), "BTC");
      console.log("User2 Initial USDC Balance:", formatUSDC(initialUsdcBalance.toString()), "USD");
  
      await massSmartContract.connect(user2).supplicateWBTCtoUSDC(usdcAmount, bitcoinPrice);
  
      const finalWbtcBalance = await massSmartContract.wbtcBalances(user2.address); // Satoshis
      const finalUsdcBalance = await massSmartContract.usdcBalances(user2.address); // Cents
  
      console.log("User2 Final WBTC Balance:", formatWBTC(finalWbtcBalance.toString()), "BTC");
      console.log("User2 Final USDC Balance:", formatUSDC(finalUsdcBalance.toString()), "USD");
  
      expect(finalWbtcBalance.toString()).to.equal(
        (BigInt(initialWbtcBalance) - BigInt(expectedWbtcEquivalent)).toString()
      );
      expect(finalUsdcBalance.toString()).to.equal(
        (BigInt(initialUsdcBalance) + BigInt(usdcAmount)).toString()
      );
    });
  
    it("Should allow User1 to supplicate USDC to WBTC after", async function () {
      const wbtcAmount = 500000; // 0.005 BTC in Satoshis
      const expectedUsdcEquivalent = (wbtcAmount * bitcoinPrice * 100) / 1e8;
  
      const initialUsdcBalance = await massSmartContract.usdcBalances(user1.address); // Cents
      const initialWbtcBalance = await massSmartContract.wbtcBalances(user1.address); // Satoshis
  
      console.log("User1 Initial USDC Balance:", formatUSDC(initialUsdcBalance.toString()), "USD");
      console.log("Expected USDC Equivalent:", formatUSDC(expectedUsdcEquivalent.toString()), "USD");
      console.log("User1 Initial WBTC Balance:", formatWBTC(initialWbtcBalance.toString()), "BTC");
  
      await massSmartContract.connect(user1).supplicateUSDCtoWBTC(wbtcAmount, bitcoinPrice);
  
      const finalUsdcBalance = await massSmartContract.usdcBalances(user1.address); // Cents
      const finalWbtcBalance = await massSmartContract.wbtcBalances(user1.address); // Satoshis
  
      console.log("User1 Final USDC Balance:", formatUSDC(finalUsdcBalance.toString()), "USD");
      console.log("User1 Final WBTC Balance:", formatWBTC(finalWbtcBalance.toString()), "BTC");
  
      expect(finalUsdcBalance.toString()).to.equal(
        (BigInt(initialUsdcBalance) - BigInt(expectedUsdcEquivalent)).toString()
      );
      expect(finalWbtcBalance.toString()).to.equal(
        (BigInt(initialWbtcBalance) + BigInt(wbtcAmount)).toString()
      );
    });
  
    it("Should allow User2 to supplicate USDC to WBTC after", async function () {
      const wbtcAmount = 1000000; // 0.01 BTC in Satoshis
      const expectedUsdcEquivalent = (wbtcAmount * bitcoinPrice * 100) / 1e8;
  
      const initialUsdcBalance = await massSmartContract.usdcBalances(user2.address); // Cents
      const initialWbtcBalance = await massSmartContract.wbtcBalances(user2.address); // Satoshis
  
      console.log("User2 Initial USDC Balance:", formatUSDC(initialUsdcBalance.toString()), "USD");
      console.log("Expected USDC Equivalent:", formatUSDC(expectedUsdcEquivalent.toString()), "USD");
      console.log("User2 Initial WBTC Balance:", formatWBTC(initialWbtcBalance.toString()), "BTC");
  
      await massSmartContract.connect(user2).supplicateUSDCtoWBTC(wbtcAmount, bitcoinPrice);
  
      const finalUsdcBalance = await massSmartContract.usdcBalances(user2.address); // Cents
      const finalWbtcBalance = await massSmartContract.wbtcBalances(user2.address); // Satoshis
  
      console.log("User2 Final USDC Balance:", formatUSDC(finalUsdcBalance.toString()), "USD");
      console.log("User2 Final WBTC Balance:", formatWBTC(finalWbtcBalance.toString()), "BTC");
  
      expect(finalUsdcBalance.toString()).to.equal(
        (BigInt(initialUsdcBalance) - BigInt(expectedUsdcEquivalent)).toString()
      );
      expect(finalWbtcBalance.toString()).to.equal(
        (BigInt(initialWbtcBalance) + BigInt(wbtcAmount)).toString()
      );
    });
  });
});