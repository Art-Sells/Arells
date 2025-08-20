import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";
import crypto from "crypto";
import { TickMath } from "@uniswap/v3-sdk";

dotenv.config();

/**
 * Ultra-fast cbBTC→USDC v4 quoting with fee-free heuristics.
 *
 * Key speedups vs prior versions:
 *  - No block-by-block fee scans (disabled by default; opt-in via env)
 *  - Parallelized quotes with a tiny concurrency pool
 *  - Early-exit when a near-zero-fee quote is detected
 *  - Small, surgical tick-limit probe (optional)
 *  - Configurable brute rounds & byte-width via env (defaults tiny)
 *
 * Env knobs:
 *  BASE_RPC_URL (required)
 *  PRIVATE_KEY_TEST (required for sender-gated tests)
 *  BASESCAN_API_KEY (for fetching IV4Quoter ABI)
 *  QUOTE_CONCURRENCY (default 8)
 *  RPC_TIMEOUT_MS (default 4000)
 *  ENABLE_TICK_PROBE ("0" to disable; default 1)
 *  HOOK_STRUCTURED_FIRST ("0" to skip; default 1)
 *  HOOK_BRUTE_ROUNDS (default 64)
 *  HOOK_BRUTE_BYTES  (default 2)  // how many random bytes in hookData
 *  LPFEE_SCAN_BLOCKS (default 0)  // 0 = disabled (fast)
 */

// ──────────────────────────────────────────────────────────────────────────────
// Constants (Base)
// ──────────────────────────────────────────────────────────────────────────────
const V4_POOL_MANAGER = "0x498581fF718922c3f8e6A244956aF099B2652b2b"; // not used, kept for reference
const V4_POOL_AB_HOOK_ADDRESS = "0x5cd525c621AFCa515Bf58631D4733fbA7B72Aae4";
const STATE_VIEW_ADDRESS = "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71";
const V4_QUOTER_ADDRESS = "0x0d5e0f971ed27fbff6c2837bf31316121532048d";

const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const RPC_TIMEOUT_MS = Number(process.env.RPC_TIMEOUT_MS ?? "4000");
const QUOTE_CONCURRENCY = Number(process.env.QUOTE_CONCURRENCY ?? "8");

const ENABLE_TICK_PROBE = process.env.ENABLE_TICK_PROBE === "0" ? false : true;
const HOOK_STRUCTURED_FIRST = process.env.HOOK_STRUCTURED_FIRST === "0" ? false : true;
const HOOK_BRUTE_ROUNDS = Number(process.env.HOOK_BRUTE_ROUNDS ?? "64");
const HOOK_BRUTE_BYTES = Number(process.env.HOOK_BRUTE_BYTES ?? "2");
const LPFEE_SCAN_BLOCKS = Number(process.env.LPFEE_SCAN_BLOCKS ?? "0"); // keep 0 for speed

const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);

// Minimal ABIs (we fetch the Quoter ABI live)
const stateViewABI = [
  "function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)",
  "function getLiquidity(bytes32 poolId) view returns (uint128)"
];
const stateView = new ethers.Contract(STATE_VIEW_ADDRESS, stateViewABI, provider);

const slot0Interface = new ethers.Interface([
  "function getSlot0(bytes32) view returns (uint160 sqrtPriceX96, int24 tick, uint16 protocolFee, uint16 lpFee)",
]);
const liquidityInterface = new ethers.Interface([
  "function getLiquidity(bytes32 poolId) view returns (uint128)",
]);
const tickBitmapInterface = new ethers.Interface([
  "function getTickBitmap(bytes32 poolId, int16 wordPosition) view returns (uint256)",
]);

