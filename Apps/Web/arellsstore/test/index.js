const { expect } = require("chai");
const { ethers } = require("hardhat");

// Helper functions for formatting
const formatAUSDC = (cents) => {
  const dollars = (cents / 100).toFixed(2);
  return dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatABTC = (sats) => {
  return (sats / 1e8).toFixed(6);
};

describe("MASSsmartContract Tests", function () {
  let massSmartContract;
  let arellsWallet, user1, user2;
  const bitcoinPrice = 60000;

  before(async () => {
    const [deployer] = await ethers.getSigners();
  
    // Create Arells wallet and fund it
    arellsWallet = ethers.Wallet.createRandom().connect(deployer.provider);
  
    await deployer.sendTransaction({
      to: arellsWallet.address,
      value: ethers.parseEther("0.1"), // 0.1 ETH
    });
  
    console.log("Arells Wallet Address:", arellsWallet.address);
  
    // Generate random wallets for User1 and User2
    user1 = {
      aBTCWallet: ethers.Wallet.createRandom().connect(deployer.provider),
      aUSDCWallet: ethers.Wallet.createRandom(),
    };
    user2 = {
      aBTCWallet: ethers.Wallet.createRandom().connect(deployer.provider),
      aUSDCWallet: ethers.Wallet.createRandom(),
    };
  
    console.log("User1 aBTC Address:", user1.aBTCWallet.address);
    console.log("User1 aUSDC Address:", user1.aUSDCWallet.address);
    console.log("User2 aBTC Address:", user2.aBTCWallet.address);
    console.log("User2 aUSDC Address:", user2.aUSDCWallet.address);
  
    // Deploy a mock cbBTC token
    const MockCBTC = await ethers.getContractFactory("MockCBTC");
    const mockCBTC = await MockCBTC.deploy();
    await mockCBTC.waitForDeployment();
    console.log("Mock CBTC Contract Deployed at:", mockCBTC.address);
  
    // Deploy the MASSsmartContract with constructor arguments
    const MassSmartContract = await ethers.getContractFactory("MASSsmartContract");
    massSmartContract = await MassSmartContract.deploy(mockCBTC.address, arellsWallet.address);
    await massSmartContract.waitForDeployment();
  
    console.log("MASSsmartContract Deployed at:", massSmartContract.address);
  
    // Add mock balances for both users
    await massSmartContract.setBalances(user1.aBTCWallet.address, 20000000, 0); // 0.2 BTC, 0 USDC
    await massSmartContract.setBalances(user2.aBTCWallet.address, 15000000, 0); // 0.15 BTC, 0 USDC
  });

  describe("Supplicating aBTC to aUSDC and aUSDC to aBTC for Multiple Users", function () {
    it("Should allow User1 to supplicate aBTC to aUSDC first", async function () {
      const usdcAmount = 112202; // $1122.02 x 100 (in cents)
      const expectedWbtcEquivalent = Math.floor(((usdcAmount * 1e8) / 100) / bitcoinPrice);

      // Initial balances
      const initialWbtcBalance = await massSmartContract.aBTCBalance(user1.aBTCWallet.address);
      const initialUsdcBalance = await massSmartContract.aBTCBalance(user1.aBTCWallet.address);

      console.log("User1 Initial aBTC Balance:", formatABTC(initialWbtcBalance.toString()), "BTC");
      console.log("User1 Initial aUSDC Balance:", formatAUSDC(initialUsdcBalance.toString()), "USD");

      // Supplicate WBTC to USDC
      await massSmartContract.connect(user1.aBTCWallet).supplicateWBTCtoUSDC(usdcAmount, bitcoinPrice);

      // Final balances
      const finalWbtcBalance = await massSmartContract.aBTCBalance(user1.aBTCWallet.address);
      const finalUsdcBalance = await massSmartContract.aUSDCBalance(user1.aBTCWallet.address);

      console.log("User1 Final aBTC Balance:", formatABTC(finalWbtcBalance.toString()), "BTC");
      console.log("User1 Final aUSDC Balance:", formatAUSDC(finalUsdcBalance.toString()), "USD");

      // Assertions
      expect(finalWbtcBalance.toString()).to.equal(
        (BigInt(initialWbtcBalance) - BigInt(expectedWbtcEquivalent)).toString()
      );
      expect(finalUsdcBalance.toString()).to.equal(
        (BigInt(initialUsdcBalance) + BigInt(usdcAmount)).toString()
      );
    });

    it("Should allow User2 to supplicate aBTC to aUSDC first", async function () {
      const usdcAmount = 75000; // $750 x 100 (in cents)
      const expectedWbtcEquivalent = Math.floor(((usdcAmount * 1e8) / 100) / bitcoinPrice);

      // Initial balances
      const initialWbtcBalance = await massSmartContract.aBTCBalance(user2.aBTCWallet.address);
      const initialUsdcBalance = await massSmartContract.aUSDCBalance(user2.aBTCWallet.address);

      console.log("User2 Initial aBTC Balance:", formatABTC(initialWbtcBalance.toString()), "BTC");
      console.log("User2 Initial aUSDC Balance:", formatAUSDC(initialUsdcBalance.toString()), "USD");

      // Supplicate WBTC to USDC
      await massSmartContract.connect(user2.aBTCWallet).supplicateABTCtoAUSDC(usdcAmount, bitcoinPrice);

      // Final balances
      const finalWbtcBalance = await massSmartContract.aBTCBalance(user2.aBTCWallet.address);
      const finalUsdcBalance = await massSmartContract.aUSDCBalance(user2.aBTCWallet.address);

      console.log("User2 Final aBTC Balance:", formatABTC(finalWbtcBalance.toString()), "BTC");
      console.log("User2 Final aUSDC Balance:", formatAUSDC(finalUsdcBalance.toString()), "USD");

      // Assertions
      expect(finalWbtcBalance.toString()).to.equal(
        (BigInt(initialWbtcBalance) - BigInt(expectedWbtcEquivalent)).toString()
      );
      expect(finalUsdcBalance.toString()).to.equal(
        (BigInt(initialUsdcBalance) + BigInt(usdcAmount)).toString()
      );
    });

    it("Should allow User1 to supplicate aUSDC to aBTC after", async function () {
      const wbtcAmount = 500000; // 0.005 BTC in Satoshis
      const expectedUsdcEquivalent = (wbtcAmount * bitcoinPrice * 100) / 1e8;

      // Initial balances
      const initialWbtcBalance = await massSmartContract.aBTCBalances(user1.aBTCWallet.address);
      const initialUsdcBalance = await massSmartContract.aUSDCBalances(user1.aUSDCWallet.address);

      console.log("User1 Initial aBTC Balance:", formatABTC(initialWbtcBalance.toString()), "BTC");
      console.log("User1 Initial aUSDC Balance:", formatAUSDC(initialUsdcBalance.toString()), "USD");

      // Supplicate USDC to WBTC
      await massSmartContract.connect(user1.wbtcWallet).supplicateAUSDCtoABTC(wbtcAmount, bitcoinPrice);

      // Final balances
      const finalWbtcBalance = await massSmartContract.aBTCBalance(user1.aBTCWallet.address);
      const finalUsdcBalance = await massSmartContract.aUSDCBalance(user1.aUSDCWallet.address);

      console.log("User1 Final aBTC Balance:", formatABTC(finalWbtcBalance.toString()), "BTC");
      console.log("User1 Final aUSDC Balance:", formatAUSDC(finalUsdcBalance.toString()), "USD");

      // Assertions
      expect(finalWbtcBalance.toString()).to.equal(
        (BigInt(initialWbtcBalance) + BigInt(wbtcAmount)).toString()
      );
      expect(finalUsdcBalance.toString()).to.equal(
        (BigInt(initialUsdcBalance) - BigInt(expectedUsdcEquivalent)).toString()
      );
    });

    it("Should allow User2 to supplicate aUSDC to aWBTC after", async function () {
      const wbtcAmount = 1000000; // 0.01 BTC in Satoshis
      const expectedUsdcEquivalent = (wbtcAmount * bitcoinPrice * 100) / 1e8;

      // Initial balances
      const initialWbtcBalance = await massSmartContract.aBTCBalance(user2.aBTCWallet.address);
      const initialUsdcBalance = await massSmartContract.aUSDCBalance(user2.aBTCWallet.address);

      console.log("User2 Initial aBTC Balance:", formatABTC(initialWbtcBalance.toString()), "BTC");
      console.log("User2 Initial aUSDC Balance:", formatAUSDC(initialUsdcBalance.toString()), "USD");

      // Supplicate USDC to WBTC
      await massSmartContract.connect(user2.wbtcWallet).supplicateUSDCtoWBTC(wbtcAmount, bitcoinPrice);

      // Final balances
      const finalWbtcBalance = await massSmartContract.aBTCBalance(user2.aBTCWallet.address);
      const finalUsdcBalance = await massSmartContract.aUSDCBalance(user2.aBTCWallet.address);

      console.log("User2 Final aBTC Balance:", formatABTC(finalWbtcBalance.toString()), "BTC");
      console.log("User2 Final aUSDC Balance:", formatAUSDC(finalUsdcBalance.toString()), "USD");

      // Assertions
      expect(finalWbtcBalance.toString()).to.equal(
        (BigInt(initialWbtcBalance) + BigInt(wbtcAmount)).toString()
      );
      expect(finalUsdcBalance.toString()).to.equal(
        (BigInt(initialUsdcBalance) - BigInt(expectedUsdcEquivalent)).toString()
      );
    });
  });
});