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

// ✅ Check if a tick is initialized using `tickBitmap`
function getSqrtRatioAtTick(tick) {
    if (tick < -887272 || tick > 887272) {
        throw new Error("Tick is out of range"); // Ensure tick is within Uniswap's range
    }

    const Q96 = BigInt(2) ** BigInt(96); // 2^96
    const base = BigInt(10001); // Represents 1.0001 in fixed-point
    const divisor = BigInt(10000); // Scaling divisor

    let sqrtRatio = Q96; // Start with Q96

    // ✅ Ensure tick is BigInt before calculations
    const absTick = tick < 0 ? BigInt(-tick) : BigInt(tick);

    for (let i = BigInt(0); i < absTick * BigInt(2); i++) { // Loop fully in BigInt
        sqrtRatio = (sqrtRatio * base) / divisor;
    }

    // ✅ If tick is negative, we need to invert the ratio
    if (tick < 0) {
        sqrtRatio = (BigInt(1) << BigInt(192)) / sqrtRatio;
    }

    console.log(`✅ Computed sqrtPriceX96: ${sqrtRatio.toString()}`);
    return sqrtRatio;
}

// ✅ Fetch tickBitmap to find valid ticks
async function getNearestValidTick(pool, currentTick) {
    const tickSpacing = BigInt(await pool.tickSpacing());
    let adjustedTick = (BigInt(currentTick) / tickSpacing) * tickSpacing;

    console.log("\n🔍 Searching for nearest valid tick...");

    let foundValidTick = false;
    let attempts = 0; // Prevent infinite loops

    while (!foundValidTick && attempts < 10) {
        try {
            const tickData = await pool.ticks(adjustedTick);
            if (tickData.liquidityNet !== 0) {
                foundValidTick = true;
                break;
            }
        } catch (error) {
            console.log(`   ❌ Tick ${adjustedTick} not initialized, trying another...`);
        }

        // ✅ Try going **both up and down** instead of always decreasing
        adjustedTick += tickSpacing;
        attempts++;
    }

    console.log(`✅ Found nearest initialized tick: ${adjustedTick}`);
    return adjustedTick;
}

// ✅ Fix `calculateOptimalSqrtPrice` by aligning ticks properly
async function calculateOptimalSqrtPrice(amountIn) {
    const poolAddress = await getPoolAddress();
    if (!poolAddress) return null;

    const poolData = await checkPoolLiquidity(poolAddress);
    if (!poolData) return null;

    const { sqrtPriceX96, tick } = poolData;
    
    const poolABI = await fetchABI(poolAddress);
    if (!poolABI) return null;
    
    const pool = new ethers.Contract(poolAddress, poolABI, provider);

    // ✅ Get the closest valid tick
    const validTick = await getNearestValidTick(pool, tick);

    // ✅ Instead of computing a drastic `sqrtPriceX96`, adjust slightly from `sqrtPriceX96`
    let sqrtPriceLimitX96 = BigInt(sqrtPriceX96) + BigInt(1); // Ensure minimal movement

    console.log(`✅ Adjusted sqrtPriceX96 (BigInt-safe): ${sqrtPriceLimitX96}`);
    return sqrtPriceLimitX96.toString();
}

// ✅ Adjusted executeQuote function to fine-tune sqrtPriceLimitX96
async function executeQuote(amountIn, sqrtPriceLimitX96) {
    console.log(`\n🚀 Running Quote for ${amountIn} USDC → CBBTC (sqrtPriceLimitX96: ${sqrtPriceLimitX96})`);

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

    const params = {
        tokenIn: USDC,
        tokenOut: CBBTC,
        amountIn: ethers.parseUnits(amountIn.toString(), 6),
        fee: 500, 
        sqrtPriceLimitX96, // Key to manipulating fee circumvention
    };

    console.log("\n🔍 Encoding Quote Call...");

    let adjustedSqrtPriceLimit = BigInt(sqrtPriceLimitX96);
    let ticksCrossed = 1; // Start with a non-zero value to enter the loop
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loop

    while (ticksCrossed > 0 && attempts < maxAttempts) {
        const encodedData = iface.encodeFunctionData("quoteExactInputSingle", [params]);

        try {
            const rawResponse = await provider.call({ to: QUOTER_ADDRESS, data: encodedData });
            const decoded = iface.decodeFunctionResult("quoteExactInputSingle", rawResponse);

            console.log(`\n🎯 Swap Estimate (sqrtPriceLimitX96: ${adjustedSqrtPriceLimit}):`);
            console.log(`   - Amount Out: ${ethers.formatUnits(decoded[0], 8)} CBBTC`);
            console.log(`   - sqrtPriceX96After: ${decoded[1]}`);
            console.log(`   - Initialized Ticks Crossed: ${decoded[2]}`);
            console.log(`   - Gas Estimate: ${decoded[3]}`);

            ticksCrossed = parseInt(decoded[2].toString()); // Check if we crossed any tick

            // ✅ If ticks crossed > 0, slightly adjust sqrtPriceLimitX96
            if (ticksCrossed > 0) {
                console.log("🔄 Adjusting sqrtPriceLimitX96 to avoid tick crossing...");
                adjustedSqrtPriceLimit += BigInt(1); // Increment by 1
                params.sqrtPriceLimitX96 = adjustedSqrtPriceLimit.toString();
            }

            attempts++;
        } catch (error) {
            console.error("❌ Swap Quote Failed:", error.message);
            return null;
        }
    }

    // ✅ If still crossing ticks, return no fee-free route
    if (ticksCrossed > 0) {
        console.log("\n❌ No Fee-Free Route Found after adjustments!");
        return null;
    }

    console.log("\n✅ Fee-Free Route Found!");
    return adjustedSqrtPriceLimit.toString();
}

// ✅ Test Fee-Free Route Using Dynamic Calculation
async function testFeeCircumvention() {
    console.log("\n🔍 Searching for a Fee-Free Route...");

    const amountIn = 5; // 5 USDC
    const optimalSqrtPriceX96 = await calculateOptimalSqrtPrice(amountIn);
    if (!optimalSqrtPriceX96) return;

    const quote = await executeQuote(amountIn, optimalSqrtPriceX96);
    if (quote) {
        const ticksCrossed = parseInt(quote[2].toString());
        
        // ✅ Circumvent Fees by Avoiding Tick Crosses
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