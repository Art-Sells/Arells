// v3_effective_zero_scan.js
import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

// ---------- Addresses (Base) ----------
const QUOTER_ADDRESS  = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a"; // Uniswap V3 QuoterV2
const FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"; // Uniswap V3 Factory
const USDC            = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // 6 dp
const CBBTC           = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf"; // 8 dp
const WETH            = "0x4200000000000000000000000000000000000006"; // WETH on Base

const FEE_TIERS       = [500, 3000, 10000]; // side legs to explore
const PRIMARY_TIERS   = [500, 3000];        // direct tiers

// ---------- Provider ----------
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
console.log("✅ Provider ready");

// ---------- ABI cache (BaseScan only, with tiny retry) ----------
const __abiCache = new Map();
async function fetchABI(addr) {
  const key = addr.toLowerCase();
  if (__abiCache.has(key)) return __abiCache.get(key);

  const hit = async () => {
    const { data } = await axios.get(
      `https://api.basescan.org/api?module=contract&action=getabi&address=${addr}&apikey=${process.env.BASESCAN_API_KEY}`
    );
    if (data.status !== "1") throw new Error(`BaseScan getabi failed: ${data.message}`);
    const abi = JSON.parse(data.result);
    __abiCache.set(key, abi);
    return abi;
  };

  try {
    return await hit();
  } catch (e1) {
    // brief backoff for transient NOTOK/rate-limit
    await new Promise(r => setTimeout(r, 200));
    try {
      return await hit();
    } catch (e2) {
      throw e2;
    }
  }
}

// ---------- Pool helpers ----------
async function getPoolAddress(tokenA, tokenB, fee) {
  const abi = await fetchABI(FACTORY_ADDRESS);
  const factory = new ethers.Contract(FACTORY_ADDRESS, abi, provider);
  try { return await factory.getPool(tokenA, tokenB, fee); }
  catch { return ethers.ZeroAddress; }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function findPools(tokenA, tokenB, feeList) {
  const res = [];
  for (const fee of feeList) {
    const p = await getPoolAddress(tokenA, tokenB, fee);
    if (p !== ethers.ZeroAddress) res.push({ fee, pool: p });
    await sleep(25);
  }
  return res;
}

async function readSlot0(pool) {
  const abi = await fetchABI(pool);
  const c = new ethers.Contract(pool, abi, provider);
  const s = await c.slot0();
  const sqrtPriceX96 = BigInt(s.sqrtPriceX96 ?? s[0]);
  const tick = Number(s.tick ?? s[1]);
  return { sqrtPriceX96, tick };
}

// ---------- Path encoding ----------
function encodePath(tokens, fees) {
  const parts = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    parts.push(ethers.solidityPacked(["address", "uint24"], [tokens[i], fees[i]]));
  }
  parts.push(ethers.solidityPacked(["address"], [tokens[tokens.length - 1]]));
  return ethers.concat(parts);
}

// ---------- Quoter (robust; same pattern you used) ----------
async function makeQuoter() {
  const abi = await fetchABI(QUOTER_ADDRESS);
  return { abi, q: new ethers.Contract(QUOTER_ADDRESS, abi, provider), iface: new ethers.Interface(abi) };
}

async function quoteExactInputSingle({ tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96 = 0n }) {
  const { abi, q, iface } = await makeQuoter();
  const fn = abi.find(f => f.name === "quoteExactInputSingle");
  if (!fn) throw new Error("quoteExactInputSingle not in ABI");

  // Try tuple call
  try {
    const res = await q.quoteExactInputSingle({ tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96 });
    const amountOut = Array.isArray(res) ? res[0] : (res.amountOut ?? res);
    return BigInt(amountOut.toString());
  } catch {
    // Try positional call
    try {
      const res2 = await q.quoteExactInputSingle(tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96);
      const amountOut2 = Array.isArray(res2) ? res2[0] : (res2.amountOut ?? res2);
      return BigInt(amountOut2.toString());
    } catch {
      // Raw provider.call (encode tuple form)
      try {
        const data = iface.encodeFunctionData("quoteExactInputSingle", [{
          tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96
        }]);
        const raw = await provider.call({ to: QUOTER_ADDRESS, data });
        const dec = iface.decodeFunctionResult("quoteExactInputSingle", raw);
        const amountOut3 = Array.isArray(dec) ? dec[0] : (dec.amountOut ?? dec);
        return BigInt(amountOut3.toString());
      } catch (e3) {
        console.warn(`⚠️ quoteExactInputSingle failed (fee ${fee}): ${e3?.reason || e3?.message}`);
        return null;
      }
    }
  }
}

