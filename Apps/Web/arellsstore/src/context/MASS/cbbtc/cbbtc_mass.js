import { ethers } from "ethers"; 
import dotenv from "dotenv";
import axios from "axios";
import { TickMath } from "@uniswap/v3-sdk";
import { solidityPack } from "ethers";



dotenv.config();

// ✅ Uniswap Contract Addresses
const QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
const FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";

// ✅ Token Addresses
const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

// ✅ Set Up Ethereum Provider & Wallet
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);



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



















let cachedQuoterABI = null;

async function simulateWithQuoter({ tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96 }) {
  if (!cachedQuoterABI) {
    cachedQuoterABI = await fetchABI(QUOTER_ADDRESS);
    if (!cachedQuoterABI) {
      console.warn("❌ Failed to fetch Quoter ABI.");
      return null;
    }
  }

  const iface = new ethers.Interface(cachedQuoterABI);

  const inputData = iface.encodeFunctionData("quoteExactInputSingle", [{
    tokenIn,
    tokenOut,
    fee,
    amountIn: BigInt(amountIn.toString()),                // ✅ Safe BigInt conversion
    sqrtPriceLimitX96: BigInt(sqrtPriceLimitX96.toString()) // ✅ Safe BigInt conversion
  }]);

  try {
    const result = await provider.call({ to: QUOTER_ADDRESS, data: inputData });
    const [amountOut] = iface.decodeFunctionResult("quoteExactInputSingle", result);

    const amountOutFloat = Number(amountOut) / 1e6;
    const amountInFloat = Number(amountIn) / 1e8;
    const impliedPrice = amountOutFloat / amountInFloat;

    return { amountOut, amountOutFloat, amountInFloat, impliedPrice };
  } catch (error) {
    console.warn(`⚠️ QuoterV2 simulation failed at sqrtPriceLimitX96 = ${sqrtPriceLimitX96.toString()}: ${error.reason || error.message}`);
    return null;
  }
}


async function checkFeeFreeRoute(cVactDat, amountInCBBTC) {
  const MIN_SQRT_RATIO = 4295128739n;
  const MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342n;

  console.log("\n✅ STEP 2: Try tick-only routing with fixed input (quoteExactInputSingle)");

  const factoryABI = await fetchABI(FACTORY_ADDRESS);
  if (!factoryABI) return [];

  const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);
  const fee = 500;
  const poolAddress = await factory.getPool(CBBTC, USDC, fee);
  if (poolAddress === ethers.ZeroAddress) return [];

  const poolABI = await fetchABI(poolAddress);
  if (!poolABI) return [];
  const pool = new ethers.Contract(poolAddress, poolABI, provider);

  const scaledAmountIn = BigInt((amountInCBBTC * 1e8).toFixed(0));
  const targetUSDC = Number(cVactDat);

  const slot0 = await pool.slot0();
  const currentTick = Number(slot0[1]);
  const currentSqrtPriceX96 = BigInt(slot0[0].toString()); // current sqrtPriceX96

  const tickSpacing = Number(await pool.tickSpacing());
  
  // Focus narrowly just *below* current tick
  const MIN_TICK = currentTick - tickSpacing * 10;
  const MAX_TICK = currentTick - tickSpacing * 1;

  for (let tick = MIN_TICK; tick <= MAX_TICK; tick += tickSpacing) {
    try {
      const sqrtRaw = TickMath.getSqrtRatioAtTick(tick);
      const sqrtPriceLimitX96 = BigInt(sqrtRaw.toString());

      if (
        sqrtPriceLimitX96 > currentSqrtPriceX96 ||
        sqrtPriceLimitX96 < MIN_SQRT_RATIO ||
        sqrtPriceLimitX96 > MAX_SQRT_RATIO
      ) {
        continue; // ✅ Skip if it's above current pool price or out of range
      }

      const quote = await simulateWithQuoter({
        tokenIn: CBBTC,
        tokenOut: USDC,
        fee,
        amountIn: scaledAmountIn,
        sqrtPriceLimitX96,
      });

      if (!quote) continue;

      const { amountOut, amountOutFloat, amountInFloat, impliedPrice } = quote;

      const sqrtPrice = Number(sqrtPriceLimitX96) / 2 ** 96;
      const priceUSD = (sqrtPrice ** 2) * 1e2;

      console.log(`\n🔎 Tick ${tick}`);
      console.log(`   - Simulated amountOut: ${amountOutFloat.toFixed(6)} USDC`);
      console.log(`   - Input: ${amountInFloat.toFixed(8)} CBBTC`);
      console.log(`   - Implied price: $${impliedPrice.toFixed(2)} per CBBTC`);
      console.log(`   - Decoded sqrtPrice: $${priceUSD.toFixed(2)} per CBBTC`);
      console.log(`   - Target: ≤ ${targetUSDC.toFixed(6)} USDC`);

      if (amountOutFloat <= targetUSDC) {
        console.log(`✅ MATCH: ${amountOutFloat.toFixed(6)} USDC ≤ ${targetUSDC}`);
        return [{
          poolAddress,
          fee,
          sqrtPriceLimitX96,
          tick,
          amountIn: scaledAmountIn,
          amountOut
        }];
      }
    } catch (err) {
      console.warn(`⚠️ Error at tick ${tick}: ${err.message}`);
    }
  }

  console.error("❌ No valid tick-based route found.");
  return [];
}






















