// usdc_cbBTC_all_experiments_dryrun.js
import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";
import { TickMath, nearestUsableTick } from "@uniswap/v3-sdk";
import JSBI from "jsbi";

dotenv.config();

// -------- Addresses (Base) --------
const QUOTER_ADDRESS  = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a"; // Uniswap V3 QuoterV2 on Base
const FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"; // Uniswap V3 Factory
const USDC            = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // 6 dp
const CBBTC           = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf"; // 8 dp
const FEE_TIERS       = [500, 3000]; // 0.05% and 0.30%

// -------- Provider (read-only) --------
const provider   = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const testWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST ?? ethers.ZeroHash, provider);
console.log(`✅ Using Test Wallet (read-only): ${testWallet.address}`);

// -------- ABI cache --------
const __abiCache = new Map();
async function fetchABI(addr) {
  const key = addr.toLowerCase();
  if (__abiCache.has(key)) return __abiCache.get(key);
  const { data } = await axios.get(
    `https://api.basescan.org/api?module=contract&action=getabi&address=${addr}&apikey=${process.env.BASESCAN_API_KEY}`
  );
  if (data.status !== "1") throw new Error(`BaseScan getabi failed: ${data.message}`);
  const abi = JSON.parse(data.result);
  __abiCache.set(key, abi);
  return abi;
}

// -------- Pool helpers --------
async function getPoolAddressForFee(fee) {
  const factoryAbi = await fetchABI(FACTORY_ADDRESS);
  const factory = new ethers.Contract(FACTORY_ADDRESS, factoryAbi, provider);
  try {
    return await factory.getPool(USDC, CBBTC, fee);
  } catch {
    return ethers.ZeroAddress;
  }
}

async function readPoolInfo(poolAddr) {
  const abi = await fetchABI(poolAddr);
  const pool = new ethers.Contract(poolAddr, abi, provider);
  const [slot0, tickSpacing, token0, token1] = await Promise.all([
    pool.slot0(),
    pool.tickSpacing(),
    pool.token0(),
    pool.token1(),
  ]);
  const sqrtPriceX96 = BigInt(slot0.sqrtPriceX96 ?? slot0[0]);
  const tick = Number(slot0.tick ?? slot0[1]);
  const spacing = Number(tickSpacing);

  // Current usable tick band that contains the current tick
  const baseTick = nearestUsableTick(tick, spacing);
  const tickLower = baseTick;
  const tickUpper = baseTick + spacing;

  const sqrtLower = BigInt(TickMath.getSqrtRatioAtTick(tickLower).toString());
  const sqrtUpper = BigInt(TickMath.getSqrtRatioAtTick(tickUpper).toString());

  // Direction helper: zeroForOne = token0->token1 lowers sqrtPrice; token1->token0 raises sqrt
  // We want USDC -> CBBTC (exactInput side) direction
  const usdcIsToken0 = token0.toLowerCase() === USDC.toLowerCase();
  const cbbtcIsToken1 = token1.toLowerCase() === CBBTC.toLowerCase();
  const zeroForOne_USDC_to_CBBTC = usdcIsToken0 && cbbtcIsToken1; // true if token0->token1

  return {
    token0, token1,
    tick, tickSpacing: spacing,
    sqrtPriceX96, sqrtLower, sqrtUpper,
    zeroForOne_USDC_to_CBBTC,
  };
}

function decodeSpotUSDCperCBBTC(sqrtPriceX96) {
  const sqrt = BigInt(sqrtPriceX96);
  const num  = sqrt * sqrt;        // Q192
  const den  = 1n << 192n;
  const raw  = Number(num) / Number(den); // token1/token0
  const usdcDecimals = 6, cbbtcDecimals = 8;
  return (1 / raw) * (10 ** (cbbtcDecimals - usdcDecimals));
}

// -------- Quoter helpers (support V2 & legacy) --------
async function getQuoter() {
  const abi = await fetchABI(QUOTER_ADDRESS);
  return { abi, q: new ethers.Contract(QUOTER_ADDRESS, abi, provider) };
}

