import { ethers } from "ethers";
import dotenv from "dotenv";
import { abi as IUniswapV3PoolABI } from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import { abi as IUniswapV3RouterABI } from "@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);

const QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
const ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; // Uniswap V3 Router
const POOL_ADDRESS = "0xINSERT_YOUR_POOL_ADDRESS_HERE"; // Pool for the pair

const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

async function swapWithoutFees(amountIn) {
    const pool = new ethers.Contract(POOL_ADDRESS, IUniswapV3PoolABI, wallet);
    const router = new ethers.Contract(ROUTER_ADDRESS, IUniswapV3RouterABI, wallet);

    console.log("🔍 Injecting MASS Liquidity...");
    await pool.mint(wallet.address, -887220, 887220, ethers.parseUnits("100000", 6), "0x");

    console.log("🔄 Swapping Without Fees...");
    const params = {
        tokenIn: USDC,
        tokenOut: CBBTC,
        fee: 500, 
        recipient: wallet.address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10, 
        amountIn: amountIn,
        amountOutMinimum: 0, 
        sqrtPriceLimitX96: 0
    };

    await router.exactInputSingle(params);

    console.log("🔄 Removing MASS Liquidity...");
    await pool.burn(-887220, 887220, ethers.parseUnits("100000", 6));

    console.log("✅ Swap Complete Without Fees!");
}

swapWithoutFees(ethers.parseUnits("1", 6)).catch(console.error);