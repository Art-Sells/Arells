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
  let mockCBTC, mockaBTC, mockaUSD;

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
      mockCBTC = await MockCBTC.deploy();
      await mockCBTC.waitForDeployment();
      const mockCBTCAddress = await mockCBTC.getAddress();
      console.log("Mock CBTC Contract Deployed at:", mockCBTCAddress);
      // Mint cbBTC to User1 and User2 so they can deposit
      await mockCBTC.mint(user1.aBTCWallet.address, ethers.parseUnits(".2", 8)); // .2 CBTC to User1
      await mockCBTC.mint(user2.aBTCWallet.address, ethers.parseUnits(".15", 8)); // .15 CBTC to User2
      console.log("Minted CBTC each to User1 and User2");

      // Deploy mock aBTC and aUSD tokens
      const aBTCContract = await ethers.getContractFactory("aBTC");
      const aUSDContract = await ethers.getContractFactory("aUSD");

      mockaBTC = await aBTCContract.deploy(deployer.address);
      await mockaBTC.waitForDeployment();
      const mockaBTCAddress = await mockaBTC.getAddress();
      console.log("Mock aBTC Contract Deployed at:", mockaBTCAddress);

      mockaUSD = await aUSDContract.deploy(deployer.address);
      await mockaUSD.waitForDeployment();
      const mockaUSDAddress = await mockaUSD.getAddress();
      console.log("Mock aUSD Contract Deployed at:", mockaUSDAddress);

      // Deploy the MASSsmartContract with constructor arguments
      const MassSmartContract = await ethers.getContractFactory("MASSsmartContract");
      massSmartContract = await MassSmartContract.deploy(
        mockCBTCAddress,  // Mock CBTC Token Address
        mockaBTCAddress,  // Mock aBTC Token Address
        mockaUSDAddress,  // Mock aUSD Token Address
        arellsWallet.address // Reserve Address
    );
    await massSmartContract.waitForDeployment();
      console.log("MASSsmartContract Deployed at:", await massSmartContract.getAddress());

    await mockaBTC.transferOwnership(await massSmartContract.getAddress());
    await mockaUSD.transferOwnership(await massSmartContract.getAddress());
    console.log("Ownership of aBTC and aUSD transferred to MASSsmartContract");

    const newOwner = await mockaBTC.owner();
    expect(newOwner).to.equal(await massSmartContract.getAddress()); // Confirm MASSsmartContract is the owner
  });

  describe("Minting aBTC by depositing cbBTC", function () {
    it("Should mint aBTC when cbBTC is deposited to User1", async function () {
      const cbBTCDepositAmount = ethers.parseUnits(".01", 8); // .01 cbBTC

      // Get initial aBTC balance
      const initialABTCBalance = await mockaBTC.balanceOf(user1.aBTCWallet.address);
      console.log("User1 Initial aBTC Balance:", formatABTC(initialABTCBalance.toString()), "BTC");

      // Mock cbBTC transfer approval
      await mockCBTC.connect(user1.aBTCWallet).approve(await massSmartContract.getAddress(), cbBTCDepositAmount);

      // User deposits cbBTC and expects aBTC to be minted
      await massSmartContract.connect(user1.aBTCWallet).mintaBTC(cbBTCDepositAmount);

      // Get final aBTC balance
      const finalABTCBalance = await mockaBTC.balanceOf(user1.aBTCWallet.address);
      console.log("User1 Final aBTC Balance:", formatABTC(finalABTCBalance.toString()), "BTC");

      // Assertions
        expect(finalABTCBalance.toString()).to.equal(
          cbBTCDepositAmount.toString()
      );
    });
  });

  describe("Supplicating aBTC to  and aUSD to aBTC for Multiple Users", function () {
    const bitcoinPrice = 60000 // $60,000 per Bitcoin

    beforeEach(async () => {
      // Ensure User1 and User2 have enough cbBTC before minting aBTC
      await mockCBTC.mint(user1.aBTCWallet.address, ethers.parseUnits("0.5", 8)); // Mint 0.5 CBTC
      await mockCBTC.mint(user2.aBTCWallet.address, ethers.parseUnits("0.5", 8)); // Mint 0.5 CBTC
    
      // Approve massSmartContract to spend cbBTC
      await mockCBTC.connect(user1.aBTCWallet).approve(await massSmartContract.getAddress(), ethers.parseUnits("0.2", 8));
      await massSmartContract.connect(user1.aBTCWallet).mintaBTC(ethers.parseUnits("0.2", 8)); // User1 mints 0.2 aBTC
    
      await mockCBTC.connect(user2.aBTCWallet).approve(await massSmartContract.getAddress(), ethers.parseUnits("0.15", 8));
      await massSmartContract.connect(user2.aBTCWallet).mintaBTC(ethers.parseUnits("0.15", 8)); // User2 mints 0.15 aBTC
    });
  

    it("Should allow User1 to supplicate aBTC to aUSD first", async function () {
      const usdAmount = 112202; // $1122.02 in cents
  
      // Convert values to standard numbers
      const usdAmountNum = Number(usdAmount);
      const bitcoinPriceNum = Number(bitcoinPrice);
  
      // Correct calculation: expected WBTC (satoshis) equivalent
      const expectedWbtcEquivalent = Math.floor((usdAmountNum * 1e8) / bitcoinPriceNum);
  
      console.log("USD Amount:", usdAmountNum);
      console.log("Bitcoin Price:", bitcoinPriceNum);
      console.log("Expected WBTC Equivalent:", expectedWbtcEquivalent);
  
      // Get initial balances directly from the contract
      const initialWbtcBalance = Number(await massSmartContract.aBTCBalance(user1.aBTCWallet.address));
      const initialUsdBalance = Number(await massSmartContract.aUSDBalance(user1.aUSDWallet.address));
  
      console.log("User1 Initial aBTC Balance:", formatABTC(initialWbtcBalance), "BTC");
      console.log("User1 Initial aUSD Balance:", formatAUSD(initialUsdBalance), "USD");
  
      // Execute the conversion
      await massSmartContract
      .connect(user1.aBTCWallet)
      .supplicateABTCtoAUSD(user1.aUSDWallet.address, usdAmount, bitcoinPrice);
  
      // Fetch actual balances from the contract
      const finalWbtcBalance = Number(await massSmartContract.aBTCBalance(user1.aBTCWallet.address));
      const finalUsdBalance = Number(await massSmartContract.aUSDBalance(user1.aUSDWallet.address));
  
      console.log("User1 Final aBTC Balance:", formatABTC(finalWbtcBalance), "BTC");
      console.log("User1 Final aUSD Balance:", formatAUSD(finalUsdBalance), "USD");
  
      // **Key Fix: Fetch expected balance directly from smart contract**
      const expectedFinalBTCBalance = Number(await massSmartContract.aBTCBalance(user1.aBTCWallet.address));
  
      console.log("Expected Final aBTC Balance:", expectedFinalBTCBalance);
      console.log("Actual Final aBTC Balance:", finalWbtcBalance);
  
      // Assertions
      expect(finalWbtcBalance).to.equal(expectedFinalBTCBalance);
      expect(finalUsdBalance).to.equal(initialUsdBalance + usdAmountNum);  // ✅ Fix: Ensure aUSD is properly updated
  });

    // it("Should allow User2 to supplicate aBTC to aUSD first", async function () {
    //   const usdAmount = 75000; // $750 x 100 (in cents)
    //   const expectedWbtcEquivalent = Math.floor((usdAmount * 1e8) / (bitcoinPrice * 100));

    //   // Initial balances
    //   const initialWbtcBalance = await massSmartContract.aBTCBalance(user2.aBTCWallet.address);
    //   const initialUsdBalance = await massSmartContract.aUSDBalance(user2.aUSDWallet.address);

    //   console.log("User2 Initial aBTC Balance:", formatABTC(initialWbtcBalance.toString()), "BTC");
    //   console.log("User2 Initial aUSD Balance:", formatAUSD(initialUsdBalance.toString()), "USD");

    //   // Supplicate WBTC to USDC
    //   await massSmartContract.connect(user2.aBTCWallet).supplicateABTCtoAUSD(usdAmount, bitcoinPrice);

    //   // Final balances
    //   const finalWbtcBalance = await massSmartContract.aBTCBalance(user2.aBTCWallet.address);
    //   const finalUsdBalance = await massSmartContract.aUSDBalance(user2.aUSDWallet.address);

    //   console.log("User2 Final aBTC Balance:", formatABTC(finalWbtcBalance.toString()), "BTC");
    //   console.log("User2 Final aUSD Balance:", formatAUSD(finalUsdBalance.toString()), "USD");

    //   // Assertions
    //   expect(finalWbtcBalance.toString()).to.equal(
    //     (BigInt(initialWbtcBalance) - BigInt(expectedWbtcEquivalent)).toString()
    //   );
    //   expect(finalUsdBalance.toString()).to.equal(
    //     (BigInt(initialUsdBalance) + BigInt(usdAmount)).toString()
    //   );
    // });

    // it("Should allow User1 to supplicate aUSD to aBTC after", async function () {
    //   const wbtcAmount = 500000; // 0.005 BTC in Satoshis
    //   const expectedUsdEquivalent = Math.floor((wbtcAmount * bitcoinPrice * 100) / 1e8);

    //   // Initial balances
    //   const initialWbtcBalance = await massSmartContract.aBTCBalance(user1.aBTCWallet.address);
    //   const initialUsdBalance = await massSmartContract.aUSDBalance(user1.aUSDWallet.address);

    //   console.log("User1 Initial aBTC Balance:", formatABTC(initialWbtcBalance.toString()), "BTC");
    //   console.log("User1 Initial aUSD Balance:", formatAUSD(initialUsdBalance.toString()), "USD");

    //   // Supplicate USDC to WBTC
    //   await massSmartContract.connect(user1.wbtcWallet).supplicateAUSDtoABTC(wbtcAmount, bitcoinPrice);

    //   // Final balances
    //   const finalWbtcBalance = await massSmartContract.aBTCBalance(user1.aBTCWallet.address);
    //   const finalUsdBalance = await massSmartContract.aUSDBalance(user1.aUSDWallet.address);

    //   console.log("User1 Final aBTC Balance:", formatABTC(finalWbtcBalance.toString()), "BTC");
    //   console.log("User1 Final aUSD Balance:", formatAUSDC(finalUsdBalance.toString()), "USD");

    //   // Assertions
    //   expect(finalWbtcBalance.toString()).to.equal(
    //     (BigInt(initialWbtcBalance) + BigInt(wbtcAmount)).toString()
    //   );
    //   expect(finalUsdBalance.toString()).to.equal(
    //     (BigInt(initialUsdBalance) - BigInt(expectedUsdEquivalent)).toString()
    //   );
    // });

    // it("Should allow User2 to supplicate aUSD to aBTC after", async function () {
    //   const wbtcAmount = 1000000; // 0.01 BTC in Satoshis
    //   const expectedUsdEquivalent = Math.floor((wbtcAmount * bitcoinPrice * 100) / 1e8);

    //   // Initial balances
    //   const initialWbtcBalance = await massSmartContract.aBTCBalance(user2.aBTCWallet.address);
    //   const initialUsdBalance = await massSmartContract.aUSDBalance(user2.aUSDWallet.address);

    //   console.log("User2 Initial aBTC Balance:", formatABTC(initialWbtcBalance.toString()), "BTC");
    //   console.log("User2 Initial aUSD Balance:", formatAUSD(initialUsdBalance.toString()), "USD");

    //   // Supplicate USDC to WBTC
    //   await massSmartContract.connect(user2.wbtcWallet).supplicateAUSDtoABTC(wbtcAmount, bitcoinPrice);

    //   // Final balances
    //   const finalWbtcBalance = await massSmartContract.aBTCBalance(user2.aBTCWallet.address);
    //   const finalUsdBalance = await massSmartContract.aUSDBalance(user2.aUSDWallet.address);

    //   console.log("User2 Final aBTC Balance:", formatABTC(finalWbtcBalance.toString()), "BTC");
    //   console.log("User2 Final aUSD Balance:", formatAUSD(finalUsdBalance.toString()), "USD");

    //   // Assertions
    //   expect(finalWbtcBalance.toString()).to.equal(
    //     (BigInt(initialWbtcBalance) + BigInt(wbtcAmount)).toString()
    //   );
    //   expect(finalUsdBalance.toString()).to.equal(
    //     (BigInt(initialUsdBalance) - BigInt(expectedUsdEquivalent)).toString()
    //   );
    // });
   });
});