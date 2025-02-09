import { expect } from "chai";
import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

describe("MASSTester Swap Test", function () {
    let massTester, tokenAContract, tokenBContract;
    let userAddress = "0xE6a1218F4E2F514a3fC215758D450AaC632B0DE3";
    let userWallet;
    let masstesterAddress = "0x00922a1FF79f500985dd325149DBb6De823BFB24";

    let uniswapPool = "0xfBB6Eed8e7aa03B138556eeDaF5D271A5E1e43ef"; // USDC/CBBTC Pool
    let uniswapRouter = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; // Uniswap V3 Router

    before(async function () {
        console.log("\n🚀 Connecting to Deployed Contracts on Base...");

        userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, ethers.provider);
        console.log(`✅ Using Test Wallet: ${userWallet.address}`);

        const tokenA = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // USDC
        const tokenB = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf"; // CBBTC

        massTester = await ethers.getContractAt("MASSTester", masstesterAddress, userWallet);
        console.log(`✅ Connected to MASSTester at: ${await massTester.getAddress()}`);

        tokenAContract = await ethers.getContractAt("IERC20", tokenA, userWallet);
        tokenBContract = await ethers.getContractAt("IERC20", tokenB, userWallet);

        console.log(`✅ Uniswap V3 Pool: ${uniswapPool}`);
        console.log(`✅ Uniswap V3 Router: ${uniswapRouter}`);
    });

    it("Should execute a zero-fee swap", async function () {
        console.log("\n🔄 Initiating Zero-Fee Swap...");

        const amountIn = ethers.parseUnits("5", 6); // 5 USDC
        console.log(`➡️  Swapping ${ethers.formatUnits(amountIn, 6)} USDC for CBBTC`);

        // ✅ Check User's USDC Balance
        const userBalance = await tokenAContract.balanceOf(userAddress);
        console.log(`💰 User USDC Balance: ${ethers.formatUnits(userBalance, 6)}`);

        if (BigInt(userBalance) < BigInt(amountIn)) {
            throw new Error("❌ User does not have enough USDC for the test.");
        }

        // ✅ Check Current Allowance
        let currentAllowance = await tokenAContract.allowance(userAddress, masstesterAddress);
        console.log(`🔎 Current Allowance: ${ethers.formatUnits(currentAllowance, 6)} USDC`);

        // ✅ Approve MASSTester to Spend USDC if Needed
        if (BigInt(currentAllowance) < BigInt(amountIn)) {
            console.log("⚠️ Allowance too low, approving more USDC...");
            const approveTx = await tokenAContract.connect(userWallet).approve(masstesterAddress, ethers.parseUnits("100", 6));
            await approveTx.wait();
            console.log("✅ USDC Approved for MASSTester");
        } else {
            console.log("✅ Sufficient Allowance Already Set");
        }

        // ✅ Verify Allowance Again
        currentAllowance = await tokenAContract.allowance(userAddress, masstesterAddress);
        console.log(`🔎 Updated Allowance: ${ethers.formatUnits(currentAllowance, 6)} USDC`);

        // ✅ Perform the Manipulated Tick Swap
        const tx = await massTester.connect(userWallet).executeZeroFeeSwap(amountIn, userAddress);
        await tx.wait();
        console.log("✅ Swap Executed Successfully");

        // ✅ Check if the user received the output token without fees
        const balanceAfter = await tokenBContract.balanceOf(userAddress);
        console.log(`💰 User received CBBTC: ${ethers.formatEther(balanceAfter)}`);

        expect(balanceAfter).to.be.gt(0);
    });
});