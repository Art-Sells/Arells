import { ethers } from "ethers"; 
import dotenv from "dotenv";
import axios from "axios";
import { TickMath } from "@uniswap/v3-sdk";

dotenv.config();

const __abiCache = new Map(); // address(lowercased) -> abi array

const POOLS = {
  500: "0xfBB6Eed8e7aa03B138556eeDaF5D271A5E1e43ef",
  3000: "0xeC558e484cC9f2210714E345298fdc53B253c27D",
};

// Contract Addresses
const QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
const FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";
const swapRouterAddress = "0x2626664c2603336E57B271c5C0b26F421741e481";


// Token Addresses
const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

// Set Up Ethereum Provider & Wallet
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
console.log(`✅ Using Test Wallet: ${userWallet.address}`);

const USDCContract = new ethers.Contract(USDC, [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address, uint256)",
  "function allowance(address, address) view returns (uint256)"
], userWallet);


async function fetchABI(contractAddress) {
  const key = contractAddress.toLowerCase();
  if (__abiCache.has(key)) return __abiCache.get(key);

  const knownPools = Object.values(POOLS).map(a => a.toLowerCase());
  if (knownPools.includes(key) && __abiCache.has("uniswapPoolABI")) {
    return __abiCache.get("uniswapPoolABI");
  }

  const attempt = async () => {
    console.log(`🔍 Fetching ABI for ${contractAddress} from BaseScan...`);
    const { data } = await axios.get(
      `https://api.basescan.org/api?module=contract&action=getabi&address=${contractAddress}&apikey=${process.env.BASESCAN_API_KEY}`
    );
    if (data.status !== "1") throw new Error(`BaseScan API Error: ${data.message}`);
    const abi = JSON.parse(data.result);

    if (abi.some(i => i.name === "slot0" && Array.isArray(i.inputs) && i.inputs.length === 0)) {
      __abiCache.set("uniswapPoolABI", abi);
    }
    __abiCache.set(key, abi);
    return abi;
  };

  try {
    return await attempt();
  } catch (e1) {
    // brief backoff; avoids NOTOK bursts without adding manual ABIs
    await new Promise(r => setTimeout(r, 200));
    try {
      return await attempt();
    } catch (e2) {
      console.error("❌ Failed to fetch ABI:", e2.message);
      if (__abiCache.has("uniswapPoolABI") && knownPools.includes(key)) {
        console.log("♻️ Reusing cached Uniswap pool ABI");
        return __abiCache.get("uniswapPoolABI");
      }
      return null;
    }
  }
}

async function checkPoolLiquidity(poolAddress) {
  const poolABI = await fetchABI(poolAddress);
  if (!poolABI) return null;

  const pool = new ethers.Contract(poolAddress, poolABI, provider);

  try {
    const slot0       = await pool.slot0();
    const tickSpacing = await pool.tickSpacing();

    // ✅ Fetch **CBBTC balance** held in this pool contract
    const cbbtcContract = new ethers.Contract(CBBTC, [
      "function balanceOf(address) view returns (uint256)"
    ], provider);

    const cbbtcBalance = await cbbtcContract.balanceOf(poolAddress);

    console.log("\n🔍 Pool Liquidity Data:");
    console.log(`   - sqrtPriceX96: ${slot0[0]}`);
    console.log(`   - Current Tick: ${slot0[1]}`);
    console.log(`   - CBBTC Liquidity (actual token balance): ${ethers.formatUnits(cbbtcBalance, 8)} CBBTC`);
    console.log(`   - Tick Spacing: ${tickSpacing}`);

    return {
      cbbtcLiquidity: cbbtcBalance,  // raw BigInt
      sqrtPriceX96: slot0[0],
      tick: slot0[1],
      tickSpacing
    };
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
    return amountOut;
  } catch (err) {
    // console.warn("⚠️ QuoterV2 simulation failed:", err.reason || err.message || err);
    return null;
  }
}

function decodeSqrtPrice(sqrtPriceX96) {
  // Convert to bigint if not already
  const sqrt = BigInt(sqrtPriceX96);

  // (sqrtPriceX96^2) / 2^192
  const numerator   = sqrt * sqrt;
  const denominator = 1n << 192n;
  const rawPrice    = Number(numerator) / Number(denominator);

  // Token decimals
  const usdcDecimals  = 6;
  const cbbtcDecimals = 8;

  // Flip to USDC per CBBTC and adjust decimals
  const adjustedPrice = (1 / rawPrice) * (10 ** (cbbtcDecimals - usdcDecimals));

  return adjustedPrice;
}