async function quoteExactInputPath(pathBytes, amountIn) {
  const { q, iface } = await makeQuoter();

  // Try normal call
  try {
    const res = await q.quoteExactInput(pathBytes, amountIn);
    const amountOut = Array.isArray(res) ? res[0] : (res.amountOut ?? res);
    return BigInt(amountOut.toString());
  } catch {
    // Raw provider.call fallback
    try {
      const data = iface.encodeFunctionData("quoteExactInput", [pathBytes, amountIn]);
      const raw  = await provider.call({ to: QUOTER_ADDRESS, data });
      const dec  = iface.decodeFunctionResult("quoteExactInput", raw);
      const amountOut2 = Array.isArray(dec) ? dec[0] : (dec.amountOut ?? dec);
      return BigInt(amountOut2.toString());
    } catch (e2) {
      console.warn(`⚠️ quoteExactInput(path) failed: ${e2?.reason || e2?.message}`);
      return null;
    }
  }
}

// ---------- Math ----------
function idealNoFeeFloorSats(amountInUSDC, sqrtPriceX96) {
  const sqrt = BigInt(sqrtPriceX96);
  const price_num = sqrt * sqrt;       // Q192
  const price_den = 1n << 192n;
  const amount0   = ethers.parseUnits(amountInUSDC.toString(), 6); // USDC raw
  return (amount0 * price_num) / price_den;                        // cbBTC raw (8dp), floor via int div
}
function bps(shortfall, base) {
  if (base <= 0n) return null;
  return Number(shortfall) * 10000 / Number(base);
}

// ---------- Scan ----------
async function scanEffectiveZero(amountsUSDC = [1,2,3,5,10,25,50,100]) {
  const directPools = await findPools(USDC, CBBTC, PRIMARY_TIERS);
  if (!directPools.length) {
    console.log("❌ No direct pools found");
    return;
  }
  console.log("Direct pools:", directPools.map(p => ({ fee: p.fee, pool: p.pool })));

  const usdc_weth  = await findPools(USDC,  WETH,  FEE_TIERS);
  const weth_cbbtc = await findPools(WETH,  CBBTC, FEE_TIERS);

  const twoHopCandidates = [];
  for (const a of usdc_weth) for (const b of weth_cbbtc) {
    twoHopCandidates.push({ fees: [a.fee, b.fee], mid: WETH });
  }
  console.log(`2-hop candidates via WETH: ${twoHopCandidates.length}`);

  for (const dp of directPools) {
    const { sqrtPriceX96 } = await readSlot0(dp.pool);
    console.log(`\n=== Fee ${dp.fee} Pool ${dp.pool} ===`);
    const rows = [];

    for (const amt of amountsUSDC) {
      const amountInRaw = ethers.parseUnits(amt.toString(), 6);
      const idealSats   = idealNoFeeFloorSats(amt, sqrtPriceX96);

      // direct single-hop
      const outDirect = await quoteExactInputSingle({
        tokenIn: USDC, tokenOut: CBBTC, fee: dp.fee, amountIn: amountInRaw
      });

      // best 2-hop
      let bestTwoHop = 0n;
      for (const cand of twoHopCandidates) {
        const path = encodePath([USDC, cand.mid, CBBTC], cand.fees);
        const out  = await quoteExactInputPath(path, amountInRaw);
        if (out && out > bestTwoHop) bestTwoHop = out;
        await sleep(10);
      }

      const bestOut = (outDirect ?? 0n) > bestTwoHop ? (outDirect ?? 0n) : bestTwoHop;
      const gap     = idealSats - bestOut;
      const gapBps  = bestOut > 0n ? bps(gap, idealSats) : null;

      rows.push({
        usdc: amt,
        idealSats: Number(idealSats),
        outDirectSats: Number(outDirect ?? 0n),
        outBest2HopSats: Number(bestTwoHop),
        outBestSats: Number(bestOut),
        gapBps: gapBps != null ? Number(gapBps.toFixed(3)) : null,
        effectiveZero: gap <= 0n
      });
    }

    console.table(rows);

    const hits = rows.filter(r => r.effectiveZero);
    if (hits.length) {
      console.log("🎯 Effective-zero hits (gapBps ≤ 0):");
      hits.forEach(h => console.log(`  • ${h.usdc} USDC (gap ${h.gapBps} bps)`));
    } else {
      console.log("No effective-zero paths at this snapshot. Try later or widen intermediates.");
    }
  }
}

// ---------- Main ----------
async function main() {
  console.log("\n🧪 DRY RUN — Effective-zero scan");
  await scanEffectiveZero();
}

main().catch(err => {
  console.error("❌ Script failed:", err?.message || err);
  process.exitCode = 1;
});

// to test run: yarn hardhat run test/usdc_lpp_test.js --network base
