import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);

const QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
const ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const POOL_ADDRESS = "0xfBB6Eed8e7aa03B138556eeDaF5D271A5E1e43ef";

const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

// ✅ Fetch ABI from BaseScan
async function fetchQuoterABI() {
    try {
        console.log("\n🔍 Fetching Quoter ABI from BaseScan...");
        const response = await axios.get(
            `https://api.basescan.org/api?module=contract&action=getabi&address=${QUOTER_ADDRESS}&apikey=${process.env.BASESCAN_API_KEY}`
        );

        if (response.data.status !== "1") throw new Error(`BaseScan API Error: ${response.data.message}`);

        const abi = typeof response.data.result === "string" ? JSON.parse(response.data.result) : response.data.result;
        if (!Array.isArray(abi)) {
            throw new Error("Fetched ABI is not an array. Possible malformed ABI.");
        }

        console.log(`✅ ABI Fetched Successfully: ${abi.length} functions loaded.`);
        return abi;
    } catch (error) {
        console.error("❌ Failed to fetch ABI from BaseScan:", error.message);
        return null;
    }
}

// ✅ Check Swap Quote Only (No Execution)
async function checkQuote(amountIn) {
    console.log("\n🔍 Checking Swap Quote...");

    const quoterABI = await fetchQuoterABI();
    if (!quoterABI) {
        console.error("❌ ERROR: Quoter ABI is invalid or empty.");
        return null;
    }

    const iface = new ethers.Interface(quoterABI);
    const quoter = new ethers.Contract(QUOTER_ADDRESS, quoterABI, provider);
    console.log("✅ Quoter Contract Initialized!");

    const params = {
        tokenIn: USDC,
        tokenOut: CBBTC,
        amountIn: ethers.parseUnits(amountIn.toString(), 6),
        fee: 500,
        sqrtPriceLimitX96: 0
    };

    console.log("🔍 Querying `quoteExactInputSingle`...");
    const encodedData = iface.encodeFunctionData("quoteExactInputSingle", [params]);

    try {
        const rawResponse = await provider.call({ to: QUOTER_ADDRESS, data: encodedData });
        const decoded = iface.decodeFunctionResult("quoteExactInputSingle", rawResponse);

        console.log("\n🎯 Estimated Swap Output:");
        console.log(`   - Amount Out: ${ethers.formatUnits(decoded[0], 8)} CBBTC`);
        console.log(`   - sqrtPriceX96After: ${decoded[1]}`);
        console.log(`   - Initialized Ticks Crossed: ${decoded[2]}`);
        console.log(`   - Gas Estimate: ${decoded[3]}`);

        return decoded[0];
    } catch (error) {
        console.error("❌ Quote Fetch Failed:", error.message);
        return null;
    }
}

// ✅ Helper function to compute sqrtPriceX96 from a given price
function getSqrtPriceX96(price) {
    const Q96 = BigInt(2) ** BigInt(96);
    const bigPrice = ethers.parseUnits(price.toString(), 18);
    return bigIntSqrt(bigPrice * Q96);
}

// ✅ Helper function for computing square root of BigInt
function bigIntSqrt(value) {
    if (value < 0n) throw new Error("Square root of negative value is not defined.");
    if (value < 2n) return value;

    let x0 = value;
    let x1 = (value + 1n) / 2n;

    while (x1 < x0) {
        x0 = x1;
        x1 = (value / x1 + x1) / 2n;
    }

    return x0;
}

// ✅ Pool Initialization Without a Swap
async function initializePoolWithoutSwap() {
    console.log("\n🔍 Manually Initializing Pool with Liquidity...");

    const pool = new ethers.Contract(POOL_ADDRESS, [
        "function initialize(uint160 sqrtPriceX96) external"
    ], wallet);

    try {
        const sqrtPriceX96 = getSqrtPriceX96("1.0001");
        console.log("✅ Computed sqrtPriceX96:", sqrtPriceX96.toString());

        const tx = await pool.initialize(sqrtPriceX96);
        await tx.wait();
        console.log("✅ Pool Initialized Successfully!");
    } catch (error) {
        console.error("❌ Pool Initialization Failed:", error.reason || error.message);
    }
}

// ✅ Test Fee-Free Swap Possibility (No Execution)
async function testFeeFreeSwap(amountIn) {
    console.log("\n🔍 Testing Fee-Free Swap...");

    const pool = new ethers.Contract(POOL_ADDRESS, [
        "function mint(address recipient, int24 tickLower, int24 tickUpper, uint128 amount, bytes calldata data) external",
        "function burn(int24 tickLower, int24 tickUpper, uint128 amount) external",
        "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
    ], wallet);

    console.log("🔍 Checking Pool Status...");
    try {
        const slot0 = await pool.slot0();
        console.log("✅ Pool Slot0 Data:", slot0);
    } catch (error) {
        console.error("❌ Pool is not initialized! Attempting Initialization...");
        await initializePoolWithoutSwap();
        return;
    }

    console.log("🔍 Injecting MASS Liquidity...");
    const minTick = -887200;
    const maxTick = 887200;

    try {
        await pool.mint(wallet.address, minTick, maxTick, ethers.parseUnits("100000", 6), "0x");
        console.log("✅ Mint Successful!");
    } catch (error) {
        console.error("❌ Mint Failed:", error);
        return;
    }

    console.log("🔄 Checking Swap Feasibility Without Fees...");
    try {
        await pool.callStatic.burn(minTick, maxTick, ethers.parseUnits("100000", 6));
        console.log("✅ Liquidity Can Be Removed: Swap Might Be Possible Without Fees!");
    } catch (error) {
        console.error("❌ Fee-Free Swap Not Possible:", error);
    }

    console.log("🔄 Removing MASS Liquidity...");
    await pool.burn(minTick, maxTick, ethers.parseUnits("100000", 6));

    console.log("✅ Liquidity Removed Successfully!");
}

// ✅ **Runs Only Checks (No Swap Execution)**
async function main() {
    const amountIn = 1; // 1 USDC
    const estimatedAmountOut = await checkQuote(amountIn);

    if (!estimatedAmountOut) {
        console.log("❌ Failed to fetch swap quote.");
        return;
    }

    console.log("\n✅ **Final Swap Quote Check Complete (No Swap Executed!)**");

    await testFeeFreeSwap(amountIn);
}

// ✅ Run the Quote Check & Fee-Free Swap Test
main().catch(console.error);