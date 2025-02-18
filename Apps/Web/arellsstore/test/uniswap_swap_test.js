import { ethers } from "hardhat";
import dotenv from "dotenv";
import SWAP_ROUTER_ABI from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";

dotenv.config();

async function main() {
    console.log("\n🚀 Testing Direct Uniswap Swap...");

    const provider = ethers.provider;
    const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
    console.log(`✅ Using Test Wallet: ${userWallet.address}`);

    // ✅ Use Correct Base Mainnet Addresses
    const routerAddress = "0x2626664c2603336E57B271c5C0b26F421741e481"; // ✅ Uniswap V3 Router on Base
    const quoterAddress = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a"; // ✅ Uniswap V3 Quoter V2 on Base

    // ✅ Verify Token Addresses (Check Again If Needed)
    const poolAddress = "0xfBB6Eed8e7aa03B138556eeDaF5D271A5E1e43ef";
    const tokenA = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // ✅ USDC
    const tokenB = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf"; // ✅ CBBTC
    const FEE_TIER = 500;


    if (!SWAP_ROUTER_ABI.abi) {
        throw new Error("❌ ERROR: SWAP_ROUTER_ABI.abi is undefined! Check the import path.");
    }

    // ✅ Initialize Router Contract
    const router = new ethers.Contract(routerAddress, SWAP_ROUTER_ABI.abi, userWallet);
    console.log("✅ Router contract initialized successfully.");

    // ✅ Check If exactInputSingle Exists
    const functionNames = router.interface.fragments
        .filter(frag => frag.type === "function")
        .map(frag => frag.name);

    console.log("🔎 Extracted Router Functions:", functionNames);

    if (!functionNames.includes("exactInputSingle")) {
        throw new Error("❌ ERROR: exactInputSingle function not found in router contract!");
    }

    console.log("✅ exactInputSingle exists, proceeding with swap...");

    const poolContract = await ethers.getContractAt("IUniswapV3Pool", poolAddress, userWallet);
    const token0 = await poolContract.token0();
    const token1 = await poolContract.token1();
    console.log(`🔎 Pool Tokens: Token0 = ${token0}, Token1 = ${token1}`);

    let tokenIn = tokenA;
    let tokenOut = tokenB;

    if (token0.toLowerCase() !== tokenA.toLowerCase() && token1.toLowerCase() !== tokenA.toLowerCase()) {
        throw new Error("❌ ERROR: The selected token is not in this Uniswap V3 pool.");
    }

    const liquidity = await poolContract.liquidity();
    console.log(`💧 Uniswap Pool Liquidity: ${liquidity}`);

    if (BigInt(liquidity) === BigInt(0)) {
        throw new Error("❌ ERROR: Uniswap Pool has NO liquidity!");
    }

    // ✅ Check Wallet Balance
    const amountIn = ethers.parseUnits("10", 6);
    const usdcContract = await ethers.getContractAt("IERC20", tokenA, userWallet);
    const balance = await usdcContract.balanceOf(userWallet.address);
    console.log(`💰 USDC Balance: ${ethers.formatUnits(balance, 6)}`);

    if (BigInt(balance) < BigInt(amountIn)) {
        throw new Error("❌ ERROR: Not enough USDC to swap.");
    }

    console.log("🔑 Approving Uniswap Router...");
    const allowance = await usdcContract.allowance(userWallet.address, routerAddress);
    console.log(`🔍 Current Allowance: ${ethers.formatUnits(allowance, 6)} USDC`);

    if (BigInt(allowance) < BigInt(amountIn)) {
        const approvalTx = await usdcContract.approve(routerAddress, amountIn);
        console.log(`✅ Approval TX: ${approvalTx.hash}`);
        await approvalTx.wait();
    }

    // ✅ Use Correct Quoter V2 Address
    console.log("🔍 Estimating Swap Output...");
    const QUOTER_ABI = [
        {
            "inputs": [
                { "internalType": "address", "name": "tokenIn", "type": "address" },
                { "internalType": "address", "name": "tokenOut", "type": "address" },
                { "internalType": "uint24", "name": "fee", "type": "uint24" },
                { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
                { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
            ],
            "name": "quoteExactInputSingle",
            "outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        }
    ];

    const quoter = new ethers.Contract(quoterAddress, QUOTER_ABI, provider);
    
    let estimatedOutput;
    try {
        estimatedOutput = await quoter.quoteExactInputSingle(tokenA, tokenB, FEE_TIER, amountIn, 0);
        console.log(`💰 Estimated Output: ${ethers.formatUnits(estimatedOutput, 18)} CBBTC`);
    } catch (error) {
        console.error("❌ ERROR estimating swap output:", error);
        throw new Error("Failed to estimate swap output");
    }

    if (BigInt(estimatedOutput) === BigInt(0)) {
        throw new Error("❌ ERROR: Swap would return 0 CBBTC, which indicates an issue.");
    }

    console.log("🔍 Executing Swap...");
    try {
        const tx = await router.exactInputSingle({
            tokenIn: tokenA,
            tokenOut: tokenB,
            fee: FEE_TIER,
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
        throw new Error("Swap failed");
    }
}

// **Run Script & Handle Errors**
main().catch((error) => {
    console.error(error);
    process.exit(1);
});