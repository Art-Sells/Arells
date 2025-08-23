// test/cbbtc_mass_test.js
import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";

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

// Pool config (fixed for this test)
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
  const frag = abi.find((e) => e.name === "quoteExactInputSingle" && e.type === "function");
  console.log("🔍 quoteExactInputSingle ABI fragment:", frag);
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

// ε-limit (one unit in the favorable direction: ~zero price movement)
function epsilonLimit({ sqrtP, zeroForOne }) {
  return zeroForOne ? (BigInt(sqrtP) - 1n) : (BigInt(sqrtP) + 1n);
}

async function quoteExactInput({ quoteIface, poolKey, zeroForOne, exactAmount, sqrtPriceLimitX96 }) {
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
    sqrtPriceLimitX96: BigInt(sqrtPriceLimitX96),
    hookData: "0x",
  }]);

  const raw = await provider.call({
    to: V4_QUOTER_ADDRESS,
    data: calldata,
    from: userWallet.address
  });
  const [amountOut, gasEstimate] = quoteIface.decodeFunctionResult("quoteExactInputSingle", raw);
  return { amountOut, gasEstimate };
}

// Candidate generator around a base amount (targets USDC micro-unit boundaries)
function* boundaryCandidates({ baseSats, midUSDCperCbBTC, spreadMicro = 200 }) {
  const baseMicro = BigInt(Math.floor(Number(baseSats) * midUSDCperCbBTC / 100));
  const mid = midUSDCperCbBTC; // Number
  const lo = baseMicro - BigInt(spreadMicro);
  const hi = baseMicro + BigInt(spreadMicro);
  const seen = new Set();
  for (let m = lo; m <= hi; m++) {
    const sats = BigInt(Math.ceil(Number(m) * 100 / mid));
    if (sats <= 0n) continue;
    const key = sats.toString();
    if (!seen.has(key)) {
      seen.add(key);
      yield sats;
    }
  }
}

// Pretty ppm
function ppm(exp, out) {
  if (exp === 0n) return "n/a";
  const fee = exp > out ? (exp - out) : 0n;
  return ((fee * 1_000_000n) / exp).toString();
}

// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  // Token order (token0 = min address)
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

  // Sanity: computed id should match
  const computedId = computePoolId(poolKey);
  console.log(
    computedId.toLowerCase() === POOL.poolId.toLowerCase()
      ? `✅ poolId matches: ${computedId}`
      : `⚠️ poolId mismatch! ${computedId}`
  );

  // slot0: current price + fees
  const [sqrtP, , protocolFeePpm, lpFeePpm] = await stateView.getSlot0(POOL.poolId);
  console.log(`📈 Current sqrtPriceX96: ${sqrtP}`);
  console.log(`🧾 Fees (ppm): lpFee=${Number(lpFeePpm)} protocolFee=${Number(protocolFeePpm)}`);

  // Hook fee sanity (best-effort; depends on ABI)
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

  // Direction: cbBTC→USDC is token1 -> token0 => zeroForOne = false
  const zeroForOne = poolKey.currency0.toLowerCase() === CBBTC.toLowerCase(); // false here

  // ε-movement limit: ~no price impact
  const sqrtLimitEps = epsilonLimit({ sqrtP, zeroForOne });
  console.log(`🧭 Using ε-limit sqrtPriceX96=${sqrtLimitEps.toString()}`);

  // Build quoter
  const quoter = await fetchQuoterIface(V4_QUOTER_ADDRESS);

  const midUSDCperCbBTC = decodeSqrtPriceX96ToFloat(sqrtP, 6, 8);

  // Expected (no-fee) in USDC micro-units for sats: floor(sats * mid / 100)
  const expMicro = (sats) => BigInt(Math.floor(Number(sats) * midUSDCperCbBTC / 100));

  // ── YOUR AMOUNT LINE (kept exactly as requested)
  let amountInCBBTC = ethers.parseUnits("1", 8);

  // Baseline at ε-limit
  const { amountOut: outMain } = await quoteExactInput({
    quoteIface: quoter,
    poolKey,
    zeroForOne,
    exactAmount: amountInCBBTC,
    sqrtPriceLimitX96: sqrtLimitEps,
  });
  const expMainMicro = expMicro(amountInCBBTC);
  const feeMainMicro = expMainMicro > outMain ? (expMainMicro - outMain) : 0n;
  const ppmMain = ppm(expMainMicro, outMain);

  console.log("\n──── Baseline (ε-limit) ────");
  console.log(`amountIn  = ${ethers.formatUnits(amountInCBBTC, 8)} cbBTC`);
  console.log(`amountOut = ${ethers.formatUnits(outMain, 6)} USDC`);
  console.log(`mid(no-fee) = ${ethers.formatUnits(expMainMicro, 6)} USDC`);
  console.log(`implied fee ≈ ${ethers.formatUnits(feeMainMicro, 6)} USDC (${ppmMain} ppm)`);

  // ── Deterministic chunk-size optimizer (no brute)
  console.log("\n──── Chunk-size optimizer (ε-limit) ────");
  console.log("sats_in, usdc_out, mid_no_fee, fee_usdc, fee_ppm");

  const candidateSet = new Set();

  // 1) Boundary candidates around your *total* amount
  for (const s of boundaryCandidates({ baseSats: amountInCBBTC, midUSDCperCbBTC, spreadMicro: 200 })) {
    candidateSet.add(s.toString());
  }

  // 2) Also probe boundaries around small sat sizes (possible rounding sweet spots)
  const smallMicro = [1,2,3,5,8,13,21,34,55,89,144,233,377,610,987].map(n => BigInt(n));
  for (const m of smallMicro) {
    const s = BigInt(Math.ceil(Number(m) * 100 / midUSDCperCbBTC));
    if (s > 0n) candidateSet.add(s.toString());
  }

  // 3) Add a few evenly spaced small sat sizes
  for (let s = 1n; s <= 2000n; s += 199n) candidateSet.add(s.toString());

  const candidates = [...candidateSet].map(x => BigInt(x)).sort((a,b) => (a<b?-1:1)).slice(0, 300);

  const rows = [];
  for (const sats of candidates) {
    const { amountOut } = await quoteExactInput({
      quoteIface: quoter,
      poolKey,
      zeroForOne,
      exactAmount: sats,
      sqrtPriceLimitX96: sqrtLimitEps,
    });
    const exp = expMicro(sats);
    const fee = exp > amountOut ? (exp - amountOut) : 0n;
    const line = [
      sats.toString(),
      ethers.formatUnits(amountOut, 6),
      ethers.formatUnits(exp, 6),
      ethers.formatUnits(fee, 6),
      ppm(exp, amountOut),
    ];
    console.log(line.join(","));
    rows.push({ sats, out: amountOut, exp, fee, ppm: (exp === 0n ? 1_000_000_000n : ((exp - amountOut > 0n ? exp - amountOut : 0n) * 1_000_000n) / exp) });
  }

  // Pick the best chunk size (min ppm)
  rows.sort((a,b) => (a.ppm < b.ppm ? -1 : 1));
  const best = rows[0];
  console.log("\n🏁 Best chunk (by implied ppm):");
  console.log(`sats=${best.sats.toString()} → ppm≈${best.ppm.toString()} (${ethers.formatUnits(best.fee,6)} USDC fee on ${ethers.formatUnits(best.exp,6)} USDC mid)`);

  // Proposed split plan for your total amount
  const nChunks = amountInCBBTC / best.sats;
  const rem     = amountInCBBTC % best.sats;
  console.log(`\n📦 Proposed split for ${ethers.formatUnits(amountInCBBTC,8)} cbBTC:`);
  console.log(`• ${nChunks.toString()} chunks of ${ethers.formatUnits(best.sats,8)} cbBTC`);
  if (rem > 0n) console.log(`• 1 remainder chunk of ${ethers.formatUnits(rem,8)} cbBTC`);
  console.log("Note: This is a *theoretical* quoter plan; on-chain execution has gas costs.");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

// Run: yarn hardhat run test/cbbtc_mass_test.js --network base