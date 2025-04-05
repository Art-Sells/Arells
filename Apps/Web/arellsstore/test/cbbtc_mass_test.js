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
console.log(`✅ Using Test Wallet: ${userWallet.address}`);

const USDCContract = new ethers.Contract(USDC, [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address, uint256)",
  "function allowance(address, address) view returns (uint256)"
], userWallet);


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
    console.log(`🔁 Simulated amountOut: ${ethers.formatUnits(amountOut, 6)} USDC`);
    return amountOut;
  } catch (err) {
    console.warn("⚠️ QuoterV2 simulation failed:", err.reason || err.message || err);
    return null;
  }
}


async function checkFeeFreeRoute(amountIn) {
  console.log(`\n🚀 Checking Fee-Free Routes for ${amountIn} CBBTC → USDC`);

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
        const amountInWei = ethers.parseUnits(amountIn.toString(), 8);

        const simulation = await simulateWithQuoter({
          tokenIn: CBBTC,
          tokenOut: USDC,
          fee,
          amountIn: amountInWei,
          sqrtPriceLimitX96
        });
    
        if (simulation && simulation > 0n) {
          console.log(`✅ Route at tick ${testTick} is valid. Estimated out: ${ethers.formatUnits(simulation, 6)} USDC`);
          feeFreeRoutes.push({ poolAddress, fee, sqrtPriceLimitX96, poolData, tick: testTick });
        } else {
          // console.log(`❌ Route at tick ${testTick} returned zero or failed`);
        }
      } catch (err) {
        console.warn(`⚠️ Skip tick ${testTick}: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`⚠️ Fee tier 500 skipped: ${err.message}`);
  }

  return feeFreeRoutes;
}


async function checkCBBTCBalance() {
  const proxyCBBTCContract = new ethers.Contract(CBBTC, [
    "function balanceOf(address) view returns (uint256)"
  ], provider);
  const balance = await proxyCBBTCContract.balanceOf(userWallet.address);
  console.log(`💰 CBBTC Balance: ${ethers.formatUnits(balance, 8)} CBBTC`);
  return balance;
}

async function getBalances() {
  const usdcBalance = await USDCContract.balanceOf(userWallet.address);
  const cbbtcBalance = await checkCBBTCBalance();
  return {
    usdc: ethers.formatUnits(usdcBalance, 6),
    cbbtc: ethers.formatUnits(cbbtcBalance, 8)
  };
}

async function approveCBBTC(amountIn) {
  console.log(`🔑 Approving Swap Router to spend ${amountIn} CBBTC...`);
  const balance = await checkCBBTCBalance();
  const amountBaseUnits = ethers.parseUnits(amountIn.toString(), 8);

  if (balance < amountBaseUnits) {
    console.error(`❌ ERROR: Insufficient CBBTC balance!`);
    return;
  }

  const proxyCBBTCContract = new ethers.Contract(CBBTC, [
    "function approve(address, uint256)",
    "function allowance(address, address) view returns (uint256)"
  ], userWallet);

  const currentAllowance = await proxyCBBTCContract.allowance(userWallet.address, swapRouterAddress);
  console.log(`📎 BEFORE Approval: ${ethers.formatUnits(currentAllowance, 8)} CBBTC`);

  if (currentAllowance < amountBaseUnits) {
    const tx = await proxyCBBTCContract.approve(swapRouterAddress, amountBaseUnits);
    const receipt = await tx.wait();
    console.log("✅ Approval Successful!");
    console.log("📎 Approval Logs:", receipt.logs);
  } else {
    console.log("✅ Approval already sufficient.");
  }

  const postAllowance = await proxyCBBTCContract.allowance(userWallet.address, swapRouterAddress);
  console.log(`📎 AFTER Approval: ${ethers.formatUnits(postAllowance, 8)} CBBTC`);
}

async function checkETHBalance() {
  const ethBalance = await provider.getBalance(userWallet.address);
  const feeData = await provider.getFeeData();
  const requiredGasETH = feeData.gasPrice * 70000n;
  if (ethBalance < requiredGasETH) {
    console.error(`❌ Not enough ETH for gas fees! Required: ${ethers.formatEther(requiredGasETH)} ETH`);
    return false;
  }
  return true;
}

async function executeSupplication(amountIn) {
  console.log(`\n🚀 Executing Swap: ${amountIn} CBBTC → USDC`);

  const balance = await checkCBBTCBalance();
  if (balance < ethers.parseUnits(amountIn.toString(), 8)) {
    console.error(`❌ ERROR: Insufficient CBBTC balance!`);
    return;
  }

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
    console.error("❌ No fee-free route available. Aborting.");
    return;
  }

  console.log("✅ Fee-Free Route Confirmed!");

  await approveCBBTC(amountIn);             
  if (!(await checkETHBalance())) return;     
  
  const TICKS_TO_TRY = 4;
  const tickSpacing = Number(poolData.tickSpacing);
  const baseTick = Math.floor(Number(poolData.tick) / tickSpacing) * tickSpacing;
  let lastError = null;

  const before = await checkCBBTCBalance();

  for (const route of feeFreeRoutes) {
    const { poolAddress, fee, sqrtPriceLimitX96, poolData } = route;
  
    const tickSpacing = Number(poolData.tickSpacing);
    const baseTick = Math.floor(Number(poolData.tick) / tickSpacing) * tickSpacing;
  
    for (let i = 0; i < 3; i++) {
      const testTick = baseTick + (i * tickSpacing);
      console.log(`🔁 Trying supplication for fee ${fee} at tick ${testTick}`);
  
      let limitX96;
      try {
        limitX96 = BigInt(TickMath.getSqrtRatioAtTick(testTick).toString());
      } catch (err) {
        console.warn(`⚠️ Failed sqrtPriceLimitX96 for tick ${testTick}: ${err.message}`);
        lastError = err;
        continue;
      }
  
      const params = {
        tokenIn: CBBTC,
        tokenOut: USDC,
        fee,
        recipient: userWallet.address,
        deadline: Math.floor(Date.now() / 1000) + 600,
        amountIn: ethers.parseUnits(amountIn.toString(), 8),
        amountOutMinimum: ethers.parseUnits("0.01", 6),
        sqrtPriceLimitX96: limitX96,
      };
  
      console.log("🔍 Attempting supplication with params:", params);
  
      const swapRouterABI = await fetchABI(swapRouterAddress);
      const iface = new ethers.Interface(swapRouterABI);
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
        console.log("✅ Swap Transaction Confirmed:");
        console.log(`🔗 Tx Hash: ${receipt.hash}`);
        const after = await checkCBBTCBalance();
        const used = before - after;
        console.log(`⚠️ Actually used: ${ethers.formatUnits(used, 8)} CBBTC`);
        return;
      } catch (err) {
        console.error(`❌ Swap failed at tick ${testTick}:`, err.reason || err.message || err);
        lastError = err;
      }
    }
  }

console.error("❌ All fee-free tick attempts failed.");
throw lastError;

  
}








const swapRouterAddress = "0x2626664c2603336E57B271c5C0b26F421741e481";

async function main() {
  console.log("\n🔍 Checking for a Fee-Free Quote...");
  // ✅ CBBTC amounts (8 decimals)
  const cbbtcAmounts = [
    0.002323, 
    0.0120323, 
    1.3233, 
    0.50012345, 
    2.12345678];

  let foundFeeFree = false; // Track if any fee-free route was found

  // ✅ Check for CBBTC → USDC
  for (const amount of cbbtcAmounts) {
      const feeFree = await checkFeeFreeRoute(amount, "CBBTC", "USDC", 8);

      if (feeFree) {
          console.log(`\n✅ **Fee-Free Quote Found at ${amount} CBBTC!** 🚀`);
          foundFeeFree = true;
      }
  }
  if (!foundFeeFree) {
    console.log("\n❌ **No Fee-Free Quote Available for Any Checked Amounts.** Try Again Later.");
  } else {
      console.log("\n🎉 **Fee-Free Routes Checked for All Amounts!** 🚀");
  }

  // const cbbtcAmountToTrade = 0.00003626;
  // await executeSupplication(cbbtcAmountToTrade);
}



main().catch(console.error);