async function checkFeeFreeRoute(amountInCBBTC, cVactDat) {
  console.log(`\n🚀 Checking Fee-Free Routes for ${amountInCBBTC} CBBTC → USDC (sweep amountOut ≥ ${cVactDat})`);

  const factoryABI = await fetchABI(FACTORY_ADDRESS);
  if (!factoryABI) return [];

  const factory  = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);
  const feeTiers = [500, 3000];
  const routes   = [];
  const results  = [];

  const amountInWei = ethers.parseUnits(amountInCBBTC.toString(), 8);
  const stepUSDC    = 0.10;   // sweep increment in USDC
  const attempts    = 50;     // max sweep steps

  for (let fee of feeTiers) {
    console.log(`\n--- 🌊 Checking Pool Fee Tier: ${fee} ---`);
    try {
      const poolAddress = await factory.getPool(USDC, CBBTC, fee);
      if (poolAddress === ethers.ZeroAddress) {
        console.log(`❌ No pool for fee tier ${fee}`);
        results.push({ target: cVactDat, pool: fee, usdc: "❌ Pool not deployed" });
        continue;
      }

      const poolData = await checkPoolLiquidity(poolAddress);
      if (!poolData || poolData.liquidity === 0n) {
        console.log(`❌ Skipping fee ${fee}: no liquidity`);
        results.push({ target: cVactDat, pool: fee, usdc: "❌ No liquidity" });
        continue;
      }

      // 🔹 still decode sqrtPrice like before
      try {
        const decodedPrice = decodeSqrtPrice(poolData.sqrtPriceX96);
        console.log(`💵 Decoded price (fee ${fee}): ${decodedPrice.toLocaleString()} USDC/CBBTC`);
      } catch (e) {
        console.warn(`⚠️ Failed to decode sqrtPrice: ${e.message}`);
      }

      const tickSpacing = Number(poolData.tickSpacing);
      const baseTick    = Math.floor(Number(poolData.tick) / tickSpacing) * tickSpacing;

      let bestForFee = null;

      for (let i = 0; i < 3; i++) {
        const testTick = baseTick + i * tickSpacing;
        let sqrtPriceLimitX96;
        try {
          sqrtPriceLimitX96 = BigInt(TickMath.getSqrtRatioAtTick(testTick).toString());
        } catch {
          continue;
        }

        // 🔄 Sweep amountOut starting at cVactDat upward
        for (let j = 0; j < attempts; j++) {
          const targetOutUSDC = cVactDat + stepUSDC * j;
          const outWei        = ethers.parseUnits(targetOutUSDC.toFixed(6), 6);

          // quoteExactOutputSingle: how much CBBTC required for this USDC
          const requiredIn = await simulateWithQuoter({
            tokenIn:  CBBTC,
            tokenOut: USDC,
            fee,
            amountOut: outWei,
            sqrtPriceLimitX96
          });
          if (!requiredIn) continue;

          if (requiredIn <= amountInWei) {
            // valid match: amountOut ≥ cVactDat and within our budget
            bestForFee = {
              poolAddress,
              fee,
              tick: testTick,
              sqrtPriceLimitX96,
              amountOut: outWei,
              amountIn: requiredIn
            };
          } else {
            // once required input exceeds budget, break
            break;
          }
        }
      }

      if (bestForFee) {
        console.log(`✅ Fee ${fee} best: ${ethers.formatUnits(bestForFee.amountOut, 6)} USDC for ${ethers.formatUnits(bestForFee.amountIn, 8)} CBBTC`);
        results.push({ target: cVactDat, pool: fee, usdc: ethers.formatUnits(bestForFee.amountOut, 6) });
        routes.push(bestForFee);
      } else {
        console.warn(`⚠️ No valid match ≥ ${cVactDat} USDC within ${amountInCBBTC} CBBTC`);
        results.push({ target: cVactDat, pool: fee, usdc: "❌ No match" });
      }

    } catch (err) {
      console.warn(`⚠️ Fee tier ${fee} skipped: ${err.message}`);
      results.push({ target: cVactDat, pool: fee, usdc: "⚠️ Factory error" });
    }
  }

  console.table(results);
  routes.sort((a, b) => (a.amountOut > b.amountOut ? -1 : 1));
  return routes;
}



























