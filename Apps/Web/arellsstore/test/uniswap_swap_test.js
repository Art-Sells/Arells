import { ethers } from "hardhat";
import dotenv from "dotenv";
import SWAP_ROUTER_ABI from "@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json";

dotenv.config();

async function main() {
    console.log("\n🚀 Testing Direct Uniswap Swap...");

    const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, ethers.provider);
    console.log(`✅ Using Test Wallet: ${await userWallet.getAddress()}`);

    // **Uniswap V3 Router on Base**
    const routerAddress = "0x2626664c2603336E57B271c5C0b26F421741e481"; // ✅ Uniswap V3 Router
    const tokenA = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // ✅ USDC
    const tokenB = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf"; // ✅ CBBTC
    const FEE_TIER = 500; // ✅ 0.05% Fee Tier

    // **Initialize Router Contract**
    const router = new ethers.Contract(routerAddress, SWAP_ROUTER_ABI.abi, userWallet);
    console.log("✅ Router contract initialized successfully.");

    // **Declare `amountIn`**
    const amountIn = ethers.parseUnits("10", 6); // ✅ 10 USDC

    // **Swap on Uniswap**
    console.log("🔍 Executing Swap...");
    try {
        const tx = await router.exactInputSingle({
            tokenIn: tokenA,
            tokenOut: tokenB,
            fee: FEE_TIER,
            recipient: await userWallet.getAddress(),
            deadline: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minutes
            amountIn,
            amountOutMinimum: 0, // Allow any output
            sqrtPriceLimitX96: 0,
        });

        console.log(`✅ Swap Transaction Sent! Tx Hash: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Swap Completed!");
    } catch (error) {
        console.error("❌ ERROR executing swap:", error.reason || error);
        return;
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});