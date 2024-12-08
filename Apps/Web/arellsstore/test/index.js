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
  let user1, user2, user3;
  let usdcAddressUser1, usdcAddressUser2;
  const bitcoinPrice = 60000; // Bitcoin price for testing

  before(async () => {
    [user1, user2, user3] = await ethers.getSigners();

    console.log("User1 Address:", user1.address);
    console.log("User2 Address:", user2.address);
    console.log("User3 Address:", user3.address);

    // Deploy MASSsmartContract
    const MassSmartContract = await ethers.getContractFactory("MASSsmartContract");
    massSmartContract = await MassSmartContract.deploy();
    await massSmartContract.waitForDeployment();

    console.log("Contract Deployed at:", massSmartContract.target);

    // Simulate separate USDC addresses for each user
    usdcAddressUser1 = ethers.Wallet.createRandom().address;
    usdcAddressUser2 = ethers.Wallet.createRandom().address;

    console.log("User1 USDC Address:", usdcAddressUser1);
    console.log("User2 USDC Address:", usdcAddressUser2);
  });

  describe("createMASS", function () {
    it("Should allow User1 to create MASS", async function () {
      await massSmartContract.connect(user1).createMASS(usdcAddressUser1);
  
      const storedUsdcUser1 = await massSmartContract.userToUsdcAddress(user1.address);
      console.log("User1 Stored USDC Address:", storedUsdcUser1);
  
      expect(storedUsdcUser1).to.equal(usdcAddressUser1);
    });
  
    it("Should revert if MASS is already created by User1", async function () {
      await expect(
        massSmartContract.connect(user1).createMASS(usdcAddressUser1)
      ).to.be.revertedWith("MASS already created by this user");
    });
  
    it("Should allow User2 to create MASS", async function () {
      await massSmartContract.connect(user2).createMASS(usdcAddressUser2);
  
      const storedUsdcUser2 = await massSmartContract.userToUsdcAddress(user2.address);
      console.log("User2 Stored USDC Address:", storedUsdcUser2);
  
      expect(storedUsdcUser2).to.equal(usdcAddressUser2);
    });
  
    it("Should revert if MASS is already created by User2", async function () {
      await expect(
        massSmartContract.connect(user2).createMASS(usdcAddressUser2)
      ).to.be.revertedWith("MASS already created by this user");
    });
  });

  describe("Minting WBTC by Multiple Users", function () {
    it("Should allow User1 to mint WBTC", async function () {
      const aBTC = 40000000; // 0.4 BTC in Satoshis
      const acVactTas = 20000000; // 0.2 BTC in Satoshis
      const expectedMintAmount = aBTC - acVactTas;

      await massSmartContract.connect(user1).mint(aBTC, acVactTas);

      const user1Balance = await massSmartContract.balances(user1.address);
      console.log("User1 Balance After Minting:", formatWBTC(user1Balance.toString()), "BTC");

      expect(user1Balance.toString()).to.equal(expectedMintAmount.toString());
    });

    it("Should allow User2 to mint WBTC", async function () {
      const aBTC = 15000000; // 0.15 BTC in Satoshis
      const acVactTas = 5000000; // 0.05 BTC in Satoshis
      const expectedMintAmount = aBTC - acVactTas;

      await massSmartContract.connect(user2).mint(aBTC, acVactTas);

      const user2Balance = await massSmartContract.balances(user2.address);
      console.log("User2 Balance After Minting:", formatWBTC(user2Balance.toString()), "BTC");

      expect(user2Balance.toString()).to.equal(expectedMintAmount.toString());
    });
  });

  describe("Supplicating WBTC to USDC and USDC to WBTC for Multiple Users", function () {
    it("Should allow User1 to supplicate WBTC to USDC first", async function () {
      const usdcAmount = 112202; // $1122.02 x 100 (in cents)
      const expectedWbtcEquivalent = Math.floor(((usdcAmount * 1e8) / 100) / bitcoinPrice);
  
      const initialWbtcBalance = await massSmartContract.balances(user1.address); // Satoshis
      const initialUsdcBalance = await massSmartContract.balances(usdcAddressUser1); // Cents
  
      console.log("User1 Initial WBTC Balance:", formatWBTC(initialWbtcBalance.toString()), "BTC");
      console.log("Expected WBTC Equivalent:", formatWBTC(expectedWbtcEquivalent.toString()), "BTC");
      console.log("User1 Initial USDC Balance:", formatUSDC(initialUsdcBalance.toString()), "USD");
  
      await massSmartContract.connect(user1).supplicateWBTCtoUSDC(usdcAmount, bitcoinPrice);
  
      const finalWbtcBalance = await massSmartContract.balances(user1.address); // Satoshis
      const finalUsdcBalance = await massSmartContract.balances(usdcAddressUser1); // Cents
  
      console.log("User1 Final WBTC Balance:", formatWBTC(finalWbtcBalance.toString()), "BTC");
      console.log("User1 Final USDC Balance:", formatUSDC(finalUsdcBalance.toString()), "USD");
  
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
  
      const initialWbtcBalance = await massSmartContract.balances(user2.address); // Satoshis
      const initialUsdcBalance = await massSmartContract.balances(usdcAddressUser2); // Cents
  
      console.log("User2 Initial WBTC Balance:", formatWBTC(initialWbtcBalance.toString()), "BTC");
      console.log("Expected WBTC Equivalent:", formatWBTC(expectedWbtcEquivalent.toString()), "BTC");
      console.log("User2 Initial USDC Balance:", formatUSDC(initialUsdcBalance.toString()), "USD");
  
      await massSmartContract.connect(user2).supplicateWBTCtoUSDC(usdcAmount, bitcoinPrice);
  
      const finalWbtcBalance = await massSmartContract.balances(user2.address); // Satoshis
      const finalUsdcBalance = await massSmartContract.balances(usdcAddressUser2); // Cents
  
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
  
      const initialUsdcBalance = await massSmartContract.balances(usdcAddressUser1); // Cents
      const initialWbtcBalance = await massSmartContract.balances(user1.address); // Satoshis
  
      console.log("User1 Initial USDC Balance:", formatUSDC(initialUsdcBalance.toString()), "USD");
      console.log("Expected USDC Equivalent:", formatUSDC(expectedUsdcEquivalent.toString()), "USD");
      console.log("User1 Initial WBTC Balance:", formatWBTC(initialWbtcBalance.toString()), "BTC");
  
      await massSmartContract.connect(user1).supplicateUSDCtoWBTC(wbtcAmount, bitcoinPrice);
  
      const finalUsdcBalance = await massSmartContract.balances(usdcAddressUser1); // Cents
      const finalWbtcBalance = await massSmartContract.balances(user1.address); // Satoshis
  
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
  
      const initialUsdcBalance = await massSmartContract.balances(usdcAddressUser2); // Cents
      const initialWbtcBalance = await massSmartContract.balances(user2.address); // Satoshis
  
      console.log("User2 Initial USDC Balance:", formatUSDC(initialUsdcBalance.toString()), "USD");
      console.log("Expected USDC Equivalent:", formatUSDC(expectedUsdcEquivalent.toString()), "USD");
      console.log("User2 Initial WBTC Balance:", formatWBTC(initialWbtcBalance.toString()), "BTC");
  
      await massSmartContract.connect(user2).supplicateUSDCtoWBTC(wbtcAmount, bitcoinPrice);
  
      const finalUsdcBalance = await massSmartContract.balances(usdcAddressUser2); // Cents
      const finalWbtcBalance = await massSmartContract.balances(user2.address); // Satoshis
  
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