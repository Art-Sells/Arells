import { expect } from "chai";
import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

describe("MASSTester Quote Test", function () {
    let quoter, userWallet;

    let QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a"; // Uniswap QuoterV2 on Base
    let USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
    let CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";
    let FEE_TIER = 3000; // 0.3% Uniswap Fee Tier

    before(async function () {
        console.log("\n🚀 Connecting to Uniswap QuoterV2 on Base...");

        userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, ethers.provider);
        console.log(`✅ Using Test Wallet: ${userWallet.address}`);

        quoter = await ethers.getContractAt("IQuoterV2", QUOTER_ADDRESS, userWallet);
        console.log(`✅ Connected to QuoterV2 at: ${await quoter.getAddress()}`);
    });

    it("Should fetch a swap quote (without executing swap)", async function () {
        console.log("\n🔍 Fetching Uniswap V3 Swap Quote...");

        const amountIn = ethers.parseUnits("5", 6); // 5 USDC
        console.log(`➡️ Estimating Swap for ${ethers.formatUnits(amountIn, 6)} USDC to CBBTC`);

        // ✅ Call QuoterV2 to get the swap quote
        try {
            const params = {
                tokenIn: USDC,
                tokenOut: CBBTC,
                amountIn: amountIn,
                fee: FEE_TIER,
                sqrtPriceLimitX96: 0
            };

            const estimatedOutput = await quoter.callStatic.quoteExactInputSingle(params);
            console.log(`✅ Estimated Output: ${ethers.formatUnits(estimatedOutput[0], 8)} CBBTC`);

            expect(estimatedOutput[0]).to.be.gt(0);
        } catch (error) {
            console.error("❌ Quote Fetch Failed:", error.message);
            throw error;
        }
    });
});