async function checkCBBTCBalance(userWallet) {
  const proxyCBBTCContract = new ethers.Contract(CBBTC, [
    "function balanceOf(address) view returns (uint256)"
  ], provider);
  const balance = await proxyCBBTCContract.balanceOf(userWallet.address);
  console.log(`💰 CBBTC Balance: ${ethers.formatUnits(balance, 8)} CBBTC`);
  return balance;
}

async function getBalances(userWallet, USDCContract) {
  const usdcBalance = await USDCContract.balanceOf(userWallet.address);
  const cbbtcBalance = await checkCBBTCBalance(userWallet);
  return {
    usdc: ethers.formatUnits(usdcBalance, 6),
    cbbtc: ethers.formatUnits(cbbtcBalance, 8)
  };
}

async function approveCBBTC(userWallet, amountIn) {
  console.log(`🔑 Approving Swap Router to spend ${ethers.formatUnits(amountIn, 8)} CBBTC...`);
  
  const balance = await checkCBBTCBalance(userWallet);

  if (balance < amountIn) {
    console.error(`❌ ERROR: Insufficient CBBTC balance!`);
    return;
  }

  const proxyCBBTCContract = new ethers.Contract(CBBTC, [
    "function approve(address, uint256)",
    "function allowance(address, address) view returns (uint256)"
  ], userWallet);

  const currentAllowance = await proxyCBBTCContract.allowance(userWallet.address, swapRouterAddress);
  console.log(`📎 BEFORE Approval: ${ethers.formatUnits(currentAllowance, 8)} CBBTC`);

  if (currentAllowance < amountIn) {
    const tx = await proxyCBBTCContract.approve(swapRouterAddress, amountIn);
    const receipt = await tx.wait();
    console.log("✅ Approval Successful!");
    console.log("📎 Approval Logs:", receipt.logs);
  } else {
    console.log("✅ Approval already sufficient.");
  }

  const postAllowance = await proxyCBBTCContract.allowance(userWallet.address, swapRouterAddress);
  console.log(`📎 AFTER Approval: ${ethers.formatUnits(postAllowance, 8)} CBBTC`);
}

async function checkETHBalance(userWallet) {
  const ethBalance = await provider.getBalance(userWallet.address);
  const feeData = await provider.getFeeData();
  const requiredGasETH = feeData.gasPrice * 70000n;
  if (ethBalance < requiredGasETH) {
    console.error(`❌ Not enough ETH for gas fees! Required: ${ethers.formatEther(requiredGasETH)} ETH`);
    return false;
  }
  return true;
}


// async function findTickByCpVact(cpVact, poolData) {
//   const tickSpacing = Number(poolData.tickSpacing);

