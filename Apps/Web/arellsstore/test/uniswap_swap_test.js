import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// ✅ Uniswap Contract Addresses
const QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
const FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";

// ✅ Token Addresses
const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

// ✅ Set Up Ethereum Provider
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);

async function checkTickMathContract() {
    const tickMathAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984"; 
    const code = await provider.getCode(tickMathAddress);
    if (code === "0x") {
        console.error("❌ TickMath contract is NOT deployed on Base.");
        return false;
    }
    console.log("✅ TickMath contract exists on Base.");
    return true;
}

// ✅ Fetch ABI from BaseScan (Correct Format for JavaScript)
async function fetchABI(contractAddress) {
    try {
        console.log(`\n🔍 Fetching ABI for ${contractAddress} from BaseScan...`);
        const response = await axios.get(
            `https://api.basescan.org/api?module=contract&action=getabi&address=${contractAddress}&apikey=${process.env.BASESCAN_API_KEY}`
        );

        if (response.data.status !== "1") throw new Error(`BaseScan API Error: ${response.data.message}`);

        const abi = JSON.parse(response.data.result);
        console.log(`✅ ABI Fetched Successfully for ${contractAddress}`);
        return abi;
    } catch (error) {
        console.error("❌ Failed to fetch ABI:", error.message);
        return null;
    }
}

// ✅ Get Uniswap V3 Pool Address
async function getPoolAddress() {
    const factoryABI = await fetchABI(FACTORY_ADDRESS);
    if (!factoryABI) return null;

    const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);
    try {
        const poolAddress = await factory.getPool(USDC, CBBTC, 500);
        if (poolAddress === ethers.ZeroAddress) {
            console.error("❌ No Uniswap V3 Pool found for USDC-CBBTC.");
            return null;
        }
        console.log(`✅ Pool Address: ${poolAddress}`);
        return poolAddress;
    } catch (error) {
        console.error("❌ Failed to fetch pool address:", error.message);
        return null;
    }
}

// ✅ Check Pool Liquidity
async function checkPoolLiquidity(poolAddress) {
    const poolABI = await fetchABI(poolAddress);
    if (!poolABI) return null;

    const pool = new ethers.Contract(poolAddress, poolABI, provider);
    try {
        const slot0 = await pool.slot0();
        const liquidity = await pool.liquidity();

        console.log("\n🔍 Pool Liquidity Data:");
        console.log(`   - sqrtPriceX96: ${slot0[0]}`);
        console.log(`   - Current Tick: ${slot0[1]}`);
        console.log(`   - Liquidity: ${liquidity}`);

        return { liquidity, sqrtPriceX96: slot0[0], tick: slot0[1] };
    } catch (error) {
        console.error("❌ Failed to fetch liquidity:", error.message);
        return null;
    }
}

async function getSqrtRatioAtTick(tick) {
    if (tick < -887272 || tick > 887272) {
        throw new Error("Tick is out of range");
    }

    const MIN_TICK = -887272;
    const MAX_TICK = 887272;
    const MIN_SQRT_RATIO = BigInt(4295128739);
    const MAX_SQRT_RATIO = BigInt(1461446703485210103287273052203988822378723970342);

    if (tick <= MIN_TICK) return MIN_SQRT_RATIO;
    if (tick >= MAX_TICK) return MAX_SQRT_RATIO;

    let ratio = BigInt("0xfffcb933bd6fad37aa2d162d1a594001");

    for (let i = 1; i <= Math.abs(tick); i++) {
        ratio = (ratio * BigInt(10001)) / BigInt(10000);
    }

    return ratio;
}