async function quoteExactInputSingle({ tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96 = 0n }) {
  const { abi, q } = await getQuoter();
  const iface = new ethers.Interface(abi);
  const fn = abi.find(f => f.name === "quoteExactInputSingle");
  if (!fn) throw new Error("quoteExactInputSingle not in ABI");

  try {
    let res;
    if (fn.inputs.length === 1 && fn.inputs[0].type.startsWith("tuple")) {
      res = await q.quoteExactInputSingle({ tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96 });
    } else {
      res = await q.quoteExactInputSingle(tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96);
    }
    const amountOut = Array.isArray(res) ? res[0] : (res.amountOut ?? res);
    return BigInt(amountOut.toString());
  } catch (e) {
    try {
      const data = iface.encodeFunctionData("quoteExactInputSingle",
        fn.inputs.length === 1
          ? [{ tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96 }]
          : [tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96]
      );
      const raw = await provider.call({ to: QUOTER_ADDRESS, data });
      const dec = iface.decodeFunctionResult("quoteExactInputSingle", raw);
      const amountOut = Array.isArray(dec) ? dec[0] : (dec.amountOut ?? dec);
      return BigInt(amountOut.toString());
    } catch {
      return null;
    }
  }
}

async function quoteExactOutputSingle({ tokenIn, tokenOut, fee, amountOut, sqrtPriceLimitX96 = 0n }) {
  const { abi, q } = await getQuoter();
  const iface = new ethers.Interface(abi);
  const fn = abi.find(f => f.name === "quoteExactOutputSingle");
  if (!fn) throw new Error("quoteExactOutputSingle not in ABI");

  try {
    let res;
    if (fn.inputs.length === 1 && fn.inputs[0].type.startsWith("tuple")) {
      // V2 expects field "amount"
      res = await q.quoteExactOutputSingle({ tokenIn, tokenOut, fee, amount: amountOut, sqrtPriceLimitX96 });
    } else {
      res = await q.quoteExactOutputSingle(tokenIn, tokenOut, fee, amountOut, sqrtPriceLimitX96);
    }
    const amountIn = Array.isArray(res) ? res[0] : (res.amountIn ?? res);
    return BigInt(amountIn.toString());
  } catch (e) {
    try {
      const data = iface.encodeFunctionData("quoteExactOutputSingle",
        fn.inputs.length === 1
          ? [{ tokenIn, tokenOut, fee, amount: amountOut, sqrtPriceLimitX96 }]
          : [tokenIn, tokenOut, fee, amountOut, sqrtPriceLimitX96]
      );
      const raw = await provider.call({ to: QUOTER_ADDRESS, data });
      const dec = iface.decodeFunctionResult("quoteExactOutputSingle", raw);
      const amountIn = Array.isArray(dec) ? dec[0] : (dec.amountIn ?? dec);
      return BigInt(amountIn.toString());
    } catch {
      return null;
    }
  }
}

// -------- Utils --------
const fmtUSDC = (bi) => ethers.formatUnits(bi, 6);
const fmtBTC  = (bi) => ethers.formatUnits(bi, 8);
const sats    = (n)  => BigInt(n); // 1 sat = 1 raw cbBTC unit

function boundaryRawForFeePpm(feePpm) {
  return Math.floor(1_000_000 / feePpm); // in USDC raw units (10^-6)
}

// Returns sqrt limit to keep swap inside the current tick for USDC->CBBTC direction
function limitInsideTick({ sqrtLower, sqrtUpper, zeroForOne_USDC_to_CBBTC }) {
  // For zeroForOne (token0->token1), sqrt moves DOWN => stop at sqrtLower+1
  // For token1->token0, sqrt moves UP   => stop at sqrtUpper-1
  if (zeroForOne_USDC_to_CBBTC) {
    return sqrtLower + 1n;
  } else {
    return sqrtUpper - 1n;
  }
}