//   const usdcDecimals = 6;
//   const cbbtcDecimals = 8;

//   const rawPrice = 1 / (cpVact / Math.pow(10, cbbtcDecimals - usdcDecimals));
//   const tickApprox = Math.log(Math.sqrt(rawPrice)) / Math.log(1.0001);
//   const alignedTick = Math.round(tickApprox / tickSpacing) * tickSpacing;

//   console.log(`🎯 Scanning ticks around aligned Tick ${alignedTick} for cpVact ${cpVact}...`);

//   function getPriceFromTick(tick) {
//     const sqrtRatio = Number(TickMath.getSqrtRatioAtTick(tick).toString()) / (2 ** 96);
//     const price = sqrtRatio * sqrtRatio;
//     const adjustedPrice = price * (10 ** (usdcDecimals - cbbtcDecimals)); // ✅ corrected scaling
//     return adjustedPrice; // ✅ no 1/adjustedPrice
//   }

//   const searchRange = 100;

//   for (let delta = 0; delta <= searchRange; delta++) {
//     for (let direction of [-1, 1]) {
//       const testTick = alignedTick + (delta * direction * tickSpacing);
//       const priceAtTick = getPriceFromTick(testTick);

//       console.log(`🔎 Tested Tick: ${testTick}, Price at Tick: ${priceAtTick}, Target cpVact: ${cpVact}`);

//       if (Math.abs(priceAtTick - cpVact) < 0.01) {
//         console.log(`✅ Found matching tick ${testTick} with price ${priceAtTick}`);
//         const sqrtPriceLimitX96 = BigInt(TickMath.getSqrtRatioAtTick(testTick).toString());
//         return sqrtPriceLimitX96;
//       }
//     }
//   }

//   console.error(`❌ No matching tick found for cpVact ${cpVact}`);
//   return null;
// }

async function getLivePrice(poolData) {
  const sqrtPriceX96 = poolData.sqrtPriceX96;
  const numerator = BigInt(sqrtPriceX96) * BigInt(sqrtPriceX96);
  const denominator = BigInt(2) ** BigInt(192);
  const rawPrice = Number(numerator) / Number(denominator);

  const usdcDecimals = 6;
  const cbbtcDecimals = 8;
  const adjustedPrice = (1 / rawPrice) * (10 ** (cbbtcDecimals - usdcDecimals));

  console.log(`📈 Live Pool Price (Adjusted): $${adjustedPrice.toFixed(2)} per CBBTC`);
  return adjustedPrice;
}


function encodeSqrtPriceX96FromCpVact(cpVact, usdcDecimals, cbbtcDecimals) {
  const price = 1 / cpVact;
  const scaledPrice = price * 10 ** (cbbtcDecimals - usdcDecimals);
  const sqrtPrice = Math.sqrt(scaledPrice);
  const sqrtPriceX96 = BigInt(Math.floor(sqrtPrice * 2 ** 96));

  const MIN_SQRT_RATIO = 4295128739n;
  const MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342n;

  if (sqrtPriceX96 < MIN_SQRT_RATIO) return MIN_SQRT_RATIO;
  if (sqrtPriceX96 > MAX_SQRT_RATIO) return MAX_SQRT_RATIO;
  return sqrtPriceX96;
}




