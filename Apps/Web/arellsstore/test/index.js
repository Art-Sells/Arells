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
  let arellsWallet, user1, user2;
  const bitcoinPrice = 60000;

  before(async () => {
    const [deployer] = await ethers.getSigners();

    // Create Arells wallet and fund it
    arellsWallet = ethers.Wallet.createRandom().connect(deployer.provider);

    await deployer.sendTransaction({
      to: arellsWallet.address,
      value: ethers.parseEther("0.1"), // 0.1 MATIC
    });

    console.log("Arells Wallet Address:", arellsWallet.address);

    // Generate random wallets for User1 and User2
    user1 = {
      wbtcWallet: ethers.Wallet.createRandom().connect(deployer.provider),
      usdcWallet: ethers.Wallet.createRandom(),
    };
    user2 = {
      wbtcWallet: ethers.Wallet.createRandom().connect(deployer.provider),
      usdcWallet: ethers.Wallet.createRandom(),
    };

    console.log("User1 WBTC Address:", user1.wbtcWallet.address);
    console.log("User1 WBTC Private Key:", user1.wbtcWallet.privateKey);
    console.log("User1 USDC Address:", user1.usdcWallet.address);
    console.log("User1 USDC Private Key:", user1.usdcWallet.privateKey);
    
    console.log("User2 WBTC Address:", user2.wbtcWallet.address);
    console.log("User2 WBTC Private Key:", user2.wbtcWallet.privateKey);
    console.log("User2 USDC Address:", user2.usdcWallet.address);
    console.log("User2 USDC Private Key:", user2.usdcWallet.privateKey);

    // Fund WBTC wallets
    await arellsWallet.sendTransaction({
      to: user1.wbtcWallet.address,
      value: ethers.parseEther("0.01"),
    });
    await arellsWallet.sendTransaction({
      to: user2.wbtcWallet.address,
      value: ethers.parseEther("0.01"),
    });

    console.log("User1 and User2 WBTC Wallets Funded with 0.01 MATIC Each");

    // Deploy the smart contract
    const MassSmartContract = await ethers.getContractFactory("MASSsmartContract");
    massSmartContract = await MassSmartContract.deploy();
    await massSmartContract.waitForDeployment();

    console.log("Contract Deployed at:", await massSmartContract.getAddress());

    // Add mock WBTC balances for both users
    await massSmartContract.setBalances(user1.wbtcWallet.address, 20000000, 0); // 0.2 BTC, 0 USDC
    await massSmartContract.setBalances(user2.wbtcWallet.address, 15000000, 0); // 0.15 BTC, 0 USDC
  });

  describe("Supplicating WBTC to USDC and USDC to WBTC for Multiple Users", function () {
    it("Should allow User1 to supplicate WBTC to USDC first", async function () {
      const usdcAmount = 112202; // $1122.02 x 100 (in cents)
      const expectedWbtcEquivalent = Math.floor(((usdcAmount * 1e8) / 100) / bitcoinPrice);

      // Initial balances
      const initialWbtcBalance = await massSmartContract.wbtcBalances(user1.wbtcWallet.address);
      const initialUsdcBalance = await massSmartContract.usdcBalances(user1.wbtcWallet.address);

      console.log("User1 Initial WBTC Balance:", formatWBTC(initialWbtcBalance.toString()), "BTC");
      console.log("User1 Initial USDC Balance:", formatUSDC(initialUsdcBalance.toString()), "USD");

      // Supplicate WBTC to USDC
      await massSmartContract.connect(user1.wbtcWallet).supplicateWBTCtoUSDC(usdcAmount, bitcoinPrice);

      // Final balances
      const finalWbtcBalance = await massSmartContract.wbtcBalances(user1.wbtcWallet.address);
      const finalUsdcBalance = await massSmartContract.usdcBalances(user1.wbtcWallet.address);

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

      // Initial balances
      const initialWbtcBalance = await massSmartContract.wbtcBalances(user2.wbtcWallet.address);
      const initialUsdcBalance = await massSmartContract.usdcBalances(user2.wbtcWallet.address);

      console.log("User2 Initial WBTC Balance:", formatWBTC(initialWbtcBalance.toString()), "BTC");
      console.log("User2 Initial USDC Balance:", formatUSDC(initialUsdcBalance.toString()), "USD");

      // Supplicate WBTC to USDC
      await massSmartContract.connect(user2.wbtcWallet).supplicateWBTCtoUSDC(usdcAmount, bitcoinPrice);

      // Final balances
      const finalWbtcBalance = await massSmartContract.wbtcBalances(user2.wbtcWallet.address);
      const finalUsdcBalance = await massSmartContract.usdcBalances(user2.wbtcWallet.address);

      console.log("User2 Final WBTC Balance:", formatWBTC(finalWbtcBalance.toString()), "BTC");
      console.log("User2 Final USDC Balance:", formatUSDC(finalUsdcBalance.toString()), "USD");

      // Assertions
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

      // Initial balances
      const initialWbtcBalance = await massSmartContract.wbtcBalances(user1.wbtcWallet.address);
      const initialUsdcBalance = await massSmartContract.usdcBalances(user1.wbtcWallet.address);

      console.log("User1 Initial WBTC Balance:", formatWBTC(initialWbtcBalance.toString()), "BTC");
      console.log("User1 Initial USDC Balance:", formatUSDC(initialUsdcBalance.toString()), "USD");

      // Supplicate USDC to WBTC
      await massSmartContract.connect(user1.wbtcWallet).supplicateUSDCtoWBTC(wbtcAmount, bitcoinPrice);

      // Final balances
      const finalWbtcBalance = await massSmartContract.wbtcBalances(user1.wbtcWallet.address);
      const finalUsdcBalance = await massSmartContract.usdcBalances(user1.wbtcWallet.address);

      console.log("User1 Final WBTC Balance:", formatWBTC(finalWbtcBalance.toString()), "BTC");
      console.log("User1 Final USDC Balance:", formatUSDC(finalUsdcBalance.toString()), "USD");

      // Assertions
      expect(finalWbtcBalance.toString()).to.equal(
        (BigInt(initialWbtcBalance) + BigInt(wbtcAmount)).toString()
      );
      expect(finalUsdcBalance.toString()).to.equal(
        (BigInt(initialUsdcBalance) - BigInt(expectedUsdcEquivalent)).toString()
      );
    });

    it("Should allow User2 to supplicate USDC to WBTC after", async function () {
      const wbtcAmount = 1000000; // 0.01 BTC in Satoshis
      const expectedUsdcEquivalent = (wbtcAmount * bitcoinPrice * 100) / 1e8;

      // Initial balances
      const initialWbtcBalance = await massSmartContract.wbtcBalances(user2.wbtcWallet.address);
      const initialUsdcBalance = await massSmartContract.usdcBalances(user2.wbtcWallet.address);

      console.log("User2 Initial WBTC Balance:", formatWBTC(initialWbtcBalance.toString()), "BTC");
      console.log("User2 Initial USDC Balance:", formatUSDC(initialUsdcBalance.toString()), "USD");

      // Supplicate USDC to WBTC
      await massSmartContract.connect(user2.wbtcWallet).supplicateUSDCtoWBTC(wbtcAmount, bitcoinPrice);

      // Final balances
      const finalWbtcBalance = await massSmartContract.wbtcBalances(user2.wbtcWallet.address);
      const finalUsdcBalance = await massSmartContract.usdcBalances(user2.wbtcWallet.address);

      console.log("User2 Final WBTC Balance:", formatWBTC(finalWbtcBalance.toString()), "BTC");
      console.log("User2 Final USDC Balance:", formatUSDC(finalUsdcBalance.toString()), "USD");

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