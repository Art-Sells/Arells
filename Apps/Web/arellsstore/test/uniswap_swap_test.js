import { ethers } from "hardhat";
import dotenv from "dotenv";
import axios from "axios";
import SWAP_ROUTER_ABI from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";

dotenv.config();

// ✅ Uniswap Contract Addresses
const QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
const ROUTER_ADDRESS = "0x2626664c2603336E57B271c5C0b26F421741e481";
const FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";

// ✅ Token Addresses (Using ethers.getAddress())
const USDC = ethers.getAddress("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913");
const CBBTC = ethers.getAddress("0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf");

/**
 * Fetches the latest ABI from BaseScan for the Quoter contract.
 */
async function fetchQuoterABI() {
    try {
        console.log("\n🔍 Fetching Quoter ABI from BaseScan...");
        const response = await axios.get(
            `https://api.basescan.org/api?module=contract&action=getabi&address=${QUOTER_ADDRESS}&apikey=${process.env.BASESCAN_API_KEY}`
        );

        // ✅ Validate Response
        if (!response.data.result || response.data.result === "Contract source code not verified") {
            console.error("❌ ERROR: Invalid ABI response from BaseScan.");
            return null;
        }

        const abi = JSON.parse(response.data.result);
        if (!Array.isArray(abi)) {
            console.error("❌ ERROR: ABI is not an array!");
            return null;
        }

        console.log("✅ ABI Fetched Successfully:", abi.length, "functions loaded.");
        console.log("🔍 ABI Preview (First 3 Functions):", abi.slice(0, 3));

        return abi;
    } catch (error) {
        console.error("❌ Failed to fetch ABI from BaseScan:", error.message);
        return null;
    }
}

/**
 * Initializes the Ethereum provider and wallet.
 */
async function initializeProvider() {
    console.log("\n🚀 Initializing Provider & Wallet...");
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const network = await provider.getNetwork();
    console.log("✅ Connected to Network:", network);

    const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
    console.log(`✅ Using Test Wallet: ${userWallet.address}`);

    return { provider, userWallet };
}

/**
 * Initializes the Uniswap Router, Factory, and Quoter contracts.
 */
async function initializeContracts(provider, userWallet) {
    console.log("\n🔍 Initializing Contracts...");

    const router = new ethers.Contract(ROUTER_ADDRESS, SWAP_ROUTER_ABI.abi, userWallet);
    const factory = new ethers.Contract(FACTORY_ADDRESS, ["function getPool(address,address,uint24) external view returns (address)"], provider);

    // ✅ Fetch and Initialize Quoter Contract
    const quoterABI = await fetchQuoterABI();
    if (!quoterABI) {
        console.error("❌ ERROR: Could not fetch Quoter ABI.");
        return null;
    }

    const quoter = new ethers.Contract(QUOTER_ADDRESS, quoterABI, provider);
    console.log("✅ Quoter Contract Initialized!");

    return { router, factory, quoter };
}

/**
 * Validates and checks the Quoter contract functions.
 */
async function validateQuoter(quoter) {
    console.log("\n🔍 Validating Quoter Contract...");
    try {
        if (!quoter.functions) {
            console.error("❌ ERROR: Quoter contract functions not accessible.");
            return false;
        }

        const quoterFunctions = Object.keys(quoter.functions);

        console.log("🔎 Quoter Available Functions:", quoterFunctions);

        if (!quoterFunctions.includes("quoteExactInputSingle")) {
            console.error("❌ ERROR: `quoteExactInputSingle` function not found in Quoter contract!");
            return false;
        }
        return true;
    } catch (error) {
        console.error("❌ Error validating Quoter functions:", error.message);
        return false;
    }
}

/**
 * Fetches the swap estimate for a given amount and pool fee.
 */
async function getSwapEstimates(quoter, factory) {
    console.log("\n🔍 Fetching Swap Estimates...");

    const amountIn = ethers.parseUnits("10", 6); // 10 USDC
    const testAmounts = [amountIn / 10n, amountIn / 2n, amountIn];
    const feeTiers = [500, 3000, 10000];

    for (const fee of feeTiers) {
        console.log(`\n🔎 Checking Pool (Fee Tier: ${fee})`);
        try {
            let tokenIn = USDC;
            let tokenOut = CBBTC;

            // ✅ Ensure Token Order is Correct for Uniswap V3
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

            // ✅ Call Quoter for Swap Estimate
            console.log("🔍 Calling Quoter for Swap Estimate...");
            for (const testAmount of testAmounts) {
                try {
                    console.log(`🔹 Testing Quoter with ${ethers.formatUnits(testAmount, 6)} USDC...`);

                    const params = {
                        tokenIn,
                        tokenOut,
                        fee,
                        amountIn: testAmount,
                        sqrtPriceLimitX96: 0
                    };

                    // ✅ Call the function and extract results
                    const result = await quoter.callStatic.quoteExactInputSingle(params);

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

/**
 * Main function that runs all steps.
 */
async function main() {
    console.log("\n🚀 Debugging Uniswap Swap with Pool & Quoter Analysis...");

    const { provider, userWallet } = await initializeProvider();
    const contracts = await initializeContracts(provider, userWallet);

    if (!contracts) {
        console.error("❌ ERROR: Contracts could not be initialized.");
        return;
    }

    const { quoter, factory } = contracts;

    if (!(await validateQuoter(quoter))) {
        console.error("❌ ERROR: Quoter validation failed.");
        return;
    }

    await getSwapEstimates(quoter, factory);
}

main().catch(console.error);