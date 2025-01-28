import { expect } from "chai";
import { ethers } from "hardhat";

// Helper functions for formatting
const formatAUSD = (cents) => {
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
        value: ethers.parseEther("0.01"), // 0.1 ETH
    });

    console.log("Arells Wallet Address:", arellsWallet.address);

    // Generate random wallets for User1 and User2
    user1 = {
        aBTCWallet: ethers.Wallet.createRandom().connect(deployer.provider),
        aUSDWallet: ethers.Wallet.createRandom(),
    };
    user2 = {
        aBTCWallet: ethers.Wallet.createRandom().connect(deployer.provider),
        aUSDWallet: ethers.Wallet.createRandom(),
    };

    console.log("User1 aBTC Address:", user1.aBTCWallet.address);
    console.log("User1 aUSD Address:", user1.aUSDWallet.address);
    console.log("User2 aBTC Address:", user2.aBTCWallet.address);
    console.log("User2 aUSD Address:", user2.aUSDWallet.address);

      // Fund User1 and User2 aBTC wallets
    await deployer.sendTransaction({
      to: user1.aBTCWallet.address,
      value: ethers.parseEther("0.01"), // 1 ETH
    });
    await deployer.sendTransaction({
      to: user2.aBTCWallet.address,
      value: ethers.parseEther("0.01"), // 1 ETH
    });

    // Deploy a mock cbBTC token
    const MockCBTC = await ethers.getContractFactory("MockCBTC");
    const mockCBTC = await MockCBTC.deploy();
    await mockCBTC.waitForDeployment();
    const mockCBTCAddress = await mockCBTC.getAddress();
    console.log("Mock CBTC Contract Deployed at:", mockCBTCAddress);

    // Deploy the MASSsmartContract with constructor arguments
    const MassSmartContract = await ethers.getContractFactory("MASSsmartContract");
    massSmartContract = await MassSmartContract.deploy(mockCBTCAddress, arellsWallet.address);
    await massSmartContract.waitForDeployment();
    console.log("MASSsmartContract Deployed at:", await massSmartContract.getAddress());

    // Add mock balances for both users
    await massSmartContract.setBalances(user1.aBTCWallet.address, 20000000, 0); // 0.2 BTC, 0 USD
    await massSmartContract.setBalances(user2.aBTCWallet.address, 15000000, 0); // 0.15 BTC, 0 USD
});

  describe("Supplicating aBTC to  and aUSD to aBTC for Multiple Users", function () {
    it("Should allow User1 to supplicate aBTC to aUSD first", async function () {
      const usdAmount = BigInt(112202); // $1122.02 in cents
      const bitcoinPrice = BigInt(60000); // $60,000 per Bitcoin
      
      // Calculating expected WBTC (satoshis) equivalent
      const expectedWbtcEquivalent = (usdAmount * 10n**8n) / bitcoinPrice;

      // Initial balances
      const initialWbtcBalance = await massSmartContract.aBTCBalance(user1.aBTCWallet.address);
      const initialUsdBalance = await massSmartContract.aUSDBalance(user1.aUSDWallet.address);

      console.log("User1 Initial aBTC Balance:", formatABTC(initialWbtcBalance.toString()), "BTC");
      console.log("User1 Initial aUSD Balance:", formatAUSD(initialUsdBalance.toString()), "USD");

      // Supplicate WBTC to USDC
      await massSmartContract.connect(user1.aBTCWallet).supplicateABTCtoAUSD(usdAmount, bitcoinPrice);

      // Final balances
      const finalWbtcBalance = await massSmartContract.aBTCBalance(user1.aBTCWallet.address);
      const finalUsdBalance = await massSmartContract.aUSDBalance(user1.aUSDWallet.address);

      console.log("User1 Final aBTC Balance:", formatABTC(finalWbtcBalance.toString()), "BTC");
      console.log("User1 Final aUSD Balance:", formatAUSD(finalUsdBalance.toString()), "USD");

      // Assertions
      expect(finalWbtcBalance.toString()).to.equal(
        (BigInt(initialWbtcBalance) - BigInt(expectedWbtcEquivalent)).toString()
      );
      expect(finalUsdBalance.toString()).to.equal(
        (BigInt(initialUsdBalance) + BigInt(usdAmount)).toString()
      );
    });

    it("Should allow User2 to supplicate aBTC to aUSD first", async function () {
      const usdAmount = 75000; // $750 x 100 (in cents)
      const expectedWbtcEquivalent = Math.floor((usdAmount * 1e8) / (bitcoinPrice * 100));

      // Initial balances
      const initialWbtcBalance = await massSmartContract.aBTCBalance(user2.aBTCWallet.address);
      const initialUsdBalance = await massSmartContract.aUSDBalance(user2.aUSDWallet.address);

      console.log("User2 Initial aBTC Balance:", formatABTC(initialWbtcBalance.toString()), "BTC");
      console.log("User2 Initial aUSD Balance:", formatAUSD(initialUsdBalance.toString()), "USD");

      // Supplicate WBTC to USDC
      await massSmartContract.connect(user2.aBTCWallet).supplicateABTCtoAUSD(usdAmount, bitcoinPrice);

      // Final balances
      const finalWbtcBalance = await massSmartContract.aBTCBalance(user2.aBTCWallet.address);
      const finalUsdBalance = await massSmartContract.aUSDBalance(user2.aUSDWallet.address);

      console.log("User2 Final aBTC Balance:", formatABTC(finalWbtcBalance.toString()), "BTC");
      console.log("User2 Final aUSD Balance:", formatAUSD(finalUsdBalance.toString()), "USD");

      // Assertions
      expect(finalWbtcBalance.toString()).to.equal(
        (BigInt(initialWbtcBalance) - BigInt(expectedWbtcEquivalent)).toString()
      );
      expect(finalUsdBalance.toString()).to.equal(
        (BigInt(initialUsdBalance) + BigInt(usdAmount)).toString()
      );
    });

    it("Should allow User1 to supplicate aUSD to aBTC after", async function () {
      const wbtcAmount = 500000; // 0.005 BTC in Satoshis
      const expectedUsdEquivalent = Math.floor((wbtcAmount * bitcoinPrice * 100) / 1e8);

      // Initial balances
      const initialWbtcBalance = await massSmartContract.aBTCBalance(user1.aBTCWallet.address);
      const initialUsdBalance = await massSmartContract.aUSDBalance(user1.aUSDWallet.address);

      console.log("User1 Initial aBTC Balance:", formatABTC(initialWbtcBalance.toString()), "BTC");
      console.log("User1 Initial aUSD Balance:", formatAUSD(initialUsdBalance.toString()), "USD");

      // Supplicate USDC to WBTC
      await massSmartContract.connect(user1.wbtcWallet).supplicateAUSDtoABTC(wbtcAmount, bitcoinPrice);

      // Final balances
      const finalWbtcBalance = await massSmartContract.aBTCBalance(user1.aBTCWallet.address);
      const finalUsdBalance = await massSmartContract.aUSDBalance(user1.aUSDWallet.address);

      console.log("User1 Final aBTC Balance:", formatABTC(finalWbtcBalance.toString()), "BTC");
      console.log("User1 Final aUSD Balance:", formatAUSDC(finalUsdBalance.toString()), "USD");

      // Assertions
      expect(finalWbtcBalance.toString()).to.equal(
        (BigInt(initialWbtcBalance) + BigInt(wbtcAmount)).toString()
      );
      expect(finalUsdBalance.toString()).to.equal(
        (BigInt(initialUsdBalance) - BigInt(expectedUsdEquivalent)).toString()
      );
    });

    it("Should allow User2 to supplicate aUSD to aBTC after", async function () {
      const wbtcAmount = 1000000; // 0.01 BTC in Satoshis
      const expectedUsdEquivalent = Math.floor((wbtcAmount * bitcoinPrice * 100) / 1e8);

      // Initial balances
      const initialWbtcBalance = await massSmartContract.aBTCBalance(user2.aBTCWallet.address);
      const initialUsdBalance = await massSmartContract.aUSDBalance(user2.aUSDWallet.address);

      console.log("User2 Initial aBTC Balance:", formatABTC(initialWbtcBalance.toString()), "BTC");
      console.log("User2 Initial aUSD Balance:", formatAUSD(initialUsdBalance.toString()), "USD");

      // Supplicate USDC to WBTC
      await massSmartContract.connect(user2.wbtcWallet).supplicateAUSDtoABTC(wbtcAmount, bitcoinPrice);

      // Final balances
      const finalWbtcBalance = await massSmartContract.aBTCBalance(user2.aBTCWallet.address);
      const finalUsdBalance = await massSmartContract.aUSDBalance(user2.aUSDWallet.address);

      console.log("User2 Final aBTC Balance:", formatABTC(finalWbtcBalance.toString()), "BTC");
      console.log("User2 Final aUSD Balance:", formatAUSD(finalUsdBalance.toString()), "USD");

      // Assertions
      expect(finalWbtcBalance.toString()).to.equal(
        (BigInt(initialWbtcBalance) + BigInt(wbtcAmount)).toString()
      );
      expect(finalUsdBalance.toString()).to.equal(
        (BigInt(initialUsdBalance) - BigInt(expectedUsdEquivalent)).toString()
      );
    });
  });
});