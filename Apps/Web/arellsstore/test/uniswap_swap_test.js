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

// ✅ Set Up Ethereum Provider & Wallet
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
const signer = userWallet.connect(provider);
console.log(`✅ Using Test Wallet: ${userWallet.address}`);

// ✅ Get Token Contract Instances
const USDCContract = new ethers.Contract(USDC, ["function balanceOf(address) view returns (uint256)", "function approve(address, uint256)"], userWallet);
const CBBTCContract = new ethers.Contract(CBBTC, ["function balanceOf(address) view returns (uint256)"], userWallet);

/**
 * ✅ Fetch ABI from BaseScan
 */
async function fetchABI(contractAddress) {
    try {
        console.log(`🔍 Fetching ABI for ${contractAddress} from BaseScan...`);
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
 * ✅ Get Uniswap V3 Pool Address
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
 * ✅ Check Pool Liquidity
 */
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

        return { liquidity, sqrtPriceX96: slot0[0], tick: slot0[1], tickSpacing };
    } catch (error) {
        console.error("❌ Failed to fetch liquidity:", error.message);
        return null;
    }
}

/**
 * ✅ Check if Wallet Has Enough USDC for Trade
 */
async function hasSufficientUSDC(amountIn) {
    const balance = await USDCContract.balanceOf(userWallet.address);
    const balanceFormatted = ethers.formatUnits(balance, 6);
    console.log(`💰 USDC Balance: ${balanceFormatted}`);
    
    if (Number(balanceFormatted) < amountIn) {
        console.error(`❌ Insufficient USDC Balance! Required: ${amountIn}, Available: ${balanceFormatted}`);
        return false;
    }
    return true;
}

/**
 * ✅ Check Fee-Free Route
 */
async function checkFeeFreeRoute(amountIn) {
    console.log(`\n🚀 Checking Fee-Free Route for ${amountIn} USDC → CBBTC`);

    const poolAddress = await getPoolAddress();
    if (!poolAddress) return false;

    const poolData = await checkPoolLiquidity(poolAddress);
    if (!poolData || poolData.liquidity === 0) {
        console.error("❌ Pool has ZERO liquidity. No swap can be quoted.");
        return false;
    }

    // ✅ Define the tick range to check
    const tickLower = Math.floor(Number(poolData.tick) / Number(poolData.tickSpacing)) * Number(poolData.tickSpacing);
    const tickUpper = tickLower + Number(poolData.tickSpacing);

    console.log(`\n🔍 Checking liquidity between ticks: ${tickLower} → ${tickUpper}`);

    if (poolData.liquidity > 0) {
        console.log(`\n✅ **Fee-Free Route Available for ${amountIn} USDC!** 🚀`);
        return true;
    }

    console.log(`\n❌ No Fee-Free Route Found for ${amountIn} USDC.`);
    return false;
}

/**
 * ✅ Execute Swap Transaction
 */
const swapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; // Uniswap V3 Router on Base

async function executeSwap(amountIn) {
    console.log(`\n🚀 Executing Swap: ${amountIn} USDC → CBBTC`);

    // ✅ Check if the wallet has sufficient USDC balance
    const hasBalance = await hasSufficientUSDC(amountIn);
    if (!hasBalance) {
        console.error(`❌ Aborting swap! Not enough USDC.`);
        return;
    }

    // ✅ Ensure a Fee-Free Route Exists
    const isFeeFree = await checkFeeFreeRoute(amountIn);
    if (!isFeeFree) {
        console.error(`❌ Aborting swap! No fee-free route found.`);
        return;
    }

    // ✅ Get the pool data (again) to ensure up-to-date liquidity info
    const poolAddress = await getPoolAddress();
    if (!poolAddress) return;

    const poolData = await checkPoolLiquidity(poolAddress);
    if (!poolData || poolData.liquidity === 0) {
        console.error("❌ Pool has ZERO liquidity. No swap can be performed.");
        return;
    }

    // ✅ Use the Uniswap V3 Router contract
    const routerABI = await fetchABI(swapRouterAddress);
    const swapRouter = new ethers.Contract(swapRouterAddress, routerABI, userWallet);

    // ✅ Swap parameters ensuring fee-free conditions
    const params = {
        tokenIn: USDC,
        tokenOut: CBBTC,
        fee: 500,
        recipient: userWallet.address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10, // 10 min deadline
        amountIn: ethers.parseUnits(amountIn.toString(), 6),
        amountOutMinimum: 0,
        sqrtPriceLimitX96: poolData.sqrtPriceX96
    };

    console.log("\n🔍 Encoding Swap Call...");
    
    try {
        const tx = await swapRouter.exactInputSingle(params, {
            gasLimit: 250000,
        });

        console.log(`🚀 Executing Swap on Uniswap V3...`);
        const receipt = await tx.wait();
        console.log(`✅ Swap Executed Successfully!`);
        console.log(`🔗 Transaction Hash: ${receipt.transactionHash}`);
    } catch (error) {
        console.error(`❌ Swap Execution Failed: ${error.message}`);
    }
}

/**
 * ✅ Main Function: Execute Swap for $5 USDC
 */
async function main() {
    console.log("\n🔍 Checking for a Fee-Free Quote...");

    const usdcAmountToTrade = 5.00; // Adjust as needed
    await executeSwap(usdcAmountToTrade);
}

main().catch(console.error);