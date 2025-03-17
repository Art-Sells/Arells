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
const USDCContract = new ethers.Contract(USDC, [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address, uint256)",
    "function allowance(address, address) view returns (uint256)"  // ✅ Add `allowance`
], userWallet);
const CBBTCContract = new ethers.Contract(CBBTC, ["function balanceOf(address) view returns (uint256)"], userWallet);


console.log(`🔥 Ethers.js Version: ${ethers.version}`);
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

        // 🔍 Check if `exactInputSingle` exists in ABI
        const functionExists = abi.some((item) => item.name === "exactInputSingle");
        console.log(`🔍 Does ABI Contain 'exactInputSingle'?`, functionExists ? "✅ YES" : "❌ NO");

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
const swapRouterAddress = "0x2626664c2603336E57B271c5C0b26F421741e481"; // ✅ Correct SwapRouter02 on Base

async function getBalances() {
    const usdcBalance = await USDCContract.balanceOf(userWallet.address);
    const cbbtcBalance = await CBBTCContract.balanceOf(userWallet.address);

    return {
        usdc: ethers.formatUnits(usdcBalance, 6), // USDC has 6 decimals
        cbbtc: ethers.formatUnits(cbbtcBalance, 8) // CBBTC has 8 decimals
    };
}

async function approveUSDC(amountIn) {
    console.log(`🔑 Approving Swap Router to spend ${amountIn} USDC...`);

    const allowance = await USDCContract.allowance(userWallet.address, swapRouterAddress);
    console.log(`✅ USDC Allowance: ${ethers.formatUnits(allowance, 6)} USDC`);
    
    if (allowance >= ethers.parseUnits(amountIn.toString(), 6)) {
        console.log("✅ Approval already granted.");
        return;
    }

    // 🔥 Fetch current gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice; // ✅ Correct for Ethers v6
    console.log(`⛽ Current Gas Price: ${ethers.formatUnits(gasPrice, "gwei")} Gwei`);

    // 🔥 Calculate max gas units for $0.03
    const ethPriceInUSD = 2100; // 🟢 Update this with real-time ETH price
    const maxETHForGas = 0.03 / ethPriceInUSD; // Convert $0.03 to ETH
    const maxGasUnits = Math.floor(maxETHForGas / ethers.formatUnits(gasPrice, "ether"));

    console.log(`🔹 Max Gas Allowed: ${maxGasUnits} units (equivalent to $0.03 in ETH)`);

    const tx = await USDCContract.approve(
        swapRouterAddress,
        ethers.parseUnits(amountIn.toString(), 6),
        { gasLimit: maxGasUnits } // 🔥 Limit gas usage
    );

    await tx.wait();
    console.log("✅ Approval Successful!");
}

