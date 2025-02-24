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
    : ethers.utils.getAddress
    ? ethers.utils.getAddress("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913")
    : "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // Fallback for older ethers versions
    const CBBTC = ethers.getAddress
    ? ethers.getAddress("0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf")
    : ethers.utils.getAddress
    ? ethers.utils.getAddress("0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf")
    : "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf"; // Fallback for older ethers versions

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
    const provider = new ethers.providers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
    const nonce = await provider.getTransactionCount(userWallet.address, "latest");
    console.log("✅ Connected to Network:", await provider.getNetwork());
    console.log(`✅ Using Test Wallet: ${userWallet.address} (Next Nonce: ${nonce})`);

    // ✅ Initialize Router & Factory
    const router = new ethers.Contract(ROUTER_ADDRESS, SWAP_ROUTER_ABI.abi, userWallet);
    const factory = new ethers.Contract(FACTORY_ADDRESS, ["function getPool(address,address,uint24) external view returns (address)"], provider);

    // ✅ Fetch ABI & Initialize Quoter Contract
    const quoterABI = await fetchQuoterABI();
    if (!quoterABI) {
        console.error("❌ ERROR: Could not fetch Quoter ABI.");
        return;
    }

    const quoter = new ethers.Contract(QUOTER_ADDRESS, quoterABI, provider).connect(userWallet);
    console.log("✅ Quoter Contract Initialized!");

    // ✅ Extract Function Names
    const quoterFunctions = quoter.interface.fragments
        .filter(frag => frag.type === "function")
        .map(frag => frag.name);

    console.log("🔍 Quoter Available Functions:", quoterFunctions);

    if (!quoterFunctions.includes("quoteExactInputSingle")) {
        console.error("❌ ERROR: `quoteExactInputSingle` function not found in Quoter contract!");
        return;
    }

    // ✅ Fetch Swap Estimates
    console.log("\n🔍 Fetching Swap Estimates...");
    const amountIn = ethers.utils.parseUnits("10", 6);
    const testAmounts = [amountIn.div(10), amountIn.div(2), amountIn];
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
            if (pool === ethers.constants.AddressZero) {
                console.warn(`⚠️ No Pool Found for Fee Tier ${fee}`);
                continue;
            }
            console.log(`✅ Pool Exists at: ${pool}`);

            console.log("🔍 Calling Quoter for Swap Estimate...");
            for (const testAmount of testAmounts) {
                try {
                    console.log(`🔹 Testing Quoter with ${ethers.utils.formatUnits(testAmount, 6)} USDC...`);

                    if (!testAmount) {
                        console.error("❌ ERROR: testAmount is undefined!");
                        continue;
                    }

                    const params = {
                        tokenIn,
                        tokenOut,
                        fee,
                        amountIn: testAmount,
                        sqrtPriceLimitX96: 0
                    };

                    const result = await quoter.quoteExactInputSingle(params, {
                        gasLimit: ethers.utils.hexlify(500000),
                        maxFeePerGas: ethers.utils.parseUnits("10", "gwei"),
                        maxPriorityFeePerGas: ethers.utils.parseUnits("2", "gwei"),
                    });

                    console.log(`✅ Estimated Output for Fee ${fee}: ${ethers.utils.formatUnits(result.amountOut, 8)} CBBTC`);
                    console.log(`🔍 Final SqrtPriceX96: ${result.sqrtPriceX96After}`);
                    console.log(`📊 Initialized Ticks Crossed: ${result.initializedTicksCrossed}`);
                    console.log(`⛽ Gas Estimate: ${result.gasEstimate}`);
                } catch (error) {
                    console.error(`❌ Swap Estimate Failed for Fee ${fee} at ${ethers.utils.formatUnits(testAmount, 6)} USDC:`, error.message);
                }
            }
        } catch (error) {
            console.error(`❌ Error Fetching Pool ${fee}:`, error.message);
        }
    }
}

main().catch(console.error);
