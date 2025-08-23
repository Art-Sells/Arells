// test/cbbtc_mass_test.js
import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";
import { TickMath } from "@uniswap/v3-sdk";

dotenv.config();

// ──────────────────────────────────────────────────────────────────────────────
// Constants (Base)
// ──────────────────────────────────────────────────────────────────────────────
const STATE_VIEW_ADDRESS = "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71";
const V4_QUOTER_ADDRESS  = "0x0d5e0f971ed27fbff6c2837bf31316121532048d";

const USDC  = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

const provider   = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);

const ZERO32 = "0x" + "00".repeat(32);

// Pool meta (fixed)
const POOL = {
  label: "V4 A (0.3%)",
  poolId: "0x64f978ef116d3c2e1231cfd8b80a369dcd8e91b28037c9973b65b59fd2cbbb96",
  hooks: "0x5cd525c621AFCa515Bf58631D4733fbA7B72Aae4",
  tickSpacing: 200,
  fee: 3000,
};

// ──────────────────────────────────────────────────────────────────────────────
// Minimal ABIs / helpers
// ──────────────────────────────────────────────────────────────────────────────
const stateViewABI = [
  "function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)",
  "function getLiquidity(bytes32 poolId) view returns (uint128)"
];
const stateView = new ethers.Contract(STATE_VIEW_ADDRESS, stateViewABI, provider);

function computePoolId(poolKey) {
  const abi = ethers.AbiCoder.defaultAbiCoder();
  const enc = abi.encode(
    ["address","address","uint24","int24","address"],
    [poolKey.currency0, poolKey.currency1, poolKey.fee, poolKey.tickSpacing, poolKey.hooks]
  );
  return ethers.keccak256(enc);
}

async function fetchQuoterIface(address) {
  const url  = `https://api.basescan.org/api?module=contract&action=getabi&address=${address}&apikey=${process.env.BASESCAN_API_KEY}`;
  const resp = await axios.get(url);
  if (resp.data.status !== "1") throw new Error("Failed to fetch Quoter ABI from BaseScan");
  const abi  = JSON.parse(resp.data.result);
  // We’ll use both if present
  const fIn  = abi.find((e) => e.name === "quoteExactInputSingle"  && e.type === "function");
  const fOut = abi.find((e) => e.name === "quoteExactOutputSingle" && e.type === "function");
  console.log("🔍 quoteExactInputSingle ABI fragment:", fIn || "n/a");
  console.log("🔍 quoteExactOutputSingle ABI fragment:", fOut || "n/a");
  return new ethers.Interface(abi);
}

async function fetchHookIface(address) {
  try {
    const url  = `https://api.basescan.org/api?module=contract&action=getabi&address=${address}&apikey=${process.env.BASESCAN_API_KEY}`;
    const resp = await axios.get(url);
    if (resp.data.status !== "1") return null;
    const abi  = JSON.parse(resp.data.result);
    const f1 = abi.find(e => e.name === "hookFeesEnabled" && e.type === "function");
    const f2 = abi.find(e => e.name === "hookFees" && e.type === "function");
    const f3 = abi.find(e => e.name === "quoters" && e.type === "function");
    console.log("🔍 hookFeesEnabled ABI fragment:", f1 || "n/a");
    console.log("🔍 hookFees ABI fragment:", f2 || "n/a");
    console.log("🔍 quoters ABI fragment:", f3 || "n/a");
    return new ethers.Interface(abi);
  } catch {
    return null;
  }
}

// ── KEEP THIS LOGIC UNCHANGED (as requested)
function decodeSqrtPriceX96ToFloat(sqrtPriceX96, decimalsToken0 = 6, decimalsToken1 = 8) {
  const Q96 = BigInt(2) ** BigInt(96);
  const sqrt = BigInt(sqrtPriceX96);
  const rawPrice = Number(sqrt * sqrt) / Number(Q96 * Q96);
  return (1 / rawPrice) * 10 ** (decimalsToken1 - decimalsToken0);
}

// Limit: epsilon (one ULP in favorable direction)
function epsilonLimit({ sqrtP, zeroForOne }) {
  return zeroForOne ? (BigInt(sqrtP) - 1n) : (BigInt(sqrtP) + 1n);
}

