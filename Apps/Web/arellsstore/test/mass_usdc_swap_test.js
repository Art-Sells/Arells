import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";

import { TickMath } from "@uniswap/v3-sdk";

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
// ✅ Replace getPoolAddress() call inside checkFeeFreeRoute with explicit loop through all tiers

// REPLACE checkFeeFreeRoute() WITH:
async function checkFeeFreeRoute(amountIn) {
  console.log(`\n🚀 Checking Fee-Free Routes for ${amountIn} USDC → CBBTC`);

  const factoryABI = await fetchABI(FACTORY_ADDRESS);
  if (!factoryABI) return [];

  const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);
  const feeFreeRoutes = [];

  const fee = 500; // Only check 0.05% fee tier
  try {
    const poolAddress = await factory.getPool(USDC, CBBTC, fee);
    if (poolAddress === ethers.ZeroAddress) return [];

    const poolData = await checkPoolLiquidity(poolAddress);
    if (!poolData || poolData.liquidity === 0) return [];

    const tickSpacing = Number(poolData.tickSpacing);
    const baseTick = Math.floor(Number(poolData.tick) / tickSpacing) * tickSpacing;

    for (let i = 0; i < 3; i++) {
      const testTick = baseTick + i * tickSpacing;
      try {
        const sqrtPriceLimitX96 = BigInt(TickMath.getSqrtRatioAtTick(testTick).toString());
        feeFreeRoutes.push({ poolAddress, fee, sqrtPriceLimitX96, poolData });
      } catch (err) {
        console.warn(`⚠️ Skip tick ${testTick}: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`⚠️ Fee tier 500 skipped: ${err.message}`);
  }

  return feeFreeRoutes;
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

// ✅ Modified executeSwap to try multiple fee-free routes one at a time
async function executeSwap(amountIn) {
  console.log(`\n🚀 Executing Swap: ${amountIn} USDC → CBBTC`);

  const feeFreeRoutes = await checkFeeFreeRoute(amountIn);
  if (!feeFreeRoutes || feeFreeRoutes.length === 0) {
    console.error("❌ No Fee-Free Route Available! Swap will NOT proceed.");
    return;
  }

  await approveUSDC(amountIn);
  if (!(await checkETHBalance())) return;

  const swapRouterABI = await fetchABI(swapRouterAddress);
  if (!swapRouterABI) {
    console.error("❌ Failed to fetch SwapRouter ABI.");
    return;
  }

  const swapRouter = new ethers.Contract(swapRouterAddress, swapRouterABI, provider).connect(userWallet);
  const iface = new ethers.Interface(swapRouterABI);
  let lastError = null;

  for (const route of feeFreeRoutes) {
    const { fee, poolAddress, sqrtPriceLimitX96, poolData } = route;

    const tickSpacing = Number(poolData.tickSpacing);
    const baseTick = Math.floor(Number(poolData.tick) / tickSpacing) * tickSpacing;

    for (let i = 0; i < 3; i++) {
      const testTick = baseTick + i * tickSpacing;
      let limitX96;

      try {
        limitX96 = BigInt(TickMath.getSqrtRatioAtTick(testTick).toString());
      } catch (err) {
        console.warn(`⚠️ Failed sqrtPriceLimitX96 for tick ${testTick}: ${err.message}`);
        lastError = err;
        continue;
      }

      // ✅ Add tiny buffer to avoid revert due to 1 wei slippage
      const buffer = BigInt(1_000_000);
      limitX96 += buffer;

      // ✅ Ensure price limit is above current
      if (limitX96 <= poolData.sqrtPriceX96) {
        console.log(`⛔ Skipping tick ${testTick} — limit below current price`);
        continue;
      }

      const params = {
        tokenIn: USDC,
        tokenOut: CBBTC,
        fee,
        recipient: userWallet.address,
        deadline: Math.floor(Date.now() / 1000) + 600,
        amountIn: ethers.parseUnits(amountIn.toString(), 6),
        amountOutMinimum: 1,
        sqrtPriceLimitX96: limitX96
      };

      console.log(`🔁 Trying swap for fee ${fee} @ tick ${testTick} (limitX96 = ${limitX96})`);

      const functionData = iface.encodeFunctionData("exactInputSingle", [params]);

      try {
        const feeData = await provider.getFeeData();
        const tx = await userWallet.sendTransaction({
          to: swapRouterAddress,
          data: functionData,
          gasLimit: 300000,
          maxFeePerGas: feeData.maxFeePerGas,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? ethers.parseUnits("1", "gwei"),
        });

        console.log("⏳ Waiting for confirmation...");
        const receipt = await tx.wait();
        console.log("✅ Swap Transaction Confirmed!");
        console.log(`🔗 Tx Hash: ${receipt.hash}`);
        return;
      } catch (err) {
        console.warn(`❌ Swap failed at tick ${testTick}: ${err.reason || err.message || err}`);
        lastError = err;
      }
    }
  }

  console.error("❌ All fee-free swap attempts failed.");
  if (lastError) throw lastError;
}

/**
 * ✅ Main Function: Execute Swap for $5 USDC
 */
async function main() {
    console.log("\n🔍 Checking for a Fee-Free Quote...");

    const usdcAmountToTrade = 3; // Adjust as needed
    await executeSwap(usdcAmountToTrade);
}

main().catch(console.error);