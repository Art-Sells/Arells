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

    // Corrected ABI format
    const ISwapRouterABI = [
        "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256)"
    ];
    
    // Fix Contract Initialization
    const router = new ethers.Contract(routerAddress, ISwapRouterABI, userWallet);
    
    if (!router) {
        console.error("❌ ERROR: Router contract failed to initialize. Check address and ABI.");
        return;
    }

    console.log("🔎 Checking available router functions...");
    console.log("📜 Available Router Functions:", Object.keys(router.functions));

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

    const amountIn = ethers.parseUnits("10", 6);

    if (BigInt(userBalance) < BigInt(amountIn)) {
        console.log("❌ Not enough USDC! Exiting...");
        return;
    }

    // Approve Uniswap Router
    console.log("🔄 Approving USDC for Uniswap Router...");
    const approveTx = await usdcContract.connect(userWallet).approve(routerAddress, amountIn);
    await approveTx.wait();
    console.log("✅ USDC Approved");

    // Get expected swap output
    console.log("🔍 Checking expected output amount...");
    try {
        const quote = await router.callStatic.exactInputSingle({
            tokenIn: tokenA,
            tokenOut: tokenB,
            fee: 3000,
            recipient: userWallet.address,
            deadline: Math.floor(Date.now() / 1000) + 300,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });

        console.log(`💰 Expected CBBTC Output: ${ethers.formatEther(quote)}`);
    } catch (error) {
        console.error("❌ ERROR calling exactInputSingle:", error);
        return;
    }

    // Execute the swap
    console.log("🔄 Executing Swap on Uniswap...");
    const tx = await router.exactInputSingle({
        tokenIn: tokenA,
        tokenOut: tokenB,
        fee: 3000,
        recipient: userWallet.address,
        deadline: Math.floor(Date.now() / 1000) + 300,
        amountIn: amountIn,
        amountOutMinimum: 1, // Ensure a minimum return
        sqrtPriceLimitX96: 0
    });

    await tx.wait();
    console.log("✅ Swap Successful!");

    // Check new CBBTC balance
    const newBalance = await cbbtcContract.balanceOf(await userWallet.getAddress());
    console.log(`💰 User CBBTC Balance After Swap: ${ethers.formatEther(newBalance)}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});