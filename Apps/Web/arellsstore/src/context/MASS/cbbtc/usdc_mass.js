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

        return abi;
    } catch (error) {
        console.error("❌ Failed to fetch ABI:", error.message);
        return null;
    }
}

/**
 * ✅ Check Pool Liquidity
 */
async function getPoolAddress() {
    const factoryABI = await fetchABI(FACTORY_ADDRESS);
    if (!factoryABI) return null;

    const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);
    const feeTiers = [500]; // 0.01%, 0.05%, 0.3%, 1%

    for (let fee of feeTiers) {
        try {
            const poolAddress = await factory.getPool(USDC, CBBTC, fee);
            if (poolAddress !== ethers.ZeroAddress) {
                console.log(`✅ Found Pool for fee tier ${fee}: ${poolAddress}`);
                return { poolAddress, fee };
            }
        } catch (error) {
            console.warn(`⚠️ Failed to get pool for fee tier ${fee}: ${error.message}`);
        }
    }

    console.error("❌ No Uniswap V3 Pool found for USDC-CBBTC.");
    return null;
}

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

async function simulateWithQuoter(params) {
  const quoterABI = await fetchABI(QUOTER_ADDRESS);
  if (!quoterABI) return null;

  const iface = new ethers.Interface(quoterABI);

  const functionData = iface.encodeFunctionData("quoteExactInputSingle", [{
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    fee: params.fee,
    amountIn: params.amountIn,
    sqrtPriceLimitX96: params.sqrtPriceLimitX96
  }]);

  try {
    const result = await provider.call({
      to: QUOTER_ADDRESS,
      data: functionData
    });

    const [amountOut] = iface.decodeFunctionResult("quoteExactInputSingle", result);
    console.log(`🔁 Simulated amountOut: ${ethers.formatUnits(amountOut, 8)} CBBTC`);
    return amountOut;
  } catch (err) {
    console.warn("⚠️ QuoterV2 simulation failed:", err.reason || err.message || err);
    return null;
  }
}

/**
 * ✅ Check Fee-Free Route
 */
