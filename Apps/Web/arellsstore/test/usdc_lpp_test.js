// usdc_cbBTC_notional_sweep_dryrun.js
import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// ---------- Addresses (Base) ----------
const QUOTER_ADDRESS  = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a"; // Uniswap V3 QuoterV2
const FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"; // Uniswap V3 Factory
const USDC            = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // 6 dp
const CBBTC           = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf"; // 8 dp
const FEE_TIERS       = [500, 3000]; // 0.05% (5 bps), 0.30% (30 bps)

// ---------- Provider (read-only) ----------
const provider    = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const dummyWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST ?? ethers.ZeroHash, provider);
console.log(`✅ Using Test Wallet (read-only): ${dummyWallet.address}`);

// ---------- ABI cache ----------
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

// ---------- Pool helpers ----------
async function getPoolAddressForFee(fee) {
  const abi = await fetchABI(FACTORY_ADDRESS);
  const factory = new ethers.Contract(FACTORY_ADDRESS, abi, provider);
  try {
    return await factory.getPool(USDC, CBBTC, fee);
  } catch { return ethers.ZeroAddress; }
}

async function readSlot0At(pool, blockTag) {
  const abi   = await fetchABI(pool);
  const iface = new ethers.Interface(abi);
  const data  = iface.encodeFunctionData("slot0", []);
  const raw   = await provider.call({ to: pool, data, blockTag });
  const dec   = iface.decodeFunctionResult("slot0", raw);
  return { sqrtPriceX96: BigInt(dec[0]), tick: Number(dec[1]) };
}

// ---------- Quoter helpers ----------
async function makeQuoter() {
  const abi = await fetchABI(QUOTER_ADDRESS);
  return { iface: new ethers.Interface(abi) };
}

async function quoteExactInputSingleAt(
  { tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96 = 0n },
  blockTag
) {
  try {
    const { iface } = await makeQuoter();
    const data = iface.encodeFunctionData("quoteExactInputSingle", [{
      tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96
    }]);
    const raw = await provider.call({ to: QUOTER_ADDRESS, data, blockTag });
    const dec = iface.decodeFunctionResult("quoteExactInputSingle", raw);
    const out = Array.isArray(dec) ? dec[0] : (dec.amountOut ?? dec);
    return BigInt(out.toString());
  } catch {
    return null;
  }
}

// ---------- Math helpers ----------
function idealNoFeeFloorSats(amountInUSDC, sqrtPriceX96) {
  const sqrt = BigInt(sqrtPriceX96);
  const price_num = sqrt * sqrt;  // Q192 numerator
  const price_den = 1n << 192n;   // Q192 denominator
  const amount0_raw = ethers.parseUnits(amountInUSDC.toString(), 6); // USDC raw
  return (amount0_raw * price_num) / price_den;   // cbBTC raw (8dp), floored
}

function roundingCapBps(idealSatsFloor) {
  const sats = Number(idealSatsFloor);
  if (sats <= 0) return Infinity;
  return (0.5 / sats) * 10000;
}

function pctBps(numer, denom) {
  if (denom <= 0n) return null;
  const diff = numer < 0n ? -numer : numer;
  return Number(diff) * 10000 / Number(denom);
}

// ---------- Sweep ----------
async function sweepNotionals({ fee, fromUSDC = 1, toUSDC = 10, stepUSDC = 1, blockTag }) {
  const pool = await getPoolAddressForFee(fee);
  if (pool === ethers.ZeroAddress) {
    console.log(`❌ No pool for fee ${fee}`);
    return null;
  }

  const { sqrtPriceX96 } = await readSlot0At(pool, blockTag);
  console.log(`\n=== Notional sweep — Fee ${fee} (pool ${pool}) @ block ${blockTag} ===`);

  const rows = [];
  for (let a = fromUSDC; a <= toUSDC; a += stepUSDC) {
    const amtRaw     = ethers.parseUnits(a.toString(), 6);
    const idealFloor = idealNoFeeFloorSats(a, sqrtPriceX96);

    const out = await quoteExactInputSingleAt({
      tokenIn: USDC, tokenOut: CBBTC, fee, amountIn: amtRaw
    }, blockTag);

    const outSats = out ?? 0n;
    const gapBps  = (idealFloor > 0n && outSats > 0n)
      ? pctBps(idealFloor - outSats, idealFloor)
      : null;

    rows.push({
      usdc: a,
      idealSats: Number(idealFloor),
      roundingCapBps: Number.isFinite(roundingCapBps(idealFloor)) ? Number(roundingCapBps(idealFloor).toFixed(3)) : null,
      outSats: Number(outSats),
      gapBps: gapBps != null ? Number(gapBps.toFixed(3)) : null,
      effectiveZero: gapBps !== null && gapBps <= 0
    });
  }

  console.table(rows);

  const hits = rows.filter(r => r.effectiveZero);
  if (hits.length) {
    console.log("\n🎯 Effective-zero hits (gapBps ≤ 0):");
    hits.forEach(h => console.log(`  • ${h.usdc} USDC (gap ${h.gapBps} bps)`));
  } else {
    console.log("\nNo effective-zero hits at this snapshot.");
  }

  return { fee, pool, rows };
}

// ---------- Main ----------
async function main() {
  console.log("\n🧪 DRY RUN — Notional sweep 1..10 USDC (block-pinned, no txs)");
  const blockTag = await provider.getBlockNumber();
  for (const fee of FEE_TIERS) {
    await sweepNotionals({ fee, fromUSDC: 1, toUSDC: 10, stepUSDC: 1, blockTag });
  }
}

main().catch(err => {
  console.error("❌ Script failed:", err?.message || err);
  process.exitCode = 1;
});

// run: yarn hardhat run test/usdc_lpp_test.js --network base