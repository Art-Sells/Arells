import { ethers } from "hardhat";
import dotenv from "dotenv";
import SWAP_ROUTER_ABI from "@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json";

dotenv.config();

async function main() {
    console.log("\n🚀 Debugging Uniswap Swap with Pool & Quoter Analysis...");

    // ✅ Initialize Provider
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
    console.log(`✅ Using Test Wallet: ${userWallet.address}`);

    // ✅ Uniswap V3 Addresses on Base
    const routerAddress = "0x2626664c2603336E57B271c5C0b26F421741e481";
    const quoterAddress = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
    const factoryAddress = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";

    // ✅ Tokens (With Checksum Address)
    const USDC = ethers.getAddress("0x833589fcd6edb6e08f4c7c32d4f71b54bda02913");
    const CBBTC = ethers.getAddress("0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf");

    // ✅ Load Router & Factory Contracts
    const router = new ethers.Contract(routerAddress, SWAP_ROUTER_ABI.abi, userWallet);
    const factory = new ethers.Contract(factoryAddress, ["function getPool(address,address,uint24) external view returns (address)"], provider);

    // ✅ Corrected ABI for Quoter
    const QUOTER_ABI = [
        "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)"
    ];
    const quoter = new ethers.Contract(quoterAddress, QUOTER_ABI, userWallet);
    // ✅ Check Router ABI
    console.log("🔍 Router ABI loaded successfully.");
    const routerFunctions = SWAP_ROUTER_ABI.abi.map(f => f.name).filter(Boolean);
    console.log("🔎 Router Functions Loaded:", routerFunctions);

    // ✅ Check Wallet Balance
    const amountIn = ethers.parseUnits("10", 6); // 10 USDC
    const usdcContract = await ethers.getContractAt("IERC20", USDC, provider);
    const balance = await usdcContract.balanceOf(userWallet.address);
    console.log(`💰 USDC Balance: ${ethers.formatUnits(balance, 6)}`);

    // ✅ Pool Fee Tiers
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
            if (pool === ethers.ZeroAddress) {
                console.warn(`⚠️ No Pool Found for Fee Tier ${fee}`);
                continue;
            }
            console.log(`✅ Pool Exists at: ${pool}`);

            // ✅ Fetch Pool State
            const poolContract = await ethers.getContractAt("IUniswapV3Pool", pool, provider);
            const [slot0, liquidity] = await Promise.all([
                poolContract.slot0(),
                poolContract.liquidity()
            ]);
            console.log(`🔍 Pool State [Fee ${fee}]:`);
            console.log(`   🔹 SqrtPriceX96: ${slot0.sqrtPriceX96}`);
            console.log(`   🔹 Tick: ${slot0.tick}`);
            console.log(`   🔹 Liquidity: ${liquidity}`);

            // ✅ Call Quoter Manually
            console.log("🔍 Calling Quoter for Swap Estimate...");
            const testAmounts = [amountIn / 10n, amountIn / 2n, amountIn];

            console.log("🔎 Fetching Available Quoter Functions...");
            const quoterFunctions = quoter.interface.fragments.map(f => f.name).filter(Boolean);
            console.log("🔎 Available Quoter Functions:", quoterFunctions);

            if (!quoterFunctions.includes("quoteExactInputSingle")) {
                console.error("❌ ERROR: `quoteExactInputSingle` function not found in Quoter contract!");
            } else {
                for (const testAmount of testAmounts) {
                    try {
                        console.log(`🔹 Testing Quoter with ${ethers.formatUnits(testAmount, 6)} USDC...`);
                        const [amountOut, sqrtPriceX96After, initializedTicksCrossed, gasEstimate] =
                        await quoter.callStatic.quoteExactInputSingle(
                            tokenIn, tokenOut, fee, testAmount, 0
                        );

                    console.log(`✅ Estimated Output for Fee ${fee}: ${ethers.formatUnits(amountOut, 8)} CBBTC`);
                    console.log(`🔍 Final SqrtPriceX96: ${sqrtPriceX96After}`);
                    console.log(`📊 Initialized Ticks Crossed: ${initializedTicksCrossed}`);
                    console.log(`⛽ Gas Estimate: ${gasEstimate}`);
                    } catch (error) {
                        console.error(`❌ Swap Estimate Failed for Fee ${fee} at ${ethers.formatUnits(testAmount, 6)} USDC:`, error.message);
                    }
                }
            }

        } catch (error) {
            console.error(`❌ Error Fetching Pool ${fee}:`, error.message);
        }
    }

    // ✅ Check if CBBTC has Transfer Restrictions
    console.log("\n🔍 Testing CBBTC Transfer Restrictions...");
    try {
        const cbBTCContract = await ethers.getContractAt("IERC20", CBBTC, provider);
        const cbBTCBalance = await cbBTCContract.balanceOf(userWallet.address);
        console.log(`💰 CBBTC Balance: ${ethers.formatUnits(cbBTCBalance, 8)}`);

        if (cbBTCBalance < ethers.parseUnits("0.0001", 8)) {
            console.warn("⚠️ Skipping transfer test, insufficient balance.");
        } else {
            const testTx = await cbBTCContract.transfer(userWallet.address, ethers.parseUnits("0.0001", 8));
            console.log("✅ CBBTC Transfer Test Passed!");
        }
    } catch (error) {
        console.error("❌ CBBTC Transfer Test Failed! Possible Transfer Restrictions.", error.message);
    }
}

main().catch(console.error);