// Exact-input (primary)
async function quoteExactInput({ iface, zeroForOne, poolKey, exactAmount, sqrtPriceLimitX96, hookData = "0x" }) {
  const calldata = iface.encodeFunctionData("quoteExactInputSingle", [{
    poolKey: {
      currency0: poolKey.currency0,
      currency1: poolKey.currency1,
      fee: BigInt(poolKey.fee),
      tickSpacing: BigInt(poolKey.tickSpacing),
      hooks: poolKey.hooks,
    },
    zeroForOne,
    exactAmount: BigInt(exactAmount),
    sqrtPriceLimitX96: BigInt(sqrtPriceLimitX96),
    hookData,
  }]);
  const raw = await provider.call({ to: V4_QUOTER_ADDRESS, data: calldata, from: userWallet.address });
  const [amountOut, gasEstimate] = iface.decodeFunctionResult("quoteExactInputSingle", raw);
  return { amountOut, gasEstimate };
}

// Exact-output (optional if ABI present)
async function quoteExactOutput({ iface, zeroForOne, poolKey, exactAmount, sqrtPriceLimitX96, hookData = "0x" }) {
  const fn = iface.getFunction("quoteExactOutputSingle");
  if (!fn) throw new Error("quoteExactOutputSingle not present in quoter");
  const calldata = iface.encodeFunctionData("quoteExactOutputSingle", [{
    poolKey: {
      currency0: poolKey.currency0,
      currency1: poolKey.currency1,
      fee: BigInt(poolKey.fee),
      tickSpacing: BigInt(poolKey.tickSpacing),
      hooks: poolKey.hooks,
    },
    zeroForOne,
    exactAmount: BigInt(exactAmount),
    sqrtPriceLimitX96: BigInt(sqrtPriceLimitX96),
    hookData,
  }]);
  const raw = await provider.call({ to: V4_QUOTER_ADDRESS, data: calldata, from: userWallet.address });
  const [amountIn, gasEstimate] = iface.decodeFunctionResult("quoteExactOutputSingle", raw);
  return { amountIn, gasEstimate };
}

// ppm helper on micro-USDC (USDC 6dp)
function ppm(exp, out) {
  if (exp === 0n) return "n/a";
  const fee = exp > out ? (exp - out) : 0n;
  return ((fee * 1_000_000n) / exp).toString();
}

// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  // Token order: FIXED as requested
  const token0 = USDC.toLowerCase();
  const token1 = CBBTC.toLowerCase();

  const poolKey = {
    currency0: token0,
    currency1: token1,
    fee: POOL.fee,
    tickSpacing: POOL.tickSpacing,
    hooks: POOL.hooks,
  };

  console.log(`\n🔎 ${POOL.label}`);
  console.log(`• Using manual poolId: ${POOL.poolId}`);

  // Sanity poolId
  const computedId = computePoolId(poolKey);
  console.log(computedId.toLowerCase() === POOL.poolId.toLowerCase()
    ? `✅ poolId matches: ${computedId}` : `⚠️ poolId mismatch! ${computedId}`);

  // slot0
  const [sqrtP, tick, protocolFeePpm, lpFeePpm] = await stateView.getSlot0(POOL.poolId);
  console.log(`📈 Current sqrtPriceX96: ${sqrtP}`);
  console.log(`🧾 Fees (ppm): lpFee=${Number(lpFeePpm)} protocolFee=${Number(protocolFeePpm)}`);

  // Hook fee sanity
  try {
    const hookIface = await fetchHookIface(POOL.hooks);
    if (hookIface) {
      const to = POOL.hooks;
      let enabled = "n/a", poolBips = "n/a", defaultBips = "n/a", quoterAllowed = "n/a";
      try {
        const data = hookIface.encodeFunctionData("hookFeesEnabled", [POOL.poolId]);
        const raw  = await provider.call({ to, data });
        [enabled]  = hookIface.decodeFunctionResult("hookFeesEnabled", raw);
      } catch {}
      try {
        const data = hookIface.encodeFunctionData("hookFees", [POOL.poolId]);
        const raw  = await provider.call({ to, data });
        const dec  = hookIface.decodeFunctionResult("hookFees", raw);
        poolBips   = Array.isArray(dec) ? dec[0].toString() : dec.toString();
      } catch {}
      try {
        const data = hookIface.encodeFunctionData("hookFees", [ZERO32]);
        const raw  = await provider.call({ to, data });
        const dec  = hookIface.decodeFunctionResult("hookFees", raw);
        defaultBips= Array.isArray(dec) ? dec[0].toString() : dec.toString();
      } catch {}
      try {
        const fn = hookIface.getFunction("quoters");
        if (fn) {
          const data = hookIface.encodeFunctionData("quoters", [V4_QUOTER_ADDRESS]);
          const raw  = await provider.call({ to, data });
          const [allowed] = hookIface.decodeFunctionResult("quoters", raw);
          quoterAllowed = allowed;
        }
      } catch {}
      console.log(`🪝 Hook meta → enabled=${enabled}, poolBips=${poolBips}, defaultBips=${defaultBips}, quoterAllowed=${quoterAllowed}`);
    } else {
      console.log("🪝 Hook meta → ABI unavailable (skipping).");
    }
  } catch {
    console.log("🪝 Hook meta → error fetching (skipping).");
  }

  // Direction: cbBTC→USDC (token1 -> token0) => zeroForOne = false
  const zeroForOne = false;

  // Tick bounds (to keep our limit inside the current tick)
  const baseTick  = Math.floor(Number(tick) / POOL.tickSpacing) * POOL.tickSpacing;
  const lowerTick = baseTick;
  const upperTick = baseTick + POOL.tickSpacing;
  const sqrtLower = BigInt(TickMath.getSqrtRatioAtTick(lowerTick).toString());
  const sqrtUpper = BigInt(TickMath.getSqrtRatioAtTick(upperTick).toString());

  // ε-limit
  const sqrtLimitEps = epsilonLimit({ sqrtP, zeroForOne });
  // Clamp ε to the tick (just in case)
  const sqrtLimitInTick = zeroForOne
    ? (sqrtLimitEps > sqrtLower ? sqrtLimitEps : (sqrtLower + 1n))
    : (sqrtLimitEps < sqrtUpper ? sqrtLimitEps : (sqrtUpper - 1n));

  console.log(`🧭 ε-limit (in-tick) sqrtPriceX96=${sqrtLimitInTick.toString()}`);

  // Build quoter
  const quoter = await fetchQuoterIface(V4_QUOTER_ADDRESS);
  const hasExactOut = (() => { try { quoter.getFunction("quoteExactOutputSingle"); return true; } catch { return false; } })();

  // Mid price: USDC per cbBTC (token0=USDC(6), token1=cbBTC(8))
  const midUSDCperCbBTC = decodeSqrtPriceX96ToFloat(sqrtP, 6, 8);
  const expMicro = (sats) => BigInt(Math.floor(Number(sats) * midUSDCperCbBTC / 100)); // USDC micro-units

  // ── YOUR AMOUNT LINE (kept exactly as requested)
  let amountInCBBTC = ethers.parseUnits("1", 8);

  // Baseline
  const { amountOut: outBaseline } = await quoteExactInput({
    iface: quoter,
    poolKey,
    zeroForOne,
    exactAmount: amountInCBBTC,
    sqrtPriceLimitX96: sqrtLimitInTick,
  });
  const expBaseline = expMicro(amountInCBBTC);
  const feeBaseline = expBaseline > outBaseline ? (expBaseline - outBaseline) : 0n;
  const ppmBaseline = ppm(expBaseline, outBaseline);

  console.log("\n──── Baseline (ε/in-tick) ────");
  console.log(`amountIn  = ${ethers.formatUnits(amountInCBBTC, 8)} cbBTC`);
  console.log(`amountOut = ${ethers.formatUnits(outBaseline, 6)} USDC`);
  console.log(`mid(no-fee) = ${ethers.formatUnits(expBaseline, 6)} USDC`);
  console.log(`implied fee ≈ ${ethers.formatUnits(feeBaseline, 6)} USDC (${ppmBaseline} ppm)`);

  // ────────────────────────────────────────────────────────────────────────────
  // 1) LIMIT MICRO-TILT SWEEP (inside the same tick, vary δ=1..N ULP)
  // ────────────────────────────────────────────────────────────────────────────
  console.log("\n──── Limit micro-tilt sweep (in-tick) ────");
  console.log("delta_ulp, usdc_out, mid_no_fee, fee_usdc, fee_ppm");

  const deltas = [1,2,3,5,8,13,21,34,55,89,144,233,377,610,987,1597].map(n => BigInt(n));
  const results = [];
  for (const d of deltas) {
    let limit = BigInt(sqrtP) + d;             // zeroForOne=false → price up
    if (limit >= sqrtUpper) limit = sqrtUpper - 1n; // keep in-tick
    const { amountOut } = await quoteExactInput({
      iface: quoter, poolKey, zeroForOne, exactAmount: amountInCBBTC, sqrtPriceLimitX96: limit,
    });
    const exp = expBaseline; // near-mid assumption at ε-style limits
    const fee = exp > amountOut ? (exp - amountOut) : 0n;
    const row = {
      d: d.toString(),
      out: amountOut,
      exp,
      fee,
      ppm: (exp === 0n ? 1_000_000_000n : ((exp - amountOut > 0n ? exp - amountOut : 0n) * 1_000_000n) / exp)
    };
    results.push(row);
    console.log(
      [
        d.toString(),
        ethers.formatUnits(amountOut, 6),
        ethers.formatUnits(exp, 6),
        ethers.formatUnits(fee, 6),
        (exp === 0n ? "n/a" : ((row.ppm).toString()))
      ].join(",")
    );
  }

  // pick best δ (min ppm)
  results.sort((a,b) => (a.ppm < b.ppm ? -1 : 1));
  const best = results[0];
  console.log("\n🏁 Best micro-tilt:");
  console.log(`δ=${best.d} ULP → ppm≈${best.ppm.toString()} (${ethers.formatUnits(best.fee,6)} USDC fee on ${ethers.formatUnits(best.exp,6)} USDC mid)`);

  // ────────────────────────────────────────────────────────────────────────────
  // 2) EXACT-OUTPUT ε-PROBE (if ABI present)
  // ────────────────────────────────────────────────────────────────────────────
  if (hasExactOut) {
    console.log("\n──── Exact-output ε-probe (if present) ────");
    console.log("usdc_micro_out, cbBTC_in, mid_no_fee_in, fee_cbBTC, fee_ppm_in_terms_of_mid");

    const outsMicro = [1,2,3,5,8,13,21,34,55,89,144,233,377,610,987].map(n => BigInt(n)); // tiny USDC micro outputs
    for (const mOut of outsMicro) {
      const sqrtLimit = sqrtLimitInTick; // keep ε/in-tick
      const { amountIn } = await quoteExactOutput({
        iface: quoter,
        poolKey,
        zeroForOne,                        // cbBTC -> USDC (exact-out asks: how many sats?)
        exactAmount: mOut,                 // USDC micro-units desired
        sqrtPriceLimitX96: sqrtLimit,
      });
      // Mid-no-fee input (sats): ceil( mOut * 100 / mid )
      const expInSats = BigInt(Math.ceil(Number(mOut) * 100 / midUSDCperCbBTC));
      const feeSats   = amountIn > expInSats ? (amountIn - expInSats) : 0n;
      const ppmIn     = (expInSats === 0n ? "n/a" : ((feeSats * 1_000_000n) / expInSats).toString());
      console.log(
        [
          mOut.toString(),
          ethers.formatUnits(amountIn, 8),
          ethers.formatUnits(expInSats, 8),
          ethers.formatUnits(feeSats, 8),
          ppmIn
        ].join(",")
      );
    }
  } else {
    console.log("\nℹ️ Quoter lacks quoteExactOutputSingle — skipping exact-output probe.");
  }

  console.log("\nℹ️ If any δ or exact-output target shows ppm ≪ fee tier, that’s a rounding ‘sweet spot’. Otherwise, fees are effectively proportional on this pool (no v3-style floor).");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

// Run: yarn hardhat run test/cbbtc_mass_test.js --network base