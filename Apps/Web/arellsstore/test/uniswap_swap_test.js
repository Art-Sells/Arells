import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);

const QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
const ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

// ✅ Token Addresses
const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

// ✅ Fetch Uniswap V3 Quoter ABI
async function fetchQuoterABI() {
    try {
        console.log("\n🔍 Fetching Quoter ABI from BaseScan...");
        const response = await axios.get(
            `https://api.basescan.org/api?module=contract&action=getabi&address=${QUOTER_ADDRESS}&apikey=${process.env.BASESCAN_API_KEY}`
        );

        if (response.data.status !== "1") throw new Error(`BaseScan API Error: ${response.data.message}`);

        const abi = JSON.parse(response.data.result);
        console.log("✅ ABI Fetched Successfully!");
        return abi;
    } catch (error) {
        console.error("❌ Failed to fetch ABI from BaseScan:", error.message);
        return null;
    }
}

// ✅ Get the Uniswap Swap Quote for USDC → CBBTC
async function getUniswapQuote(amountIn) {
    console.log("\n🔍 Checking Uniswap Swap Quote...");

    const quoterABI = await fetchQuoterABI();
    if (!quoterABI) return null;

    // ✅ Ensure `quoteExactInputSingle` exists in ABI
    const iface = new ethers.Interface(quoterABI);
    if (!iface.getFunction("quoteExactInputSingle")) {
        console.error("❌ ERROR: `quoteExactInputSingle` is NOT available in ABI!");
        return null;
    }

    const quoter = new ethers.Contract(QUOTER_ADDRESS, quoterABI, provider);
    const amount = ethers.parseUnits(amountIn.toString(), 6);

    try {
        const params = {
            tokenIn: USDC,
            tokenOut: CBBTC,
            amountIn: amount,
            fee: 500, // 0.05% fee
            sqrtPriceLimitX96: 0
        };

        console.log("🔍 Querying `quoteExactInputSingle`...");
        const encodedData = iface.encodeFunctionData("quoteExactInputSingle", [params]);

        const rawResponse = await provider.call({ to: QUOTER_ADDRESS, data: encodedData });
        const decoded = iface.decodeFunctionResult("quoteExactInputSingle", rawResponse);

        console.log(`🔹 Uniswap Quote: ${ethers.formatUnits(decoded[0], 8)} CBBTC`);
        return decoded[0];
    } catch (error) {
        console.error("❌ Uniswap Quote Fetch Failed:", error.message);
        return null;
    }
}

// ✅ Get Best CBBTC → USDC Swap Quote from Another DEX (Simulated)
async function getBestReverseQuote(amountCBBTC) {
    console.log("\n🔍 Checking Best Reverse Swap Quote for CBBTC → USDC...");

    // Simulate fetching from another DEX (Balancer, SushiSwap, Curve)
    // Ideally, call their APIs for real-time price comparison.
    // For now, let's assume a **slightly better simulated price**.

    const simulatedBetterRate = parseFloat(ethers.formatUnits(amountCBBTC, 8)) * 1.0005; // 0.05% better
    const usdcEquivalent = ethers.parseUnits(simulatedBetterRate.toFixed(6), 6);

    console.log(`🔹 Best Reverse Quote: ${ethers.formatUnits(usdcEquivalent, 6)} USDC`);
    return usdcEquivalent;
}

// ✅ Check If Arbitrage Covers Fees
async function checkFeeFreeSwap(amountIn) {
    console.log("\n🚀 Simulating Atomic Swap...");

    // Step 1: Get Uniswap Quote (USDC → CBBTC)
    const uniswapOut = await getUniswapQuote(amountIn);
    if (!uniswapOut) {
        console.log("❌ Failed to get Uniswap quote.");
        return;
    }

    // Step 2: Get Reverse Swap Quote (CBBTC → USDC) on Another DEX
    const reverseUSDC = await getBestReverseQuote(uniswapOut);
    if (!reverseUSDC) {
        console.log("❌ Failed to get reverse swap quote.");
        return;
    }

    // Step 3: Compare If Arbitrage Covers Uniswap Fees
    const initialUSDC = ethers.parseUnits(amountIn.toString(), 6);
    if (reverseUSDC >= initialUSDC) {
        console.log("\n✅ **Arbitrage Covers Fees! Swap Can Be Executed Without Fees!** 🚀");
        console.log(`   - Initial USDC: ${ethers.formatUnits(initialUSDC, 6)}`);
        console.log(`   - Final USDC After Reverse Swap: ${ethers.formatUnits(reverseUSDC, 6)}`);
    } else {
        console.log("\n❌ **Arbitrage Not Profitable. Swap Will Incur Fees.**");
    }
}

// ✅ Run the Fee-Free Swap Simulation
async function main() {
    const amountIn = 100; // 100 USDC
    await checkFeeFreeSwap(amountIn);
}

// ✅ Run the Code (Only Simulates, Does Not Execute Swap)
main().catch(console.error);