async function checkETHBalance() {
    const ethBalance = await provider.getBalance(userWallet.address);
    console.log(`💰 ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

    // 🔥 Fetch gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice;  // ✅ Ensure gasPrice is defined here

    // 🔥 Define max gas units allowed
    const maxGasUnitsNumber = 70000n; // Example fixed value, adjust as needed
    const requiredGasETH = gasPrice * maxGasUnitsNumber; // ✅ Now it has gasPrice

    if (ethBalance < requiredGasETH) {
        console.error(`❌ Not enough ETH for gas fees! Required: ${ethers.formatEther(requiredGasETH)} ETH`);
        return false;
    }
    return true;
}

async function executeSwap(amountIn) {
    console.log(`\n🚀 Executing Swap: ${amountIn} USDC → CBBTC`);

    const poolAddress = await getPoolAddress();
    if (!poolAddress) return;

    const poolData = await checkPoolLiquidity(poolAddress);
    if (!poolData || poolData.liquidity === 0) {
        console.error("❌ Pool has ZERO liquidity. No swap can be performed.");
        return;
    }

    const isFeeFree = await checkFeeFreeRoute(amountIn);
    if (!isFeeFree) {
        console.error("❌ No Fee-Free Route Available! Swap will NOT proceed.");
        return;
    }

    console.log("✅ Fee-Free Route Confirmed!");

    const sqrtPriceLimitX96 = poolData.sqrtPriceX96;

    if (!(await checkETHBalance())) {
        return;
    }

    await approveUSDC(amountIn);

    const balancesBefore = await getBalances();
    console.log(`\n🔍 Balances BEFORE Swap:`);
    console.log(`   - USDC: ${balancesBefore.usdc}`);
    console.log(`   - CBBTC: ${balancesBefore.cbbtc}`);

    console.log(`🔍 Fetching SwapRouter ABI for ${swapRouterAddress}...`);
    let swapRouterABI = await fetchABI(swapRouterAddress);
    
    if (!swapRouterABI) {
        console.error("❌ Failed to fetch SwapRouter ABI. Using fallback ABI.");
        swapRouterABI = [
            "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
        ];
    }

    const swapRouter = new ethers.Contract(swapRouterAddress, swapRouterABI, provider);
    const swapRouterWithSigner = swapRouter.connect(userWallet);

    console.log("\n🔍 Checking available functions in SwapRouter...");
    const availableFunctions = swapRouterWithSigner.interface.fragments.map(f => f.name);
    console.log(availableFunctions);

    if (!availableFunctions.includes("exactInputSingle")) {
        console.error("❌ ERROR: `exactInputSingle` function is missing in ABI.");
        return;
    }

    console.log("\n✅ `exactInputSingle` is present in ABI.");

    // 🟢 First attempt: Use the original `sqrtPriceLimitX96` (to maintain fee-free route)
    let adjustedSqrtPriceLimitX96 = sqrtPriceLimitX96;

    
    const params = {
        tokenIn: USDC,
        tokenOut: CBBTC,
        fee: 500,
        recipient: userWallet.address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10,
        amountIn: ethers.parseUnits(amountIn.toString(), 6),
        amountOutMinimum: ethers.parseUnits("0.000001", 8), // ✅ Lower slippage tolerance
        sqrtPriceLimitX96: BigInt(poolData.sqrtPriceX96) * BigInt(90) / BigInt(100) // ✅ Loosen sqrtPriceLimitX96 by 5%
    };

    console.log("\n🔍 Swap Parameters:");
    console.log(params);

    console.log("\n🔍 Encoding function data...");
    const iface = new ethers.Interface(swapRouterABI);
    const functionData = iface.encodeFunctionData("exactInputSingle", [params]);

    console.log("\n✅ Encoded function data:");
    console.log(functionData);

    console.log("\n🔍 Checking USDC Allowance...");
    const allowance = await USDCContract.allowance(userWallet.address, swapRouterAddress);
    console.log(`✅ USDC Allowance: ${ethers.formatUnits(allowance, 6)} USDC`);

    if (allowance < params.amountIn) {
        console.error("❌ ERROR: USDC allowance too low. Approve more USDC first.");
        return;
    }

    console.log("\n⛽ Attempting transaction submission...");
    try {
        const nonce = await provider.getTransactionCount(userWallet.address, "pending"); // Fetch latest pending nonce
        console.log(`📌 Using latest pending nonce: ${nonce}`);
        
        const feeData = await provider.getFeeData();
        const tx = await userWallet.sendTransaction({
            to: swapRouterAddress,
            data: functionData,
            gasLimit: 3000000,
            maxFeePerGas: feeData.maxFeePerGas, // ✅ Correct EIP-1559 transaction format
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? ethers.parseUnits("1", "gwei")
        });

        console.log("\n✅ Transaction Sent:");
        console.log(tx);

        console.log("\n⏳ Waiting for Confirmation...");
        const receipt = await tx.wait();
        
        if (receipt && receipt.hash) {
            console.log("\n✅ Transaction Confirmed! Hash:");
            console.log(receipt.hash);
        } else {
            console.error("❌ ERROR: Transaction hash is undefined.");
        }
        return;
    } catch (err) {
        console.error("\n❌ ERROR: Swap Transaction Failed:");
        console.error(err);

        // 🔴 If error contains "SPL", retry with a slightly adjusted `sqrtPriceLimitX96`
        if (err.reason && err.reason.includes("SPL")) {
            console.log("\n🔁 Retrying swap with slightly adjusted `sqrtPriceLimitX96`...");

            adjustedSqrtPriceLimitX96 = BigInt(sqrtPriceLimitX96) * BigInt(99) / BigInt(100); // Reduce by 1%

            console.log(`🔹 Adjusted sqrtPriceLimitX96: ${adjustedSqrtPriceLimitX96}`);

            params.sqrtPriceLimitX96 = adjustedSqrtPriceLimitX96;

            const functionDataRetry = iface.encodeFunctionData("exactInputSingle", [params]);

            console.log("\n⛽ Retrying transaction submission...");
            try {
                const txRetry = await userWallet.sendTransaction({
                    to: swapRouterAddress,
                    data: functionDataRetry,
                    gasLimit: 3000000
                });

                console.log("\n⏳ Waiting for Confirmation...");
                const receipt = await tx.wait();
                
                if (receipt && receipt.hash) {
                    console.log("\n✅ Transaction Confirmed! Hash:");
                    console.log(receipt.hash);
                } else {
                    console.error("❌ ERROR: Transaction hash is undefined.");
                }
                return;
            } catch (errRetry) {
                console.error("\n❌ ERROR: Retry Swap Transaction Failed:");
                console.error(errRetry);
            }
        }
    }
}

/**
 * ✅ Main Function: Execute Swap for $5 USDC
 */
async function main() {
    console.log("\n🔍 Checking for a Fee-Free Quote...");

    const usdcAmountToTrade = 5; // Adjust as needed
    await executeSwap(usdcAmountToTrade);
}

main().catch(console.error);