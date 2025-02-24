import { ethers } from "hardhat";
import dotenv from "dotenv";
import axios from "axios";
import SWAP_ROUTER_ABI from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";

dotenv.config();

// ✅ Uniswap Contract Addresses
const QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
const ROUTER_ADDRESS = "0x2626664c2603336E57B271c5C0b26F421741e481";
const FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";

// ✅ Token Addresses
const USDC = ethers.getAddress
    ? ethers.getAddress("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913")
    : ethers.utils.getAddress("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913");

const CBBTC = ethers.getAddress
    ? ethers.getAddress("0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf")
    : ethers.utils.getAddress("0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf");

// ✅ Fetch ABI from BaseScan
async function fetchQuoterABI() {
    try {
        console.log("\n🔍 Fetching Quoter ABI from BaseScan...");
        const response = await axios.get(
            `https://api.basescan.org/api?module=contract&action=getabi&address=${QUOTER_ADDRESS}&apikey=${process.env.BASESCAN_API_KEY}`
        );

        if (response.data.status !== "1") {
            throw new Error(`BaseScan API Error: ${response.data.message}`);
        }

        const abi = JSON.parse(response.data.result);
        console.log(`✅ ABI Fetched Successfully: ${abi.length} functions loaded.`);
        console.log("🔍 ABI Preview:", abi.slice(0, 3)); // Debug: Show first 3 functions
        return abi;
    } catch (error) {
        console.error("❌ Failed to fetch ABI from BaseScan:", error.message);
        return null;
    }
}

async function main() {
    console.log("\n🚀 Debugging Uniswap Swap with Pool & Quoter Analysis...");

    // ✅ Initialize Provider & Wallet
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
    console.log("✅ Connected to Network:", await provider.getNetwork());
    console.log(`✅ Using Test Wallet: ${userWallet.address}`);

    // ✅ Initialize Router & Factory
    const router = new ethers.Contract(ROUTER_ADDRESS, SWAP_ROUTER_ABI.abi, userWallet);
    const factory = new ethers.Contract(FACTORY_ADDRESS, ["function getPool(address,address,uint24) external view returns (address)"], provider);

    // ✅ Fetch ABI & Initialize Quoter Contract
    const quoterABI = await fetchQuoterABI();
    if (!quoterABI) {
        console.error("❌ ERROR: Could not fetch Quoter ABI.");
        return;
    }

    // ✅ FIX: Connect Quoter with a Signer
    const quoter = new ethers.Contract(QUOTER_ADDRESS, quoterABI, provider).connect(userWallet);
    console.log("✅ Quoter Contract Initialized!");

    // ✅ Debug Quoter ABI & Functions
    console.log("🔍 Quoter Full ABI:", quoter.interface.fragments);

    // ✅ Extract Function Names
    const quoterFunctions = quoter.interface.fragments
        .filter(frag => frag.type === "function")
        .map(frag => frag.name);

    console.log("🔍 Quoter Available Functions:", quoterFunctions);

    // ✅ Validate `quoteExactInputSingle` Exists
    if (!quoterFunctions.includes("quoteExactInputSingle")) {
        console.error("❌ ERROR: `quoteExactInputSingle` function not found in Quoter contract!");
        return;
    }

    // ✅ Fetch Swap Estimates
    console.log("\n🔍 Fetching Swap Estimates...");
    const amountIn = ethers.parseUnits("10", 6);
    const testAmounts = [amountIn / 10n, amountIn / 2n, amountIn];
    const feeTiers = [500, 3000, 10000];

    for (const fee of feeTiers) {
        console.log(`\n🔎 Checking Pool (Fee Tier: ${fee})`);
        try {
            let tokenIn = USDC;
            let tokenOut = CBBTC;

            if (BigInt(USDC) > BigInt(CBBTC)) {
                console.log("🔄 Reordering tokens for Uniswap V3 compatibility...");
                [tokenIn, tokenOut] = [tokenOut, tokenIn];
            }

            const pool = await factory.getPool(tokenIn, tokenOut, fee);
            if (pool === ethers.ZeroAddress) {
                console.warn(`⚠️ No Pool Found for Fee Tier ${fee}`);
                continue;
            }
            console.log(`✅ Pool Exists at: ${pool}`);

            // ✅ Call Quoter
            console.log("🔍 Calling Quoter for Swap Estimate...");
            for (const testAmount of testAmounts) {
                try {
                    console.log(`🔹 Testing Quoter with ${ethers.formatUnits(testAmount, 6)} USDC...`);
            
                    // ✅ Ensure Struct Format is Correct
                    const params = {
                        tokenIn,
                        tokenOut,
                        fee,
                        amountIn: testAmount,
                        sqrtPriceLimitX96: 0
                    };
            
                    // ✅ Correct Function Call (No callStatic)
                    const result = await quoter.quoteExactInputSingle(params);
            
                    console.log(`✅ Estimated Output for Fee ${fee}: ${ethers.formatUnits(result.amountOut, 8)} CBBTC`);
                    console.log(`🔍 Final SqrtPriceX96: ${result.sqrtPriceX96After}`);
                    console.log(`📊 Initialized Ticks Crossed: ${result.initializedTicksCrossed}`);
                    console.log(`⛽ Gas Estimate: ${result.gasEstimate}`);
                } catch (error) {
                    console.error(`❌ Swap Estimate Failed for Fee ${fee} at ${ethers.formatUnits(testAmount, 6)} USDC:`, error.message);
                }
            }
        } catch (error) {
            console.error(`❌ Error Fetching Pool ${fee}:`, error.message);
        }
    }
}

main().catch(console.error);