async function checkCBBTCBalance() {
  const proxyCBBTCContract = new ethers.Contract(CBBTC, [
    "function balanceOf(address) view returns (uint256)"
  ], provider);
  const balance = await proxyCBBTCContract.balanceOf(userWallet.address);
  console.log(`💰 CBBTC Balance: ${ethers.formatUnits(balance, 8)} CBBTC`);
  return balance;
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


// LPP (Liquidity Pool Polination) v1 logic below
async function LPPv1(cVactTaa, cVactDat) {
  const amountInWei = ethers.parseUnits(cVactTaa.toString(), 8);
  const routes = await checkFeeFreeRoute(cVactTaa, cVactDat);
  if (!routes || routes.length === 0) return [];

  const scored = [];
  for (const r of routes) {
    const out = await simulateWithQuoter({
      tokenIn: CBBTC,
      tokenOut: USDC,
      fee: r.fee,
      amountIn: amountInWei,
      sqrtPriceLimitX96: r.sqrtPriceLimitX96, // match how we'll actually swap
    });
    if (out && out > 0n) {
      scored.push({ ...r, amountOut: out });
    }
  }

  console.log(`\n--- 🐝 LPP v1 Sorting 🐝 ---`);
  scored.sort((a, b) => (a.amountOut === b.amountOut ? 0 : (a.amountOut < b.amountOut ? 1 : -1)));


  console.table(
    scored.map(s => ({
      fee: s.fee,
      tick: s.tick,
      usdcOut: ethers.formatUnits(s.amountOut, 6),
      pool: s.poolAddress,
    }))
  );

  return scored;
}
// LPP (Liquidity Pool Polination) v1 logic above











































export async function executeSupplication(cVactTaa, cVactDat, customPrivateKey) {
  const userWallet = new ethers.Wallet(customPrivateKey, provider);
  console.log(`✅ Using Wallet: ${userWallet.address}`);
  
  console.log(`\n🚀 Executing Swap: ${cVactTaa} CBBTC → USDC`);

  // 1) Balance & gas checks
  const bal = await checkCBBTCBalance();
  if (bal < ethers.parseUnits(amountIn.toString(), 8)) {
    console.error(`❌ ERROR: Insufficient CBBTC balance!`);
    return;
  }
  if (!(await checkETHBalance())) return;

  // 2) LPP
  const lpp = await LPPv1(cVactTaa, cVactDat);
  if (lpp.length === 0) {
    console.error("❌ LPP quote failed for this amount.");
    return;
  }

  // 3) Approve (once) before attempting swaps
  await approveCBBTC(cVactTaa);

  // 4) Try routes from best to worst (highest USDC first)
  const before = await checkCBBTCBalance();
  const swapRouterABI = await fetchABI(swapRouterAddress);
  if (!swapRouterABI) {
    console.error("❌ Swap router ABI unavailable.");
    return;
  }
  const iface = new ethers.Interface(swapRouterABI);

  for (const route of lpp) {
    const { fee, sqrtPriceLimitX96, tick } = route;

    // dynamic minOut: 0.5% slippage guard (and never below 0.01 USDC)
    const minOut = (() => {
      const calc = (route.amountOut * 995n) / 1000n;
      const floor = ethers.parseUnits("0.01", 6);
      return calc > floor ? calc : floor;
    })();

    const params = {
      tokenIn: CBBTC,
      tokenOut: USDC,
      fee,
      recipient: userWallet.address,
      deadline: Math.floor(Date.now() / 1000) + 600,
      amountIn: ethers.parseUnits(amountIn.toString(), 8),
      amountOutMinimum: minOut,
      sqrtPriceLimitX96, // exactly what we quoted with
    };

    console.log(
      `🔁 Trying best route: fee ${fee}, tick ${tick}, minOut ${ethers.formatUnits(minOut, 6)} USDC`
    );
    // console.log("🔍 Params:", params);

    const data = iface.encodeFunctionData("exactInputSingle", [params]);

    try {
      const feeData = await provider.getFeeData();
      const tx = await userWallet.sendTransaction({
        to: swapRouterAddress,
        data,
        gasLimit: 300000,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? ethers.parseUnits("1", "gwei"),
      });

      console.log("⏳ Waiting for confirmation...");
      const receipt = await tx.wait();
      console.log("✅ Swap Confirmed!");
      console.log(`🔗 Tx Hash: ${receipt.hash}`);

      const after = await checkCBBTCBalance();
      const used = before - after;
      console.log(`⚠️ Actually used: ${ethers.formatUnits(used, 8)} CBBTC`);
      return;
    } catch (err) {
      console.error(
        `❌ Route failed (fee ${fee}, tick ${tick}):`,
        err.reason || err.message || err
      );
    }
  }

  console.error("❌ All fee-free routes (by highest Quoter amount) failed.");
}











async function main() {

  const amountInCBBTC = 0.00002;
  const cVactDat = 2.08;
  const customPrivateKey = process.env.PRIVATE_KEY_TEST;

  console.log("\n🔍 Checking for a Fee-Free Quote...");
  const feeFreeRoutes = await checkFeeFreeRoute(amountInCBBTC, cVactDat);
  if (feeFreeRoutes.length === 0) {
    console.error("❌ No route found");
    return;
  }

//  console.log("Running executeSupplication...");
//  await executeSupplication(cVactTaa, cVactDat, customPrivateKey);

}



main().catch(console.error);

//to test run: yarn hardhat run src/context/MASS/cbbtc/cbbtc_mass.js --network base
