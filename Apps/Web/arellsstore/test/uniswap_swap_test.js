import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// ✅ Uniswap Contract Addresses
const FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";

// ✅ Token Addresses
const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

// ✅ Set Up Ethereum Provider
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);

// ✅ Fetch ABI from BaseScan
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
        const tickSpacing = await pool.tickSpacing();

        console.log("\n🔍 Pool Liquidity Data:");
        console.log(`   - sqrtPriceX96: ${slot0[0]}`);
        console.log(`   - Current Tick: ${slot0[1]}`);
        console.log(`   - Liquidity: ${liquidity}`);
        console.log(`   - Tick Spacing: ${tickSpacing}`);

        return { pool, poolAddress, liquidity, sqrtPriceX96: slot0[0], tick: slot0[1], tickSpacing };
    } catch (error) {
        console.error("❌ Failed to fetch liquidity:", error.message);
        return null;
    }
}

// ✅ Check Fee-Free Route by Examining Liquidity at Neighboring Ticks
async function checkFeeFreeRoute() {
    console.log(`\n🚀 Checking Fee-Free Route for 5 USDC → CBBTC`);

    const poolAddress = await getPoolAddress();
    if (!poolAddress) return false;

    const poolData = await checkPoolLiquidity(poolAddress);
    if (!poolData || poolData.liquidity === 0) {
        console.error("❌ Pool has ZERO liquidity. No swap can be quoted.");
        return false;
    }

    console.log(`\n🔍 Current Pool Data:`);
    console.log(`   - sqrtPriceX96: ${poolData.sqrtPriceX96}`);
    console.log(`   - Current Tick: ${poolData.tick}`);
    console.log(`   - Liquidity: ${poolData.liquidity}`);
    console.log(`   - Tick Spacing: ${poolData.tickSpacing}`);

    try {
        const tickLower = (poolData.tick / BigInt(poolData.tickSpacing)) * BigInt(poolData.tickSpacing);
        const tickUpper = tickLower + BigInt(poolData.tickSpacing);

        console.log(`\n🔍 Checking liquidity between ticks: ${tickLower} → ${tickUpper}`);

        const tickDataLower = await poolData.pool.ticks(tickLower);
        const tickDataUpper = await poolData.pool.ticks(tickUpper);

        const liquidityLower = tickDataLower.liquidityGross;
        const liquidityUpper = tickDataUpper.liquidityGross;

        console.log(`   - Liquidity at ${tickLower}: ${liquidityLower}`);
        console.log(`   - Liquidity at ${tickUpper}: ${liquidityUpper}`);

        if (liquidityLower > 0 && liquidityUpper > 0) {
            console.log("\n✅ **Fee-Free Route Available!** 🚀");
            return true;
        } else {
            console.log("\n❌ No Fee-Free Route Found.");
            return false;
        }
    } catch (error) {
        console.error("❌ Error checking tick liquidity:", error);
        return false;
    }
}

// ✅ Run the Fee-Free Quote Test
async function main() {
    console.log("\n🔍 Checking for a Fee-Free Quote...");
    const isFeeFree = await checkFeeFreeRoute();

    if (isFeeFree) {
        console.log("\n✅ **Fee-Free Quote Found!** No Iteration Needed.");
    } else {
        console.log("\n❌ **No Fee-Free Quote Available.** Try Again Later.");
    }
}

main().catch(console.error);