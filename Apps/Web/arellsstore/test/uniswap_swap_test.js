import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("\n🚀 Testing Direct Uniswap Swap...");

    const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, ethers.provider);
    console.log(`✅ Using Test Wallet: ${await userWallet.getAddress()}`);

    // Define contract addresses
    const routerAddress = "0x2626664c2603336E57B271c5C0b26F421741e481"; // Uniswap V3 Router on Base
    const poolAddress = "0xfBB6Eed8e7aa03B138556eeDaF5D271A5E1e43ef"; // USDC/CBBTC Pool
    const tokenA = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // USDC
    const tokenB = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf"; // CBBTC

    const FEE_TIER = 500; // ✅ Updated to 0.05% (500 in Uniswap V3)

    const router = await ethers.getContractAt("ISwapRouter", routerAddress, userWallet);

    if (!router) {
        console.error("❌ ERROR: Router contract failed to initialize.");
        return;
    }

    console.log("✅ Router contract initialized successfully.");
    console.log("📜 Available Router Functions:", router.interface.fragments.map(f => f.name));

    const pool = await ethers.getContractAt("IUniswapV3Pool", poolAddress, ethers.provider);
    const usdcContract = await ethers.getContractAt("IERC20", tokenA, userWallet);
    const cbbtcContract = await ethers.getContractAt("IERC20", tokenB, userWallet);

    // Check liquidity
    const poolLiquidity = await pool.liquidity();
    console.log(`💧 Uniswap Pool Liquidity: ${poolLiquidity}`);
    if (BigInt(poolLiquidity) === BigInt(0)) {
        console.log("❌ Uniswap Pool has no liquidity! Cannot proceed.");
        return;
    }

    const userBalance = await usdcContract.balanceOf(await userWallet.getAddress());
    console.log(`💰 User USDC Balance: ${ethers.formatUnits(userBalance, 6)}`);

    const amountIn = ethers.parseUnits("10", 6); // 10 USDC

    if (BigInt(userBalance) < BigInt(amountIn)) {
        console.log("❌ Not enough USDC! Exiting...");
        return;
    }

    // **Check Allowance**
    const allowance = await usdcContract.allowance(userWallet.address, routerAddress);
    console.log(`🔎 Current Allowance: ${ethers.formatUnits(allowance, 6)} USDC`);

    if (BigInt(allowance) < BigInt(amountIn)) {
        console.log("🔄 Approving USDC for Uniswap Router...");
        const approveTx = await usdcContract.connect(userWallet).approve(routerAddress, amountIn);
        await approveTx.wait();
        console.log("✅ USDC Approved");
    } else {
        console.log("✅ Router already has enough allowance.");
    }

    // **Get Estimated Output**
    let estimatedAmountOut;
    try {
        estimatedAmountOut = await router.callStatic.exactInputSingle({
            tokenIn: tokenA,
            tokenOut: tokenB,
            fee: FEE_TIER, // ✅ Using 0.05% fee tier
            recipient: userWallet.address,
            deadline: Math.floor(Date.now() / 1000) + 300,
            amountIn: amountIn,
            amountOutMinimum: 0, // Allow any slippage
            sqrtPriceLimitX96: 0
        });
        console.log(`💰 Estimated CBBTC Output: ${ethers.formatEther(estimatedAmountOut)}`);
    } catch (error) {
        console.error("❌ ERROR calling exactInputSingle (quote estimation):", error);
        return;
    }

    // **Perform Swap**
    console.log("🔄 Executing Swap on Uniswap...");
    try {
        const tx = await router.connect(userWallet).exactInputSingle({
            tokenIn: tokenA,
            tokenOut: tokenB,
            fee: FEE_TIER, // ✅ Using 0.05% fee tier
            recipient: userWallet.address,
            deadline: Math.floor(Date.now() / 1000) + 300,
            amountIn: amountIn,
            amountOutMinimum: estimatedAmountOut, // ✅ Ensure minimum output
            sqrtPriceLimitX96: 0
        });

        await tx.wait();
        console.log("✅ Swap Successful!");
    } catch (error) {
        console.error("❌ ERROR Executing Swap:", error);
        return;
    }

    // **Check New CBBTC Balance**
    const newBalance = await cbbtcContract.balanceOf(await userWallet.getAddress());
    console.log(`💰 User CBBTC Balance After Swap: ${ethers.formatEther(newBalance)}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});