// ===================================================
// A) Mixed (DP) exact-output ladder vs single-shot
// ===================================================
async function experimentA_mixedLadder({ fee, amountInUSDC }) {
  const pool = await getPoolAddressForFee(fee);
  if (pool === ethers.ZeroAddress) {
    console.log(`❌ No pool @ fee ${fee}`);
    return null;
  }
  const info = await readPoolInfo(pool);
  console.log(`\n=== [A] Mixed ladder — Fee ${fee} ===`);
  console.log(`💵 Spot (approx): ${decodeSpotUSDCperCBBTC(info.sqrtPriceX96).toLocaleString()} USDC/CBBTC`);

  const amountInRaw = ethers.parseUnits(amountInUSDC.toString(), 6);

  // Reference single-shot output & input (unpinned)
  const singleOut = await quoteExactInputSingle({
    tokenIn: USDC, tokenOut: CBBTC, fee, amountIn: amountInRaw
  });
  if (!singleOut) { console.log("⚠️ exactInputSingle failed."); return null; }
  const singleInEO = await quoteExactOutputSingle({
    tokenIn: USDC, tokenOut: CBBTC, fee, amountOut: singleOut
  });
  if (!singleInEO) { console.log("⚠️ exactOutputSingle (full) failed."); return null; }

  console.log(`🎯 Single out (exactInput): ${fmtBTC(singleOut)} cbBTC; input needed (EO): ${fmtUSDC(singleInEO)} USDC`);

  // Build per-chunk cost for 1..50 sats (unpinned)
  const MAX_SAT = 50;
  const costs = new Array(MAX_SAT + 1).fill(null);
  const rows = [];
  for (let s = 1; s <= MAX_SAT; s++) {
    const need = await quoteExactOutputSingle({
      tokenIn: USDC, tokenOut: CBBTC, fee, amountOut: sats(s)
    });
    if (need == null) continue;
    costs[s] = need;
    rows.push({ satChunk: s, chunkUSDC: Number(fmtUSDC(need)), usdcPerSat: Number(fmtUSDC(need)) / s });
  }
  console.log("\n[A] Per-leg (1..50 sats) cost — unpinned");
  console.table(rows);

  // Dynamic programming (min total input to reach targetOut sats)
  const targetSats = Number(singleOut); // small (~2.5k)
  const INF = 1n << 62n;
  const dp = new Array(targetSats + 1).fill(INF);
  dp[0] = 0n;
  for (let i = 1; i <= targetSats; i++) {
    for (let s = 1; s <= MAX_SAT && s <= i; s++) {
      if (costs[s] == null) continue;
      const cand = dp[i - s] + costs[s];
      if (cand < dp[i]) dp[i] = cand;
    }
  }
  const dpTotal = dp[targetSats];
  console.log(`\n[A] Ladder (DP) input: ${fmtUSDC(dpTotal)} USDC; Single input: ${fmtUSDC(singleInEO)} USDC`);
  const worseA = dpTotal > singleInEO;
  console.log(`[A] Δ (ladder − single): ${fmtUSDC(worseA ? (dpTotal - singleInEO) : (singleInEO - dpTotal))} USDC ${worseA ? "(worse)" : "(better)"}`);

  return {
    fee, pool,
    singleOutCbBTC: Number(fmtBTC(singleOut)),
    singleInputUSDC: Number(fmtUSDC(singleInEO)),
    ladderInputUSDC: Number(fmtUSDC(dpTotal)),
  };
}

// ===================================================
// B) Tick-pinned quotes (stay inside current tick)
// ===================================================
async function experimentB_tickPinned({ fee, amountInUSDC }) {
  const pool = await getPoolAddressForFee(fee);
  if (pool === ethers.ZeroAddress) { console.log(`❌ No pool @ fee ${fee}`); return null; }
  const info = await readPoolInfo(pool);
  console.log(`\n=== [B] Tick-pinned — Fee ${fee} ===`);
  console.log(`Tick=${info.tick} Spacing=${info.tickSpacing}`);

  const limit = limitInsideTick(info);
  const amountInRaw = ethers.parseUnits(amountInUSDC.toString(), 6);

  // exactInput: unpinned vs pinned
  const outUnpinned = await quoteExactInputSingle({
    tokenIn: USDC, tokenOut: CBBTC, fee, amountIn: amountInRaw
  });
  const outPinned = await quoteExactInputSingle({
    tokenIn: USDC, tokenOut: CBBTC, fee, amountIn: amountInRaw, sqrtPriceLimitX96: limit
  });

  // exactOutput: target = outUnpinned; unpinned vs pinned
  let inEO_unpinned = null, inEO_pinned = null;
  if (outUnpinned) {
    inEO_unpinned = await quoteExactOutputSingle({
      tokenIn: USDC, tokenOut: CBBTC, fee, amountOut: outUnpinned
    });
    inEO_pinned = await quoteExactOutputSingle({
      tokenIn: USDC, tokenOut: CBBTC, fee, amountOut: outUnpinned, sqrtPriceLimitX96: limit
    });
  }

  console.log(`[B] exactInput unpinned : ${outUnpinned ? fmtBTC(outUnpinned) : "fail"} cbBTC`);
  console.log(`[B] exactInput pinned   : ${outPinned ? fmtBTC(outPinned) : "fail"} cbBTC`);
  console.log(`[B] exactOutput in (unp): ${inEO_unpinned ? fmtUSDC(inEO_unpinned) : "fail"} USDC`);
  console.log(`[B] exactOutput in (pin): ${inEO_pinned ? fmtUSDC(inEO_pinned) : "fail"} USDC`);

  return {
    fee, pool,
    outUnpinned: outUnpinned ? Number(fmtBTC(outUnpinned)) : null,
    outPinned:   outPinned   ? Number(fmtBTC(outPinned))   : null,
    inEO_unpinned: inEO_unpinned ? Number(fmtUSDC(inEO_unpinned)) : null,
    inEO_pinned:   inEO_pinned   ? Number(fmtUSDC(inEO_pinned))   : null,
  };
}