async function checkFeeFreeRoute(amountIn, cpVact) {
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

    const amountInWei = ethers.parseUnits(amountIn.toString(), 6);

    const tickSpacing = Number(poolData.tickSpacing);
    const tickApprox = Math.floor(Math.log(cpVact) / Math.log(1.0001));
    const alignedTick = Math.floor(tickApprox / tickSpacing) * tickSpacing;

    console.log(`🎯 Approximated Tick from cpVact: ${alignedTick}`);
    try {
    const sqrtPriceLimitX96 = BigInt(TickMath.getSqrtRatioAtTick(alignedTick).toString());
    console.log(`🎯 Computed sqrtPriceLimitX96 from tick: ${sqrtPriceLimitX96.toString()}`);

      const simulation = await simulateWithQuoter({
        tokenIn: USDC,
        tokenOut: CBBTC,
        fee,
        amountIn: amountInWei,
        sqrtPriceLimitX96
      });
  
      if (simulation && simulation > 0n) {
        console.log(`✅ Route at tick ${alignedTick} is valid. Estimated out: ${ethers.formatUnits(simulation, 8)} CBBTC`);
        feeFreeRoutes.push({ poolAddress, fee, sqrtPriceLimitX96, poolData, tick: alignedTick });
      } else {
        // console.log(`❌ Route at tick ${alignedTick} returned zero or failed`);
      }
    } catch (err) {
      console.warn(`⚠️ Skip tick ${alignedTick}: ${err.message}`);
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

async function getBalances(USDCContract, CBBTCContract, userWallet) {
  const usdcBalance = await USDCContract.balanceOf(userWallet.address);
  const cbbtcBalance = await CBBTCContract.balanceOf(userWallet.address);

  return {
    usdc: ethers.formatUnits(usdcBalance, 6),
    cbbtc: ethers.formatUnits(cbbtcBalance, 8)
  };
}

async function approveUSDC(amountIn, USDCContract, userWallet) {
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

async function checkETHBalance(userWallet) {
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


export async function executeSupplication(amountIn, customPrivateKey, cpVact) {
  console.log(`\n🚀 Executing Swap: ${amountIn} USDC → CBBTC`);

  const privateKeyToUse = customPrivateKey;
  const userWallet = new ethers.Wallet(privateKeyToUse, provider);

  const USDCContract = new ethers.Contract(USDC, [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address, uint256)",
    "function allowance(address, address) view returns (uint256)"
  ], userWallet);
  
  const CBBTCContract = new ethers.Contract(CBBTC, [
    "function balanceOf(address) view returns (uint256)"
  ], userWallet);

  const usdcBalanceRaw = await USDCContract.balanceOf(userWallet.address);
  const ethBalanceRaw = await provider.getBalance(userWallet.address);

  console.log(`💰 USDC Balance: ${ethers.formatUnits(usdcBalanceRaw, 6)} USDC`);
  console.log(`💰 ETH Balance: ${ethers.formatEther(ethBalanceRaw)} ETH`);

  const poolInfo = await getPoolAddress();
  if (!poolInfo) return;
  const { poolAddress, fee } = poolInfo;

  const poolData = await checkPoolLiquidity(poolAddress);
  if (!poolData || poolData.liquidity === 0) {
    console.error("❌ No liquidity available.");
    return;
  }

  const feeFreeRoutes = await checkFeeFreeRoute(amountIn);
  if (!feeFreeRoutes || feeFreeRoutes.length === 0) {
    console.error("❌ No Fee-Free Route Available! Swap will NOT proceed.");
    return;
  }
  // console.log("✅ Fee-Free Route Confirmed!");

  await approveUSDC(amountIn, USDCContract, userWallet);
  if (!(await checkETHBalance(userWallet))) return;

  const swapRouterABI = await fetchABI(swapRouterAddress);
  if (!swapRouterABI) {
    console.error("❌ Failed to fetch SwapRouter ABI.");
    return;
  }

  let lastError = null;

  for (const route of feeFreeRoutes) {
    const { fee, poolData } = route;
  
    const tickSpacing = Number(poolData.tickSpacing);
    const tickApprox = Math.log(cpVact) / Math.log(1.0001);
    const alignedTick = Math.floor(tickApprox / tickSpacing) * tickSpacing;

    for (let i = 0; i < 3; i++) {
      const limitX96 = BigInt(TickMath.getSqrtRatioAtTick(alignedTick).toString());
      console.log(`🔁 Trying supplication for fee ${fee} at tick ${alignedTick}`);

      const params = {
        tokenIn: USDC,
        tokenOut: CBBTC,
        fee,
        recipient: userWallet.address,
        deadline: Math.floor(Date.now() / 1000) + 600,
        amountIn: ethers.parseUnits(Number(amountIn).toFixed(6), 6),
        amountOutMinimum: 1,
        sqrtPriceLimitX96: limitX96,
      };

      console.log("🔍 Attempting supplication with params:", params);

      const swapRouterABI = await fetchABI(swapRouterAddress);
      const iface = new ethers.Interface(swapRouterABI);
      const functionData = iface.encodeFunctionData("exactInputSingle", [params]);

      const ethBefore = await provider.getBalance(userWallet.address);
      console.log(`💰 ETH Balance Before: ${ethers.formatEther(ethBefore)} ETH`);

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
        console.log("✅ Supplicstion Transaction Confirmed:");
        console.log(`🔗 Tx Hash: ${receipt.hash}`);
        const ethAfter = await provider.getBalance(userWallet.address);
        console.log(`💰 ETH Balance After: ${ethers.formatEther(ethAfter)} ETH`);
        
        return;
      } catch (err) {
        console.error(`❌ Supplication failed at tick ${alignedTick}:`, err.reason || err.message || err);
        lastError = err;
      }
    }
  }  

  console.error("❌ All fee-free supplication attempts failed.");
  if (lastError) throw lastError;
}


/**
 * ✅ Main Function: Execute Swap for $5 USDC
 */
async function main() {
  console.log("\n🔍 Checking for a Fee-Free Quote...");

  const cpVact = 96343.12 //adjut as needed
  const usdcAmountToTrade = 2; // Adjust as needed
  const customPrivateKey = process.env.PRIVATE_KEY_TEST;

    while (true) {
      try {
        await executeSupplication(usdcAmountToTrade, customPrivateKey, cpVact);
        console.log("🎉 Supplication successful!");
        break; // Exit loop after success
      } catch (error) {
        console.warn("❌ Supplication failed, retrying in 15s...\n", error.message || error);
        await new Promise(res => setTimeout(res, 15000));
      }
    }
}

 //main().catch(console.error);

//to test run: yarn hardhat run **insert-file-route-here** --network base