
import { 
  ethers, 
  keccak256, 
  getAddress, 
  toBeHex,
  hexConcat, zeroPadValue, 
  toBeHex } from "ethers";
import dotenv from "dotenv";
import axios from "axios";
import { TickMath } from "@uniswap/v3-sdk";
import { keccak256, encodePacked, getAddress, solidityPacked } from "viem";
import { exitCode } from "process";
import { unlink } from "fs";
import { Token } from '@uniswap/sdk-core';

dotenv.config();


















const V4_POOL_MANAGER = "0x498581fF718922c3f8e6A244956aF099B2652b2b";
const V4_POOL_AB_HOOK_ADDRESS = "0x5cd525c621AFCa515Bf58631D4733fbA7B72Aae4";
const STATE_VIEW_ADDRESS = "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71";
const V4_QUOTER_ADDRESS = "0x0d5e0f971ed27fbff6c2837bf31316121532048d";

const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const stateViewABI = [
  "function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)",
  "function getLiquidity(bytes32 poolId) view returns (uint128)"
];

const stateView = new ethers.Contract(STATE_VIEW_ADDRESS, stateViewABI, provider);
const V4_POOL_IDS = [
  {
    label: "V4 A (0.3%)",
    poolId: "0x64f978ef116d3c2e1231cfd8b80a369dcd8e91b28037c9973b65b59fd2cbbb96", 
    hooks: getAddress(V4_POOL_AB_HOOK_ADDRESS), 
    tickSpacing: 200,
    fee: 3000,
  },
];

const slot0Interface = new ethers.Interface([
  "function getSlot0(bytes32) view returns (uint160 sqrtPriceX96, int24 tick, uint16 protocolFee, uint16 lpFee)",
]);

const liquidityInterface = new ethers.Interface([
  "function getLiquidity(bytes32 poolId) view returns (uint128)",
]);
const tickInfoInterface = new ethers.Interface([
  "function getTickInfo(bytes32 poolId, int24 tick) view returns (uint128 liquidityGross, int128 liquidityNet, uint256 feeGrowthOutside0, uint256 feeGrowthOutside1)"
]);
const tickBitmapInterface = new ethers.Interface([
  "function getTickBitmap(bytes32 poolId, int16 wordPosition) view returns (uint256)"
]);

  // Fetch ABI dynamically
  async function fetchABI(address) {
    const apiKey = process.env.BASESCAN_API_KEY;
    const url = `https://api.basescan.org/api?module=contract&action=getabi&address=${address}&apikey=${apiKey}`;
    const response = await axios.get(url);
    if (response.data.status !== "1") throw new Error("Failed to fetch ABI from BaseScan");

    const abi = JSON.parse(response.data.result);
    //console.log("🔍 Full V4 Quoter ABI:\n", JSON.stringify(abi, null, 2));
    const quoteFragment = abi.find(
      (entry) => entry.name === "quoteExactInputSingle" && entry.type === "function"
    );
    console.log("🔍 quoteExactInputSingle ABI fragment:", quoteFragment);

    return abi;
  }

// 🔹 Helper to fetch PoolKey from poolId
async function fetchPoolKeyFromId(poolManager, poolId) {
  const poolKey = await poolManager.getPoolKey(poolId);
  console.log("🔍 On-chain PoolKey for", poolId, ":", poolKey);
  return poolKey;
}

function computePoolId(poolKey) {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const encodedKey = abiCoder.encode(
    ["address", "address", "uint24", "int24", "address"],
    [
      poolKey.currency0,
      poolKey.currency1,
      poolKey.fee,
      poolKey.tickSpacing,
      poolKey.hooks,
    ]
  );
  return ethers.keccak256(encodedKey);
}

async function getTickBitmap(poolId, wordPosition) {
  const data = tickBitmapInterface.encodeFunctionData("getTickBitmap", [poolId, wordPosition]);
  const result = await provider.call({ to: STATE_VIEW_ADDRESS, data });
  return tickBitmapInterface.decodeFunctionResult("getTickBitmap", result)[0];
}
async function getSlot0FromStateView(poolId) {
  const data = slot0Interface.encodeFunctionData("getSlot0", [poolId]);
  const result = await provider.call({ to: STATE_VIEW_ADDRESS, data });
  return slot0Interface.decodeFunctionResult("getSlot0", result);
}