// ===================================================
// C) Boundary scan (below/above), exactInput chunking
// ===================================================
async function simulateExactInput({ fee, amountInRaw, sqrtPriceLimitX96 = 0n }) {
  return await quoteExactInputSingle({
    tokenIn: USDC, tokenOut: CBBTC, fee, amountIn: amountInRaw, sqrtPriceLimitX96
  });
}

async function chunkedEstimateExactInput({ fee, totalInRaw, chunkRaw, sqrtPriceLimitX96 = 0n }) {
  if (chunkRaw <= 0n) return 0n;
  const out1 = await simulateExactInput({ fee, amountInRaw: chunkRaw, sqrtPriceLimitX96 });
  if (!out1) return 0n;
  const nFull = totalInRaw / chunkRaw;
  const rem   = totalInRaw % chunkRaw;
  let est = out1 * nFull;
  if (rem > 0n) {
    const remOut = await simulateExactInput({ fee, amountInRaw: rem, sqrtPriceLimitX96 });
    est += (remOut ?? 0n);
  }
  return est;
}

async function experimentC_boundaryScan({ fee, amountInUSDC }) {
  const pool = await getPoolAddressForFee(fee);
  if (pool === ethers.ZeroAddress) { console.log(`❌ No pool @ fee ${fee}`); return null; }
  const info = await readPoolInfo(pool);
  console.log(`\n=== [C] Boundary scan — Fee ${fee} ===`);

  const totalInRaw = ethers.parseUnits(amountInUSDC.toString(), 6);
  const boundary = boundaryRawForFeePpm(fee); // raw USDC units
  const candidates = [];
  for (let k = -5; k <= 5; k++) {
    const v = boundary + k;
    if (v > 0) candidates.push(BigInt(v));
  }

  // Single-shot reference output
  const singleOut = await simulateExactInput({ fee, amountInRaw: totalInRaw });
  if (!singleOut) { console.log("[C] single-shot quote failed."); return null; }

  // Probe table
  const table = [];
  for (const chunkRaw of candidates) {
    const out1 = await simulateExactInput({ fee, amountInRaw: chunkRaw });
    const out2 = await simulateExactInput({ fee, amountInRaw: chunkRaw * 2n });
    const linearOK = (out1 != null && out2 != null) ? ((2n * out1 - out2) === 0n || (out2 - 2n * out1) === 0n) : false;
    const est = await chunkedEstimateExactInput({ fee, totalInRaw, chunkRaw });
    const delta = est && singleOut ? (est > singleOut ? est - singleOut : singleOut - est) : 0n;
    table.push({
      candidateChunkUSDC: Number(ethers.formatUnits(chunkRaw, 6)),
      out1: out1 ? out1.toString() : "fail",
      out2: out2 ? out2.toString() : "fail",
      linearOK,
      chunkedEstCbBTC: est ? Number(fmtBTC(est)) : 0,
      deltaVsSingleCbBTC: Number(fmtBTC(delta)),
    });
  }

  console.log("\n[C] Around-boundary candidates (…−5..+5 raw units)");
  console.table(table);

  return {
    fee, pool,
    singleOutCbBTC: Number(fmtBTC(singleOut)),
    bestChunkedCbBTC: Math.max(...table.map(r => r.chunkedEstCbBTC)),
  };
}

// ===================================================
// Main driver (no on-chain state changes)
// ===================================================
async function main() {
  console.log("\n🧪 DRY RUN — All experiments (no txs)");
  const amountInUSDC = 3;

  const sumA = [];
  const sumB = [];
  const sumC = [];

  for (const fee of FEE_TIERS) {
    try {
      const a = await experimentA_mixedLadder({ fee, amountInUSDC });
      if (a) sumA.push(a);
    } catch (e) { console.error(`[A] fee ${fee} error:`, e?.message || e); }

    try {
      const b = await experimentB_tickPinned({ fee, amountInUSDC });
      if (b) sumB.push(b);
    } catch (e) { console.error(`[B] fee ${fee} error:`, e?.message || e); }

    try {
      const c = await experimentC_boundaryScan({ fee, amountInUSDC });
      if (c) sumC.push(c);
    } catch (e) { console.error(`[C] fee ${fee} error:`, e?.message || e); }
  }

  console.log("\n===== SUMMARY [A] Mixed ladder vs single =====");
  console.table(sumA);

  console.log("\n===== SUMMARY [B] Tick-pinned vs unpinned =====");
  console.table(sumB);

  console.log("\n===== SUMMARY [C] Boundary scan =====");
  console.table(sumC);
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exitCode = 1;
});

// to test run: yarn hardhat run test/usdc_lpp_test.js --network base