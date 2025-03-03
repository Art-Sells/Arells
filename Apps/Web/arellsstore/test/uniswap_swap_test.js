import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// ✅ Uniswap Contract Addresses
const QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
const FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";
const SWAP_ROUTER_ADDRESS = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"; // ✅ Uniswap V3 Swap Router

// ✅ Token Addresses
const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

// ✅ Set Up Ethereum Provider & Wallet
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
console.log(`✅ Using Test Wallet: ${userWallet.address}`);

// ✅ ERC-20 ABI (For `balanceOf`, `approve`, and `allowance`)
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 value) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

/**
 * 🔍 Fetch ABI from BaseScan
 */
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

/**
 * 🔍 Get Uniswap V3 Pool Address
 */
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

/**
 * 🔍 Check Pool Liquidity
 */
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

/**
 * 🔍 Execute Swap Quote
 */
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
        sqrtPriceLimitX96,
    };

    console.log("\n🔍 Encoding Quote Call...");
    const encodedData = iface.encodeFunctionData("quoteExactInputSingle", [params]);

    try {
        const rawResponse = await provider.call({ to: QUOTER_ADDRESS, data: encodedData });
        const decoded = iface.decodeFunctionResult("quoteExactInputSingle", rawResponse);

        console.log(`\n🎯 Swap Estimate (sqrtPriceLimitX96: ${sqrtPriceLimitX96}):`);
        console.log(`   - Amount Out: ${ethers.formatUnits(decoded[0], 8)} CBBTC`);
        console.log(`   - sqrtPriceX96After: ${decoded[1]}`);
        console.log(`   - Initialized Ticks Crossed: ${decoded[2]}`);
        console.log(`   - Gas Estimate: ${decoded[3]}`);

        return decoded;
    } catch (error) {
        console.error("❌ Swap Quote Failed:", error.message);
        return null;
    }
}

/**
 * 🔍 Test Fee Circumvention
 */
async function testFeeCircumvention() {
    console.log("\n🔍 Searching for a Fee-Free Route...");

    const poolAddress = await getPoolAddress();
    if (!poolAddress) return;

    const poolData = await checkPoolLiquidity(poolAddress);
    if (!poolData) return;

    // ✅ Expanded range for sqrtPriceLimitX96 testing
    const sqrtPriceLimits = [
        poolData.sqrtPriceX96,  
        "1000000000000000000",
        "10000000000000000000",
        "100000000000000000000",
        "200000000000000000000",
        "500000000000000000000",
        "1000000000000000000000"
    ];

    let feeFreeQuote = null;

    for (const sqrtLimit of sqrtPriceLimits) {
        const quote = await executeQuote(5, sqrtLimit);
        if (quote) {
            const ticksCrossed = parseInt(quote[2].toString());

            // ✅ Circumvent Fees by Avoiding Tick Crosses
            if (ticksCrossed === 0) {
                feeFreeQuote = { sqrtLimit, amountOut: ethers.formatUnits(quote[0], 8) };
                break;
            }
        }
    }

    if (feeFreeQuote) {
        console.log("\n✅ **Fee-Free Swap Found!**");
        console.log(`   - sqrtPriceLimitX96: ${feeFreeQuote.sqrtLimit}`);
        console.log(`   - Amount Out: ${feeFreeQuote.amountOut} CBBTC`);
    } else {
        console.log("\n❌ No Fee-Free Route Found!");
    }
}

/**
 * 🔥 Run the Fee Circumvention Strategy
 */
async function main() {
    await testFeeCircumvention();
}

main().catch(console.error);