async function isCpVactInFeeFreeTickRange(cpVact) {
  const poolInfo = await getPoolAddress();
  if (!poolInfo) return null;

  const { poolAddress, fee } = poolInfo;
  const poolData = await checkPoolLiquidity(poolAddress);
  if (!poolData) return null;

  const { tick: currentTick, tickSpacing } = poolData;

  const searchLimit = 100;

  console.log(`🧾 cpVact: ${cpVact}`);
  console.log(`🎯 Starting Tick: ${currentTick}`);

  function getAdjustedPrice(sqrtPriceX96) {
    const sqrtFloat = Number(sqrtPriceX96) / Number(2n ** 96n);
    const rawPrice = sqrtFloat ** 2;
    return (1 / rawPrice) * 1e2;
  }

  for (let i = 0; i <= searchLimit; i++) {
    for (let direction of [-1, 1]) {
      const testTick = Number(currentTick) + i * direction * Number(tickSpacing);

      try {
        const sqrtPriceX96 = BigInt(TickMath.getSqrtRatioAtTick(testTick).toString());
        const adjustedPrice = getAdjustedPrice(sqrtPriceX96);

        console.log(`🔎 Tick ${testTick} — price $${adjustedPrice.toFixed(2)}`);

        if (adjustedPrice >= cpVact) {
          console.log(`✅ Found fee-free tick for CBBTC Price: $${adjustedPrice.toFixed(2)} for cpVact: ${cpVact}`);
          return;
        }
      } catch (err) {
        console.warn(`⚠️ Error at tick ${testTick}: ${err.message}`);
      }
    }
  }

  console.error("❌ No tick found with price ≥ cpVact.");
}











































export async function executeSupplication(cVactDat, cpVact, customPrivateKey) {
  const userWallet = new ethers.Wallet(customPrivateKey, provider);
  console.log(`✅ Using Test Wallet: ${userWallet.address}`);

  const feeFreeRoutes = await checkFeeFreeRoute(cVactDat, cpVact);
  if (!feeFreeRoutes.length) {
    console.error("❌ No fee-free route available. Aborting.");
    return;
  }

  const { sqrtPriceLimitX96, amountIn, amountOut, fee } = feeFreeRoutes[0];

  console.log(`\n🚀 Executing Swap: ${ethers.formatUnits(amountIn, 8)} CBBTC → USDC`);

  const cbbtcBefore = await checkCBBTCBalance(userWallet);
  const usdcContract = new ethers.Contract(USDC, ["function balanceOf(address) view returns (uint256)"], provider);
  const usdcBefore = await usdcContract.balanceOf(userWallet.address);

  console.log(`💰 BEFORE → CBBTC: ${ethers.formatUnits(cbbtcBefore, 8)} | USDC: ${ethers.formatUnits(usdcBefore, 6)}`);

  if (cbbtcBefore < amountIn) {
    console.error(`❌ ERROR: Insufficient CBBTC balance!`);
    return;
  }

  await approveCBBTC(userWallet, amountIn);
  if (!(await checkETHBalance(userWallet))) return;

  const params = {
    tokenIn: CBBTC,
    tokenOut: USDC,
    fee,
    recipient: userWallet.address,
    deadline: Math.floor(Date.now() / 1000) + 600,
    amountOut,                 
    amountInMaximum: amountIn, 
    sqrtPriceLimitX96,
  };

  const swapRouterABI = await fetchABI(swapRouterAddress);
  const iface = new ethers.Interface(swapRouterABI);
  const functionData = iface.encodeFunctionData("exactOutputSingle", [params]);

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
  console.log("✅ Supplication Transaction Confirmed!");
  console.log(`🔗 Tx Hash: ${receipt.hash}`);

  const cbbtcAfter = await checkCBBTCBalance(userWallet);
  const usdcAfter = await usdcContract.balanceOf(userWallet.address);

  console.log(`💰 AFTER → CBBTC: ${ethers.formatUnits(cbbtcAfter, 8)} | USDC: ${ethers.formatUnits(usdcAfter, 6)}`);
}










const swapRouterAddress = "0x2626664c2603336E57B271c5C0b26F421741e481";

async function main() {


  const amountInCBBTC = 0.00002;
  const cVactDat = 2.08;
  const customPrivateKey = process.env.PRIVATE_KEY_TEST;

  console.log("\n🔍 Checking for a Fee-Free Quote...");
  const feeFreeRoutes = await checkFeeFreeRoute(cVactDat, amountInCBBTC);
  if (feeFreeRoutes.length === 0) {
    console.error("❌ No route found");
    return;
  }

//  console.log("Running executeSupplication...");
//  await executeSupplication(cVactDat, cpVact, customPrivateKey);

}



main().catch(console.error);

//to test run: yarn hardhat run src/context/MASS/cbbtc/cbbtc_mass.js --network base
