import { ethers } from "hardhat";
import dotenv from "dotenv";
import SWAP_ROUTER_ABI from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";

dotenv.config();

async function main() {
    console.log("\n🚀 Testing Uniswap Swap with Routing...");

    const provider = ethers.provider;
    const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
    console.log(`✅ Using Test Wallet: ${userWallet.address}`);

    // Define Uniswap V3 Contracts
    const routerAddress = "0x2626664c2603336E57B271c5C0b26F421741e481";
    const quoterAddress = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
    
    // Define Tokens
    const tokenA = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // USDC
    const tokenB = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf"; // CBBTC

    // Load Router Contract
    if (!SWAP_ROUTER_ABI.abi) {
        throw new Error("❌ ERROR: SWAP_ROUTER_ABI.abi is undefined! Check the import path.");
    }
    const router = new ethers.Contract(routerAddress, SWAP_ROUTER_ABI.abi, userWallet);
    console.log("✅ Router contract initialized successfully.");

    // Fetch User's USDC Balance
    const usdcContract = await ethers.getContractAt("IERC20", tokenA, userWallet);
    const amountIn = ethers.parseUnits("10", 6); // 10 USDC
    const balance = await usdcContract.balanceOf(userWallet.address);
    console.log(`💰 USDC Balance: ${ethers.formatUnits(balance, 6)}`);
    if (BigInt(balance) < BigInt(amountIn)) throw new Error("❌ ERROR: Not enough USDC to swap.");

    // Approve Uniswap Router
    console.log("🔑 Approving Uniswap Router...");
    const allowance = await usdcContract.allowance(userWallet.address, routerAddress);
    if (BigInt(allowance) < BigInt(amountIn)) {
        const approvalTx = await usdcContract.approve(routerAddress, amountIn);
        console.log(`✅ Approval TX: ${approvalTx.hash}`);
        await approvalTx.wait();
    }

    // Initialize Quoter Contract
    const quoter = new ethers.Contract(quoterAddress, [
        "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external view returns (uint256 amountOut)",
    ], provider);

    // Attempt Direct Swap (USDC → CBBTC)
    console.log("🔍 Fetching Uniswap QuoterV2 Pricing...");
    let estimatedOutput;
    try {
        estimatedOutput = await quoter.quoteExactInputSingle(tokenA, tokenB, 500, amountIn, 0);
        console.log(`✅ Estimated Output (Direct Swap): ${ethers.formatUnits(estimatedOutput, 8)} CBBTC`);
    } catch (error) {
        console.warn("⚠️ Direct swap failed, checking alternative routes...");
        estimatedOutput = null;
    }

    // If direct swap fails, check alternative routes
    if (!estimatedOutput || BigInt(estimatedOutput) === BigInt(0)) {
        const potentialPools = [
            { token1: tokenA, token2: "0x0000000000000000000000000000000000000000", fee: 3000 },
            { token1: "0x0000000000000000000000000000000000000000", token2: tokenB, fee: 3000 },
            { token1: tokenA, token2: "0x1111111111111111111111111111111111111111", fee: 500 },
            { token1: "0x1111111111111111111111111111111111111111", token2: tokenB, fee: 500 }
        ];

        let bestRoute = null;
        for (const route of potentialPools) {
            try {
                const routeOutput = await quoter.quoteExactInputSingle(route.token1, route.token2, route.fee, amountIn, 0);
                if (BigInt(routeOutput) > BigInt(0)) {
                    bestRoute = route;
                    estimatedOutput = routeOutput;
                    break;
                }
            } catch {}
        }

        if (!bestRoute) {
            throw new Error("❌ No valid swap route found!");
        }
    }

    // Execute Swap
    console.log("🔍 Executing Swap...");
    try {
        const tx = await router.exactInputSingle({
            tokenIn: tokenA,
            tokenOut: tokenB,
            fee: 500,
            recipient: userWallet.address,
            deadline: Math.floor(Date.now() / 1000) + 60 * 10,
            amountIn,
            amountOutMinimum: BigInt(estimatedOutput) * BigInt(95) / BigInt(100), // 5% slippage protection
            sqrtPriceLimitX96: 0,
        }, { gasLimit: 500000 });

        console.log(`✅ Swap Transaction Sent! Tx Hash: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Swap Completed!");
    } catch (error) {
        console.error("❌ ERROR executing swap:", error);
        throw new Error("Swap failed.");
    }
}

// Run Script & Handle Errors
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