// Pools to test
const V4_POOL_IDS = [
  {
    label: "V4 A (0.3%)",
    poolId: "0x64f978ef116d3c2e1231cfd8b80a369dcd8e91b28037c9973b65b59fd2cbbb96",
    hooks: ethers.getAddress(V4_POOL_AB_HOOK_ADDRESS),
    tickSpacing: 200,
    fee: 3000,
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Small helpers
// ──────────────────────────────────────────────────────────────────────────────
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

function decodeSqrtPriceX96ToFloat(sqrtPriceX96, decimalsToken0 = 8, decimalsToken1 = 6) {
  const Q96 = 2n ** 96n;
  const sqrt = BigInt(sqrtPriceX96);
  const raw = Number((sqrt * sqrt) / (Q96 * Q96));
  return (1 / raw) * 10 ** (decimalsToken0 - decimalsToken1);
}

function decodeLiquidityAmountsv4(liquidity, sqrtPriceX96) {
  const sqrtPrice = Number(sqrtPriceX96) / 2 ** 96;
  const L = Number(liquidity);
  return {
    cbBTC: (L * sqrtPrice) / 1e8,
    usdc: (L / sqrtPrice) / 1e6,
  };
}

// RPC call with timeout
function withTimeout(p, ms, label = "rpc") {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${label} after ${ms}ms`)), ms)),
  ]);
}
function rpcCall(tx, blockTag) {
  return withTimeout(provider.call(tx, blockTag), RPC_TIMEOUT_MS, "provider.call");
}

// Simple p-map with concurrency
async function pMap(arr, mapper, concurrency = QUOTE_CONCURRENCY) {
  const results = new Array(arr.length);
  let i = 0;
  const workers = Array(Math.min(concurrency, arr.length))
    .fill(0)
    .map(async () => {
      while (true) {
        const idx = i++;
        if (idx >= arr.length) break;
        try { results[idx] = await mapper(arr[idx], idx); }
        catch { results[idx] = undefined; }
      }
    });
  await Promise.all(workers);
  return results;
}

// ──────────────────────────────────────────────────────────────────────────────
// On-chain views (via StateView)
// ──────────────────────────────────────────────────────────────────────────────
async function getTickBitmap(poolId, wordPosition) {
  const data = tickBitmapInterface.encodeFunctionData("getTickBitmap", [poolId, wordPosition]);
  const result = await rpcCall({ to: STATE_VIEW_ADDRESS, data });
  return tickBitmapInterface.decodeFunctionResult("getTickBitmap", result)[0];
}
async function getSlot0FromStateView(poolId) {
  const data = slot0Interface.encodeFunctionData("getSlot0", [poolId]);
  const result = await rpcCall({ to: STATE_VIEW_ADDRESS, data });
  return slot0Interface.decodeFunctionResult("getSlot0", result);
}
async function getLiquidity(poolId) {
  const data = liquidityInterface.encodeFunctionData("getLiquidity", [poolId]);
  const result = await rpcCall({ to: STATE_VIEW_ADDRESS, data });
  return liquidityInterface.decodeFunctionResult("getLiquidity", result)[0];
}

function getInitializedTicksFromBitmap(bitmap, wordPosition, tickSpacing) {
  const ticks = [];
  const binary = bitmap.toString(2).padStart(256, "0");
  for (let i = 0; i < 256; i++) {
    if (binary[255 - i] === "1") {
      const tick = (wordPosition * 256 + i) * tickSpacing;
      ticks.push(tick);
    }
  }
  return ticks;
}

// ──────────────────────────────────────────────────────────────────────────────
// Quoter wiring
// ──────────────────────────────────────────────────────────────────────────────
async function fetchABI(address) {
  const apiKey = process.env.BASESCAN_API_KEY;
  const url = `https://api.basescan.org/api?module=contract&action=getabi&address=${address}&apikey=${apiKey}`;
  const response = await axios.get(url);
  if (response.data.status !== "1") throw new Error("Failed to fetch ABI from BaseScan");
  const abi = JSON.parse(response.data.result);
  const frag = abi.find((e) => e.name === "quoteExactInputSingle" && e.type === "function");
  console.log("🔍 quoteExactInputSingle ABI fragment:", frag);
  return abi;
}
async function buildQuoterInterface() {
  const quoterABI = await fetchABI(V4_QUOTER_ADDRESS);
  return new ethers.Interface(quoterABI);
}

async function quoteV4({ quoteIface, poolKey, zeroForOne, exactAmount, sqrtPriceLimitX96, hookData = "0x", callFrom }) {
  const calldata = quoteIface.encodeFunctionData("quoteExactInputSingle", [{
    poolKey: {
      currency0: poolKey.currency0,
      currency1: poolKey.currency1,
      fee: BigInt(poolKey.fee),
      tickSpacing: BigInt(poolKey.tickSpacing),
      hooks: poolKey.hooks,
    },
    zeroForOne,
    exactAmount: BigInt(exactAmount),
    sqrtPriceLimitX96: BigInt(sqrtPriceLimitX96 ?? 0n),
    hookData,
  }]);

  const raw = await rpcCall({ to: V4_QUOTER_ADDRESS, data: calldata, ...(callFrom ? { from: callFrom } : {}) });
  const [amountOut, gasEstimate] = quoteIface.decodeFunctionResult("quoteExactInputSingle", raw);
  return { amountOut, gasEstimate };
}

// ──────────────────────────────────────────────────────────────────────────────
// Fast heuristics to find fee-free-looking quotes
// ──────────────────────────────────────────────────────────────────────────────
function* structuredHookData({ user, poolId, amountInCBBTC }) {
  yield "0x";                 // baseline
  yield "0x00"; yield "0x01"; yield "0xff";
  yield "0x" + "0".repeat(24) + user.toLowerCase().replace(/^0x/, "");
  yield poolId;
  yield "0x" + BigInt(amountInCBBTC).toString(16).padStart(64, "0");
}

function nearZeroFeeHit({ baselineOut, candidateOut, lpFeePpm, tolerancePpm = 50n }) {
  // If lpFee were fully waived, rough target ~ baselineOut / (1 - lpFee)
  // (ignores price impact diffs, but good enough to early-stop)
  const scaled = (BigInt(baselineOut) * 1_000_000n) / (1_000_000n - BigInt(lpFeePpm));
  const minHit = (scaled * (1_000_000n - tolerancePpm)) / 1_000_000n; // allow a tiny slop
  return BigInt(candidateOut) >= minHit;
}

async function quickParallelQuotes({ quoteIface, items, mapper }) {
  return pMap(items, mapper, QUOTE_CONCURRENCY);
}

async function tryStructuredHookData({ quoteIface, poolKey, zeroForOne, amountInCBBTC, sqrtPriceLimitX96, callFrom, baselineOut, lpFeePpm }) {
  const items = Array.from(structuredHookData({ user: userWallet.address, poolId: computePoolId(poolKey), amountInCBBTC }));
  let best = null;

  await quickParallelQuotes({
    quoteIface,
    items,
    mapper: async (hookData) => {
      try {
        const r = await quoteV4({ quoteIface, poolKey, zeroForOne, exactAmount: amountInCBBTC, sqrtPriceLimitX96, hookData, callFrom });
        const out = r.amountOut; // BigInt
        if (!best || out > best.amountOut) {
          best = { hookData, ...r };
          if (nearZeroFeeHit({ baselineOut, candidateOut: out, lpFeePpm: lpFeePpm })) return "HIT"; // signal early
        }
      } catch {}
    }
  });

  return best;
}

async function tryBruteHookData({ quoteIface, poolKey, zeroForOne, amountInCBBTC, sqrtPriceLimitX96, callFrom, rounds = HOOK_BRUTE_ROUNDS, bytes = HOOK_BRUTE_BYTES, baselineOut, lpFeePpm }) {
  const payloads = Array.from({ length: rounds }, () => "0x" + crypto.randomBytes(bytes).toString("hex"));
  let best = null;

  await quickParallelQuotes({
    quoteIface,
    items: payloads,
    mapper: async (hookData, i) => {
      try {
        const r = await quoteV4({ quoteIface, poolKey, zeroForOne, exactAmount: amountInCBBTC, sqrtPriceLimitX96, hookData, callFrom });
        const out = r.amountOut;
        if (!best || out > best.amountOut) {
          best = { hookData, ...r };
          if (nearZeroFeeHit({ baselineOut, candidateOut: out, lpFeePpm })) return "HIT";
        }
      } catch {}
    }
  });

  return best;
}

// Optional: tiny tick-limit probe (very small set, parallelized)
async function tinyTickProbe({ poolId, poolKey, zeroForOne, amountInCBBTC }) {
  const quoteIface = await buildQuoterInterface();
  const [sqrtP, tick] = await getSlot0FromStateView(poolId);
  const tickSpacing = Number(poolKey.tickSpacing);
  const baseTick = Math.floor(Number(tick) / tickSpacing) * tickSpacing;

  const wordOf = (t) => Math.floor(t / tickSpacing / 256);
  const baseWord = wordOf(baseTick);

  const probeWords = [baseWord - 2, baseWord - 1, baseWord, baseWord + 1, baseWord + 2];
  const bitmaps = await pMap(probeWords, (w) => getTickBitmap(poolId, w));

  const initTicks = [];
  bitmaps.forEach((bm, i) => {
    if (bm) initTicks.push(...getInitializedTicksFromBitmap(bm, probeWords[i], tickSpacing));
  });
  const candidatesTicks = initTicks
    .filter((t) => (zeroForOne ? t < baseTick : t > baseTick))
    .sort((a, b) => Math.abs(a - baseTick) - Math.abs(b - baseTick))
    .slice(0, 8); // only the closest 8

  const limitTicks = [];
  for (const t of candidatesTicks) {
    if (zeroForOne) { limitTicks.push(t - 1, t - (tickSpacing - 1)); }
    else { limitTicks.push(t + 1, t + (tickSpacing - 1)); }
  }

  const results = await pMap(limitTicks, async (limitTick) => {
    try {
      const sqrtLimit = BigInt(TickMath.getSqrtRatioAtTick(limitTick).toString());
      if (zeroForOne && sqrtLimit >= BigInt(sqrtP)) return null;
      if (!zeroForOne && sqrtLimit <= BigInt(sqrtP)) return null;
      const { amountOut } = await quoteV4({ quoteIface, poolKey, zeroForOne, exactAmount: amountInCBBTC, sqrtPriceLimitX96: sqrtLimit, hookData: "0x" });
      return { limitTick, sqrtLimit, amountOut };
    } catch { return null; }
  }, 6);

  const viable = results.filter(Boolean).sort((a, b) => (a.amountOut > b.amountOut ? -1 : 1));
  if (!viable.length) return null;
  const best = viable[0];
  console.log(`🧭 Tick-probe picked tick=${best.limitTick} (sqrtLimit=${best.sqrtLimit})`);
  return best.sqrtLimit;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main simulation
// ──────────────────────────────────────────────────────────────────────────────
async function simulateWithV4QuoterPoolA(poolKey, poolId, amountInCBBTC, sqrtPriceLimitX96 = 0n) {
  console.log(`✅ Using userWallet for Pool A quote simulation`);

  // Balance (sanity)
  const erc20ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
  ];
  const cbBtcContract = new ethers.Contract(CBBTC, erc20ABI, provider);
  const balance = await cbBtcContract.balanceOf(userWallet.address);
  console.log(`💰 CBBTC Balance: ${ethers.formatUnits(balance, 8)} CBBTC`);

  // Canonical pool id
  const canonicalPoolId = computePoolId({
    currency0: ethers.getAddress(poolKey.currency0),
    currency1: ethers.getAddress(poolKey.currency1),
    fee: BigInt(poolKey.fee),
    tickSpacing: BigInt(poolKey.tickSpacing),
    hooks: ethers.getAddress(poolKey.hooks),
  });
  if (canonicalPoolId.toLowerCase() !== poolId.toLowerCase()) {
    console.warn("⚠️ poolId mismatch! manual vs computed");
    console.warn("   manual   :", poolId);
    console.warn("   computed :", canonicalPoolId);
  } else {
    console.log("✅ poolId matches:", canonicalPoolId);
  }
  const targetPoolId = canonicalPoolId;

  // Optional fee window scan (default off)
  if (LPFEE_SCAN_BLOCKS > 0) {
    console.log(`🔎 (slow) scanning last ${LPFEE_SCAN_BLOCKS} blocks for lpFee==0 is DISCOURAGED here`);
  }

  // Slot0 + fees
  const [currentSqrtPriceX96, , protocolFee, lpFee] = await stateView.getSlot0(targetPoolId);
  sqrtPriceLimitX96 = currentSqrtPriceX96;
  console.log(`📈 Current sqrtPriceX96: ${currentSqrtPriceX96.toString()}`);
  console.log(`🧾 Fees (ppm): lpFee=${Number(lpFee)} protocolFee=${Number(protocolFee)}`);

  // Optional: tiny tick limit probe to avoid obviously bad limits
  let effectiveLimit = sqrtPriceLimitX96;
  if (ENABLE_TICK_PROBE) {
    const zeroForOne = poolKey.currency0.toLowerCase() === CBBTC.toLowerCase();
    const probe = await tinyTickProbe({ poolId: targetPoolId, poolKey, zeroForOne, amountInCBBTC });
    if (probe) effectiveLimit = probe;
  }

  // Build quoter iface
  const quoteIface = await buildQuoterInterface();

  // Direction & params
  const zeroForOne = poolKey.currency0.toLowerCase() === CBBTC.toLowerCase();
  const parsedAmount = BigInt(amountInCBBTC);

  // Baseline (hookData=0x) — do this ONCE
  const baseline = await quoteV4({ quoteIface, poolKey, zeroForOne, exactAmount: parsedAmount, sqrtPriceLimitX96: effectiveLimit, hookData: "0x", callFrom: userWallet.address });
  console.log(`🔭 Baseline → ${ethers.formatUnits(baseline.amountOut, 6)} USDC (gas=${baseline.gasEstimate})`);

  // Structured tiny set first (parallel)
  let best = { ...baseline, hookData: "0x" };
  if (HOOK_STRUCTURED_FIRST) {
    const structured = await tryStructuredHookData({ quoteIface, poolKey, zeroForOne, amountInCBBTC: parsedAmount, sqrtPriceLimitX96: effectiveLimit, callFrom: userWallet.address, baselineOut: baseline.amountOut, lpFeePpm: lpFee });
    if (structured && structured.amountOut > best.amountOut) {
      best = { ...structured, hookData: structured.hookData };
      console.log(`🎯 Structured best → ${ethers.formatUnits(best.amountOut, 6)} USDC (hook=${best.hookData.slice(0,10)}…)`);
    }
  }

  // If not near-zero-fee yet, do a small brute (parallel)
  const hitZeroish = nearZeroFeeHit({ baselineOut: baseline.amountOut, candidateOut: best.amountOut, lpFeePpm: lpFee, tolerancePpm: 50n });
  if (!hitZeroish && HOOK_BRUTE_ROUNDS > 0) {
    const brute = await tryBruteHookData({ quoteIface, poolKey, zeroForOne, amountInCBBTC: parsedAmount, sqrtPriceLimitX96: effectiveLimit, callFrom: userWallet.address, rounds: HOOK_BRUTE_ROUNDS, bytes: HOOK_BRUTE_BYTES, baselineOut: baseline.amountOut, lpFeePpm: lpFee });
    if (brute && brute.amountOut > best.amountOut) {
      best = { ...brute, hookData: brute.hookData };
      console.log(`🥊 Brute best → ${ethers.formatUnits(best.amountOut, 6)} USDC (hook=${best.hookData.slice(0,10)}…)`);
    }
  }

  // Final reporting
  console.log(`→ Chosen amountOut: ${ethers.formatUnits(best.amountOut, 6)} USDC`);
  console.log(`⛽ Gas estimate (units): ${best.gasEstimate.toString()}`);
  console.log(`🔖 hookData used: ${best.hookData ?? "0x"}`);

  // Reserves snapshot (for context)
  try {
    console.log(`🆔 Pool ID (computed): ${targetPoolId}`);
    const [sqrtPriceX96] = await stateView.getSlot0(targetPoolId);
    const liquidity = await stateView.getLiquidity(targetPoolId);
    const price = decodeSqrtPriceX96ToFloat(sqrtPriceX96);
    const reserves = decodeLiquidityAmountsv4(liquidity, sqrtPriceX96);
    console.log(`📈 sqrtPriceX96: ${sqrtPriceX96}`);
    console.log(`💰 cbBTC/USDC Price: $${price.toFixed(2)}`);
    console.log(`📦 cbBTC Reserve: ${reserves.cbBTC.toFixed(6)} cbBTC`);
    console.log(`📦 USDC  Reserve: ${reserves.usdc.toFixed(2)} USDC`);
  } catch {}
}

// ──────────────────────────────────────────────────────────────────────────────
// Entrypoint
// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  // NOTE: we quote 1 cbBTC by default; change here if you want
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

    const L = await getLiquidity(pool.poolId);
    if (L === 0n) {
      console.log(`🚫 Skipping ${pool.label} — pool has zero global liquidity.`);
      continue;
    }

    await simulateWithV4QuoterPoolA(poolKey, pool.poolId, amountInCBBTC, 0n);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

// Run with: yarn hardhat run test/cbbtc_mass_test.js --network base