async function getLiquidity(poolId) {
  const data = liquidityInterface.encodeFunctionData("getLiquidity", [poolId]);
  const result = await provider.call({ to: STATE_VIEW_ADDRESS, data });
  return liquidityInterface.decodeFunctionResult("getLiquidity", result)[0];
}

async function getTickInfo(poolId, tick) {
  const data = tickInfoInterface.encodeFunctionData("getTickInfo", [poolId, tick]);
  const result = await provider.call({ to: STATE_VIEW_ADDRESS, data });
  const decoded = tickInfoInterface.decodeFunctionResult("getTickInfo", result);

  return {
    liquidityGross: decoded[0],
    liquidityNet: decoded[1],
    feeGrowthOutside0: decoded[2],
    feeGrowthOutside1: decoded[3],
  };
}

function decodeSqrtPriceX96ToFloat(sqrtPriceX96, decimalsToken0 = 8, decimalsToken1 = 6) {
  const Q96 = BigInt(2) ** BigInt(96);
  const sqrt = BigInt(sqrtPriceX96);
  const rawPrice = Number(sqrt * sqrt) / Number(Q96 * Q96);
  return (1 / rawPrice) * 10 ** (decimalsToken0 - decimalsToken1);
}

function decodeLiquidityAmountsv4(liquidity, sqrtPriceX96) {
  const sqrtPrice = Number(sqrtPriceX96) / 2 ** 96;
  const liquidityFloat = Number(liquidity);
  return {
    cbBTC: (liquidityFloat * sqrtPrice) / 1e8,
    usdc: (liquidityFloat / sqrtPrice) / 1e6,
  };
}

function getInitializedTicksFromBitmap(bitmap, wordPosition, tickSpacing) {
  const ticks = [];
  const binary = bitmap.toString(2).padStart(256, "0");

  for (let i = 0; i < 256; i++) {
    if (binary[255 - i] === "1") { // reverse bit order
      const tick = (wordPosition * 256 + i) * tickSpacing;
      ticks.push(tick);

    }
  }
  return ticks;
}



// --- V4 fee-free route probe helpers ---

