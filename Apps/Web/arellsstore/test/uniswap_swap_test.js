import { ethers } from "hardhat";
import dotenv from "dotenv";
import SWAP_ROUTER_ABI from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";

dotenv.config();

async function main() {
    console.log("\n🚀 Testing Direct Uniswap Swap...");

    // **Load Wallet with Private Key**
    const provider = ethers.provider;
    const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
    console.log(`✅ Using Test Wallet: ${userWallet.address}`);

    // **Uniswap V3 Router & Pool on Base**
    const routerAddress = "0x2626664c2603336E57B271c5C0b26F421741e481"; // ✅ Uniswap V3 Router
    const poolAddress = "0xfBB6Eed8e7aa03B138556eeDaF5D271A5E1e43ef"; // ✅ Correct Pool Address
    const tokenA = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // ✅ USDC
    const tokenB = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf"; // ✅ CBBTC
    const FEE_TIER = 500; // ✅ 0.05% Fee Tier

    // **Debug: Ensure ABI Exists Before Using**
    if (!SWAP_ROUTER_ABI.abi) {
        throw new Error("❌ ERROR: SWAP_ROUTER_ABI.abi is undefined! Check the import path.");
    }

    console.log("🔍 Debug: Router ABI Functions:", SWAP_ROUTER_ABI.abi.map(f => f.name));

    // **Initialize Router Contract with Signer**
    const router = new ethers.Contract(routerAddress, SWAP_ROUTER_ABI.abi, userWallet);
    console.log("✅ Router contract initialized successfully.");

    // **Debug: Ensure `exactInputSingle` Exists**
    const routerFunctions = Object.keys(router.interface?.functions || {});
    console.log("🔎 Available Router Functions:", routerFunctions);

    if (!routerFunctions.includes("exactInputSingle")) {
        throw new Error("❌ ERROR: exactInputSingle function not found in router contract!");
    }
    // **Declare `amountIn`**
    const amountIn = ethers.parseUnits("10", 6); // ✅ 10 USDC

    // **Check Wallet Balance**
    const usdcContract = await ethers.getContractAt("IERC20", tokenA, userWallet);
    const balance = await usdcContract.balanceOf(userWallet.address);
    console.log(`💰 USDC Balance: ${ethers.formatUnits(balance, 6)}`);

    if (BigInt(balance) < BigInt(amountIn)) {
        throw new Error("❌ ERROR: Not enough USDC to swap.");
    }

    // **Approve Uniswap Router**
    console.log("🔑 Approving Uniswap Router...");
    const approvalTx = await usdcContract.approve(routerAddress, amountIn);
    console.log(`✅ Approval TX: ${approvalTx.hash}`);
    await approvalTx.wait();

    // **Check Pool Liquidity**
    console.log("🔍 Checking Uniswap Pool Liquidity...");
    const poolContract = await ethers.getContractAt("IUniswapV3Pool", poolAddress, userWallet);
    const liquidity = await poolContract.liquidity();
    console.log(`💧 Uniswap Pool Liquidity: ${liquidity}`);

    if (BigInt(liquidity) === BigInt(0)) {
        throw new Error("❌ ERROR: Uniswap Pool has NO liquidity!");
    }

    // **Check Token Order & Adjust Swap Parameters**
    const token0 = await poolContract.token0();
    const token1 = await poolContract.token1();
    console.log(`🔎 Token0: ${token0}, Token1: ${token1}`);

    let tokenIn, tokenOut;
    if ([token0.toLowerCase(), token1.toLowerCase()].includes(tokenA.toLowerCase())) {
        tokenIn = tokenA;
        tokenOut = tokenB;
    } else {
        throw new Error("❌ ERROR: USDC is not in this Uniswap pool!");
    }

    console.log(`✅ Swapping ${tokenIn} for ${tokenOut}`);

    // **Execute Swap**
    console.log("🔍 Executing Swap...");
    try {
        const tx = await router.exactInputSingle({
            tokenIn,
            tokenOut,
            fee: FEE_TIER,
            recipient: userWallet.address,
            deadline: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minutes
            amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0,
        });

        console.log(`✅ Swap Transaction Sent! Tx Hash: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Swap Completed!");
    } catch (error) {
        console.error("❌ ERROR executing swap:", error);
        throw new Error("Swap failed");
    }
}

// **Run Script & Handle Errors**
main().catch((error) => {
    console.error(error);
    process.exit(1);
});