async function calculateOptimalSqrtPrice() {
    const poolAddress = await getPoolAddress();
    if (!poolAddress) return null;

    const poolData = await checkPoolLiquidity(poolAddress);
    if (!poolData) return null;

    const { sqrtPriceX96, tick } = poolData;
    const poolABI = await fetchABI(poolAddress);
    if (!poolABI) return null;

    const pool = new ethers.Contract(poolAddress, poolABI, provider);

    console.log(`🔍 Current sqrtPriceX96: ${sqrtPriceX96}`);

    // ✅ Define a percentage buffer (e.g., 1% price shift)
    const PERCENTAGE_BUFFER = 0.01; // 1%

    let sqrtPriceLimitX96 = BigInt(sqrtPriceX96) + (BigInt(sqrtPriceX96) * BigInt(Math.floor(PERCENTAGE_BUFFER * 100))) / BigInt(100);

    // ✅ Clamp within Uniswap's valid range
    const MIN_SQRT_RATIO = BigInt(4295128739);
    const MAX_SQRT_RATIO = BigInt(1461446703485210103287273052203988822378723970342);

    if (sqrtPriceLimitX96 < MIN_SQRT_RATIO) {
        console.log(`⚠️ Adjusting sqrtPriceLimitX96 to MIN_SQRT_RATIO: ${MIN_SQRT_RATIO}`);
        sqrtPriceLimitX96 = MIN_SQRT_RATIO;
    } else if (sqrtPriceLimitX96 > MAX_SQRT_RATIO) {
        console.log(`⚠️ Adjusting sqrtPriceLimitX96 to MAX_SQRT_RATIO: ${MAX_SQRT_RATIO}`);
        sqrtPriceLimitX96 = MAX_SQRT_RATIO;
    }

    console.log(`✅ Final sqrtPriceLimitX96: ${sqrtPriceLimitX96}`);
    return sqrtPriceLimitX96.toString();
}
async function executeQuote(amountIn, sqrtPriceLimitX96) {
    console.log(`\n🚀 Running Quote for ${amountIn} USDC → CBBTC`);

    const poolAddress = await getPoolAddress();
    if (!poolAddress) return;

    const poolData = await checkPoolLiquidity(poolAddress);
    if (!poolData || poolData.liquidity === 0) {
        console.error("❌ Pool has ZERO liquidity. No swap can be performed.");
        return;
    }

    const quoterABI = await fetchABI(QUOTER_ADDRESS);
    if (!quoterABI) return;

    const iface = new ethers.Interface(quoterABI);
    const quoter = new ethers.Contract(QUOTER_ADDRESS, quoterABI, provider);

    console.log(`✅ Resolved sqrtPriceLimitX96: ${sqrtPriceLimitX96}`);

    if (!sqrtPriceLimitX96 || isNaN(Number(sqrtPriceLimitX96))) {
        console.error("❌ ERROR: Invalid sqrtPriceLimitX96 value detected.");
        return;
    }

    const params = {
        tokenIn: USDC,
        tokenOut: CBBTC,
        amountIn: ethers.parseUnits(amountIn.toString(), 6),
        fee: 500,
        sqrtPriceLimitX96: sqrtPriceLimitX96,
    };

    console.log("\n🔍 Encoding Quote Call with parameters:");
    console.log(params);

    try {
        const encodedData = iface.encodeFunctionData("quoteExactInputSingle", [params]);
        console.log(`📩 Encoded Data: ${encodedData}`);

        const rawResponse = await provider.call({ to: QUOTER_ADDRESS, data: encodedData });
        console.log(`📩 Raw Response: ${rawResponse}`);

        const decoded = iface.decodeFunctionResult("quoteExactInputSingle", rawResponse);

        console.log(`\n🎯 Swap Estimate:`);
        console.log(`   - Amount Out: ${ethers.formatUnits(decoded[0], 8)} CBBTC`);
        console.log(`   - sqrtPriceX96After: ${decoded[1]}`);
        console.log(`   - Initialized Ticks Crossed: ${decoded[2]}`);
        console.log(`   - Gas Estimate: ${decoded[3]}`);

        return sqrtPriceLimitX96;
    } catch (error) {
        console.error("❌ Swap Quote Failed:", error);
        return null;
    }
}
// ✅ Test Fee-Free Route Using Dynamic Calculation
async function testFeeCircumvention() {
    console.log("\n🔍 Searching for a Fee-Free Route...");

    const amountIn = 5; // 5 USDC
    const optimalSqrtPriceX96 = await calculateOptimalSqrtPrice(); // ✅ Ensure the function is awaited

    if (!optimalSqrtPriceX96) return;

    const quote = await executeQuote(amountIn, optimalSqrtPriceX96); // ✅ Pass resolved value

    if (quote) {
        const ticksCrossed = parseInt(quote[2].toString());

        if (ticksCrossed === 0) {
            console.log("\n✅ **Fee-Free Swap Found!**");
            console.log(`   - sqrtPriceLimitX96: ${optimalSqrtPriceX96}`);
            console.log(`   - Amount Out: ${ethers.formatUnits(quote[0], 8)} CBBTC`);
            return;
        }
    }

    console.log("\n❌ No Fee-Free Route Found!");
}

async function main() {
    await testFeeCircumvention();
}

main().catch(console.error);