// Build + call V4 quoter for a single (limit) tick
async function simulateWithV4QuoterSingle({ poolKey, zeroForOne, amountInCBBTC, sqrtPriceLimitX96 }) {
  const quoterABI = await fetchABI(V4_QUOTER_ADDRESS);
  const iface = new ethers.Interface(quoterABI);

  const calldata = iface.encodeFunctionData("quoteExactInputSingle", [{
    poolKey: {
      currency0: poolKey.currency0,
      currency1: poolKey.currency1,
      fee: BigInt(poolKey.fee),
      tickSpacing: BigInt(poolKey.tickSpacing),
      hooks: poolKey.hooks,
    },
    zeroForOne,
    exactAmount: BigInt(amountInCBBTC),   // cbBTC (8 decimals) in base units
    hookData: "0x",
  }]);

  try {
    const raw = await provider.call({ to: V4_QUOTER_ADDRESS, data: calldata });
    const [amountOut, gasEstimate] = iface.decodeFunctionResult("quoteExactInputSingle", raw);
    return { ok: true, amountOut, gasEstimate };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// Probe around current tick; report whether pool is fee-free now and return best route
async function checkFeeFreeRouteV4(amountInHuman, poolKey, poolId) {
  console.log(`\n🚀 Checking V4 Fee-Free Route @ amount=${amountInHuman} cbBTC ...`);
  // convert cbBTC (8 dp) to base units
  const amountInCBBTC = ethers.parseUnits(String(amountInHuman), 8);

  // current slot0 (+ lpFee) from StateView
  const [sqrtPriceX96, tick, , lpFee] = await stateView.getSlot0(poolId);
  const isFeeFreeNow = (BigInt(lpFee) === 0n);
  console.log(`🔎 lpFee (current): ${lpFee} ${isFeeFreeNow ? "(fee-free now ✅)" : ""}`);

  const zeroForOne = poolKey.currency0.toLowerCase() === CBBTC.toLowerCase();
  const tickSpacing = Number(poolKey.tickSpacing);
  const baseTick = Math.floor(Number(tick) / tickSpacing) * tickSpacing;

  const candidates = [];
  for (let i = -2; i <= 2; i++) {
    const testTick = baseTick + i * tickSpacing;
    let limit;
    try {
      // reuse TickMath (from your V3 codebase) to get sqrtRatio for the probe tick
      limit = BigInt(TickMath.getSqrtRatioAtTick(testTick).toString());
    } catch (e) {
      console.warn(`⚠️ skip tick ${testTick}: ${e.message}`);
      continue;
    }

    const sim = await simulateWithV4QuoterSingle({
      poolKey, zeroForOne, amountInCBBTC, sqrtPriceLimitX96: limit
    });

    if (sim.ok) {
      const outHuman = Number(ethers.formatUnits(sim.amountOut, 6));
      console.log(`✅ tick ${testTick} → out ~ ${outHuman.toFixed(6)} USDC (gas=${sim.gasEstimate.toString()})`);
      candidates.push({ testTick, limit, ...sim, outHuman });
    } else {
      // uncomment to see all failures:
      // console.log(`❌ tick ${testTick} failed:`, sim.error?.reason || sim.error?.message || sim.error);
    }
  }

  if (candidates.length === 0) {
    console.log("❌ No viable ticks around current price (or quoter reverts).");
    return { feeFreeNow: isFeeFreeNow, best: null };
  }

  // choose best by raw amountOut
  candidates.sort((a, b) => (a.amountOut > b.amountOut ? -1 : 1));
  const best = candidates[0];
  console.log(`🏁 Best probe tick ${best.testTick} → ${best.outHuman.toFixed(6)} USDC`);

  return { feeFreeNow: isFeeFreeNow, best };
}




async function main() {
  const amountInCBBTC = ethers.parseUnits("1", 8);

  for (const pool of V4_POOL_IDS) {
    const token0 = CBBTC.toLowerCase() < USDC.toLowerCase() ? CBBTC : USDC;
    const token1 = CBBTC.toLowerCase() < USDC.toLowerCase() ? USDC : CBBTC;

    const poolKey = {
      currency0: token0,
      currency1: token1,
      fee: pool.fee,
      tickSpacing: pool.tickSpacing,
      hooks: pool.hooks,
    };

    console.log(`\n🔎 ${pool.label}`);
    console.log(`• Using manual poolId: ${pool.poolId}`);

    const liquidity = await getLiquidity(pool.poolId);
    if (liquidity === 0n) {
      console.log(`🚫 Skipping ${pool.label} — pool has zero global liquidity.`);
    } else {
      const { feeFreeNow, best } = await checkFeeFreeRouteV4(amountInCBBTC, poolKey, pool.poolId);

      if (best) {
        // also log reserves & slot0 for context (you already have these helpers)
        const [sqrtX] = await stateView.getSlot0(pool.poolId);
        const liq = await stateView.getLiquidity(pool.poolId);
        const px = decodeSqrtPriceX96ToFloat(sqrtX);
        const reserves = decodeLiquidityAmountsv4(liq, sqrtX);
  
        console.log(`→ Fee-free now? ${feeFreeNow ? "YES" : "NO"} | BestOut: ${best.outHuman.toFixed(6)} USDC`);
        console.log(`📈 sqrtPriceX96: ${sqrtX}`);
        console.log(`💰 cbBTC/USDC Price: $${px.toFixed(2)}`);
        console.log(`📦 cbBTC Reserve: ${reserves.cbBTC.toFixed(6)} cbBTC`);
        console.log(`📦 USDC Reserve: ${reserves.usdc.toFixed(2)} USDC`);
  
        // (optional) compare mid vs exec:
        // logMidVsExec(ethers.parseUnits(String(probeAmount), 8), best.amountOut, sqrtX);
      } else {
        console.log("⚠️ No best tick chosen (no viable quotes).");
      }
    }

  }
}

main().catch(console.error);


//to test run: yarn hardhat run test/cbbtc_mass_test.js --network base

// The v4 quote() function doesn’t take poolId as input
// if above fails, 
// look for other public quote functions with external from quoter

// It takes:
// 	•	A poolKey (token0, token1, fee, tickSpacing, hook)
// 	•	Then internally computes the poolId using that key
// 	•	And tries to find the pool on-chain
