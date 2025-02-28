import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";
import SWAP_ROUTER_ABI from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";

dotenv.config();

// ✅ Uniswap Contract Addresses
const QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
const ROUTER_ADDRESS = "0x2626664c2603336E57B271c5C0b26F421741e481";
const FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";

// ✅ Token Addresses
const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

// ✅ Address Zero
const AddressZero = ethers.ZeroAddress || "0x0000000000000000000000000000000000000000";

// ✅ Fetch ABI from BaseScan
async function fetchQuoterABI() {
    try {
        console.log("\n🔍 Fetching Quoter ABI from BaseScan...");
        const response = await axios.get(
            `https://api.basescan.org/api?module=contract&action=getabi&address=${QUOTER_ADDRESS}&apikey=${process.env.BASESCAN_API_KEY}`
        );

        if (response.data.status !== "1") throw new Error(`BaseScan API Error: ${response.data.message}`);

        const abi = JSON.parse(response.data.result);
        console.log("\n🔎 Full ABI Structure:", abi);

        if (!Array.isArray(abi)) {
            throw new Error("Fetched ABI is not an array. Possible malformed ABI.");
        }

        console.log(`✅ ABI Fetched Successfully: ${abi.length} functions loaded.`);

        // ✅ Ensure ABI contains `quoteExactInputSingle`
        if (!abi.some((entry) => entry.name === "quoteExactInputSingle")) {
            throw new Error("🚨 ABI does NOT contain `quoteExactInputSingle`. Check contract compatibility.");
        }

        return abi;
    } catch (error) {
        console.error("❌ Failed to fetch ABI from BaseScan:", error.message);
        return null;
    }
}

async function main() {
    console.log("\n🚀 Debugging Uniswap Swap with Pool & Quoter Analysis...");

    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
    const balance = await provider.getBalance(userWallet.address);

    console.log(`💰 Wallet Balance: ${ethers.formatUnits(balance, "ether")} ETH`);

    const nonce = await provider.getTransactionCount(userWallet.address, "latest");
    console.log("✅ Connected to Network:", await provider.getNetwork());
    console.log(`✅ Using Test Wallet: ${userWallet.address} (Next Nonce: ${nonce})`);

    const factory = new ethers.Contract(FACTORY_ADDRESS, ["function getPool(address,address,uint24) external view returns (address)"], provider);

    // ✅ Fetch Quoter ABI & Validate
    const quoterABI = await fetchQuoterABI();
    if (!quoterABI || quoterABI.length === 0) {
        console.error("❌ ERROR: Quoter ABI is invalid or empty.");
        return;
    }

    console.log("\n🔍 Validating Quoter ABI Format...");
    if (!quoterABI.some((entry) => entry.type === "function")) {
        console.error("❌ ERROR: ABI does not contain function signatures.");
        return;
    }
    console.log("✅ ABI contains valid function signatures.");

    // ✅ Initialize Quoter Contract
    const quoter = new ethers.Contract(QUOTER_ADDRESS, quoterABI, provider);
    console.log("✅ Quoter Contract Initialized!");

    // ✅ Debug: Log quoter contract details
    console.log("\n🔍 Quoter Contract Debug:", quoter);

    if (!quoter.interface) {
        console.error("❌ ERROR: `quoter.interface` is undefined.");
        return;
    }

    // ✅ Use `.fragments` instead of `.functions` (Ethers v6)
    const quoterFunctions = quoter.interface.fragments
        .filter((frag) => frag.type === "function")
        .map((frag) => frag.name);

    console.log("🔍 Quoter Available Functions:", quoterFunctions);

    if (!quoterFunctions.includes("quoteExactInputSingle")) {
        console.error("❌ ERROR: `quoteExactInputSingle` function not found in Quoter contract!");
        return;
    }

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
            if (pool === AddressZero) {
                console.warn(`⚠️ No Pool Found for Fee Tier ${fee}`);
                continue;
            }
            console.log(`✅ Pool Exists at: ${pool}`);

            console.log("🔍 Calling Quoter for Swap Estimate...");
            for (const testAmount of testAmounts) {
                try {
                    console.log(`🔹 Testing Quoter with ${ethers.formatUnits(testAmount, 6)} USDC...`);

                    const params = {
                        tokenIn,
                        tokenOut,
                        fee,
                        amountIn: testAmount,
                        sqrtPriceLimitX96: 0,
                    };

                    console.log("✅ Calling `quoteExactInputSingle` with params:", params);
                    const result = await quoter.callStatic.quoteExactInputSingle(
                        params.tokenIn,
                        params.tokenOut,
                        params.fee,
                        params.amountIn,
                        params.sqrtPriceLimitX96
                    );

                    if (!result || !result.amountOut) {
                        console.error(`❌ ERROR: Quoter returned null response for Fee ${fee}`);
                        continue;
                    }

                    console.log(`✅ Estimated Output for Fee ${fee}: ${ethers.formatUnits(result.amountOut, 8)} CBBTC`);
                } catch (error) {
                    console.error(`❌ Swap Estimate Failed for Fee ${fee}:`, error.message);
                }
            }
        } catch (error) {
            console.error(`❌ Error Fetching Pool ${fee}:`, error.message);
        }
    }
}

main().catch(console.error);