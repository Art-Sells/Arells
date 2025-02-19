import { ethers } from "hardhat";
import dotenv from "dotenv";
import SWAP_ROUTER_ABI from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";

dotenv.config();

async function main() {
    console.log("\n🚀 Testing Direct Uniswap Swap...");

    const provider = ethers.provider;
    const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
    console.log(`✅ Using Test Wallet: ${userWallet.address}`);

    // ✅ Define Uniswap V3 Contracts on Base
    const routerAddress = "0x2626664c2603336E57B271c5C0b26F421741e481"; 
    const quoterAddress = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a"; 
    const poolAddress = "0xfBB6Eed8e7aa03B138556eeDaF5D271A5E1e43ef"; 

    // ✅ Define Tokens
    const tokenA = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // USDC
    const tokenB = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf"; // CBBTC

    // ✅ Load Router Contract
    if (!SWAP_ROUTER_ABI.abi) {
        throw new Error("❌ ERROR: SWAP_ROUTER_ABI.abi is undefined! Check the import path.");
    }
    const router = new ethers.Contract(routerAddress, SWAP_ROUTER_ABI.abi, userWallet);
    console.log("✅ Router contract initialized successfully.");

    // ✅ Verify the presence of `exactInputSingle`
    const functionNames = router.interface.fragments
        .filter(frag => frag.type === "function")
        .map(frag => frag.name);

    
    console.log("🔎 Extracted Router Functions:", functionNames);    

    if (!functionNames.includes("exactInputSingle")) {
        throw new Error("❌ ERROR: `exactInputSingle` function not found in router contract!");
    }
    console.log("✅ exactInputSingle exists, proceeding with swap...");

    // ✅ Initialize Uniswap V3 Pool Contract
    const poolContract = await ethers.getContractAt("IUniswapV3Pool", poolAddress, userWallet);
    const token0 = await poolContract.token0();
    const token1 = await poolContract.token1();
    console.log(`🔎 Pool Tokens: Token0 = ${token0}, Token1 = ${token1}`);

    // ✅ Check Pool Fee Tier
    const poolFee = await poolContract.fee();
    console.log(`✅ Pool supports Fee Tier: ${poolFee}`);

    // ✅ Check Liquidity of USDC and CBBTC in the Pool
    console.log("🔍 Checking Liquidity in the Pool...");
    const token0Contract = await ethers.getContractAt("IERC20", token0, provider);
    const token1Contract = await ethers.getContractAt("IERC20", token1, provider);

    const reserveToken0 = await token0Contract.balanceOf(poolAddress);
    const reserveToken1 = await token1Contract.balanceOf(poolAddress);

    console.log(`💧 Pool Liquidity for ${token0}: ${ethers.formatUnits(reserveToken0, 6)} USDC`);
    console.log(`💧 Pool Liquidity for ${token1}: ${ethers.formatUnits(reserveToken1, 8)} CBBTC`);

    if (BigInt(reserveToken0) === BigInt(0) || BigInt(reserveToken1) === BigInt(0)) {
        throw new Error("❌ ERROR: Uniswap Pool has insufficient liquidity for this pair!");
    }

    // ✅ Set Correct Token Order
    let tokenIn = tokenA;
    let tokenOut = tokenB;

    if (token0.toLowerCase() === tokenB.toLowerCase()) {
        console.log("🔄 Swapping token order since USDC is token1...");
        tokenIn = tokenB;
        tokenOut = tokenA;
    }

    if (token0.toLowerCase() !== tokenIn.toLowerCase() && token1.toLowerCase() !== tokenIn.toLowerCase()) {
        throw new Error("❌ ERROR: The selected token is not in this Uniswap V3 pool.");
    }

    // ✅ Check Wallet Balance
    const amountIn = ethers.parseUnits("10", 6); // 10 USDC
    const usdcContract = await ethers.getContractAt("IERC20", tokenA, userWallet);
    const balance = await usdcContract.balanceOf(userWallet.address);
    console.log(`💰 USDC Balance: ${ethers.formatUnits(balance, 6)}`);

    if (BigInt(balance) < BigInt(amountIn)) {
        throw new Error("❌ ERROR: Not enough USDC to swap.");
    }

    // ✅ Approve Uniswap Router if Needed
    console.log("🔑 Approving Uniswap Router...");
    const allowance = await usdcContract.allowance(userWallet.address, routerAddress);
    console.log(`🔍 Current Allowance: ${ethers.formatUnits(allowance, 6)} USDC`);

    if (BigInt(allowance) < BigInt(amountIn)) {
        const approvalTx = await usdcContract.approve(routerAddress, amountIn);
        console.log(`✅ Approval TX: ${approvalTx.hash}`);
        await approvalTx.wait();
    }

    // ✅ Initialize Quoter Contract
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

    console.log("🔍 Checking if Pool Fee Tier Exists...");

    // ✅ Fetch the actual supported fee tiers from Uniswap V3
    const feeTiers = [100, 500, 3000, 10000]; // Standard Uniswap V3 Fee Tiers
    console.log(`🔎 Available Fee Tiers: ${feeTiers.join(", ")}`);
    console.log(`🔎 Pool Reported Fee Tier: ${poolFee}`);
    
    // ✅ Verify if the poolFee is in the list
    if (!feeTiers.includes(Number(poolFee))) {
        console.error(`❌ ERROR: Pool fee ${poolFee} is not a standard Uniswap fee tier.`);
        console.log("🔎 Double-checking if Uniswap V3 has custom fee tiers...");
        
        // Fetch fee tiers from Uniswap (if API or other sources available)
        console.log("🔎 Fetching pool details from Basescan...");
        
        throw new Error(`❌ ERROR: Pool fee ${poolFee} is not recognized. Verify Uniswap Pool on Basescan.`);
    }
    
    console.log(`✅ Confirmed: Pool supports valid fee tier ${poolFee}`);
    // ✅ Ensure Token Order is Correct
    if (token0.toLowerCase() === tokenB.toLowerCase()) {
        console.log("🔄 Swapping token order...");
        tokenIn = tokenB;
        tokenOut = tokenA;
        console.log(`🔍 Token In: ${tokenIn}, Token Out: ${tokenOut}`);
    }
    
    // ✅ Estimate Swap Output with FIXED sqrtPriceLimitX96
    console.log("🔍 Estimating Swap Output...");

    // ✅ Use MAX_UINT160 to avoid pricing limits that may cause reverts
    const sqrtPriceLimitX96 = "1461501637330902918203684832716283019655932542975"; // 2^160 - 1
    console.log(`🔹 Updated Sqrt Price Limit X96: ${sqrtPriceLimitX96}`);
    
    // ✅ Log the exact parameters for debugging
    console.log("\n🔍 Debugging Quoter Call Data...");
    console.log(`🔹 Token In: ${tokenIn}`);
    console.log(`🔹 Token Out: ${tokenOut}`);
    console.log(`🔹 Pool Fee Tier: ${poolFee}`);
    console.log(`🔹 Amount In: ${ethers.formatUnits(amountIn, 6)} USDC`);
    console.log(`🔹 Sqrt Price Limit X96: ${sqrtPriceLimitX96}`);

    console.log("\n🔍 Encoding Quoter Call Data with Updated `sqrtPriceLimitX96`...");
    const callData = quoter.interface.encodeFunctionData("quoteExactInputSingle", [
        tokenIn, tokenOut, poolFee, amountIn, sqrtPriceLimitX96
    ]);
    console.log(`🔹 Encoded Call Data: ${callData}`);

    // ✅ Debug: Use staticCall to test if Quoter call reverts
    try {
        console.log("🔍 Testing Quoter Call with staticCall...");
        const testCall = await provider.call({ to: quoterAddress, data: callData });
        console.log("✅ Quoter Call Successful:", testCall);
    } catch (error) {
        console.error("❌ Quoter Call Failed! Debugging Revert Reason...", error);

        // ✅ Capture revert reason if available
        if (error.data) {
            console.error("🔍 Revert Reason Data:", error.data);
        }

        throw new Error("Quoter contract call failed. Check token order, fee tier, or liquidity.");
    }
    
    // ✅ Debug: Use staticCall to test if Quoter call reverts
    try {
        console.log("🔍 Testing Quoter Call with staticCall...");
        const testCall = await provider.call({ to: quoterAddress, data: callData });
        console.log("✅ Quoter Call Successful:", testCall);
    } catch (error) {
        console.error("❌ Quoter Call Failed:", error);
        throw new Error("Quoter contract call failed. Check token order and fee tier.");
    }
    
    // ✅ Proceed with actual swap estimation
    try {
        estimatedOutput = await quoter.quoteExactInputSingle(tokenIn, tokenOut, poolFee, amountIn, sqrtPriceLimitX96);
        console.log(`✅ Estimated Output: ${ethers.formatUnits(estimatedOutput, 8)} CBBTC`);
    } catch (error) {
        console.error("❌ ERROR estimating swap output:", error);
        throw new Error("Failed to estimate swap output.");
    }

    if (BigInt(estimatedOutput) === BigInt(0)) {
        throw new Error("❌ ERROR: Swap would return 0 CBBTC, which indicates an issue.");
    }

    // ✅ Execute Swap
    console.log("🔍 Executing Swap...");
    try {
        const tx = await router.exactInputSingle({
            tokenIn: tokenA,
            tokenOut: tokenB,
            fee: poolFee, // ✅ Use correct pool fee
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

// **Run Script & Handle Errors**
main().catch((error) => {
    console.error(error);
    process.exit(1);
});