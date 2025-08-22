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

// Pool config (fixed for this test)
const POOL = {
  label: "V4 A (0.3%)",
  poolId: "0x64f978ef116d3c2e1231cfd8b80a369dcd8e91b28037c9973b65b59fd2cbbb96",
  hooks: "0x5cd525c621AFCa515Bf58631D4733fbA7B72Aae4", // not used here
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

// ── KEEP THIS LOGIC UNCHANGED (as requested)
function decodeSqrtPriceX96ToFloat(sqrtPriceX96, decimalsToken0 = 8, decimalsToken1 = 6) {
  const Q96 = BigInt(2) ** BigInt(96);
  const sqrt = BigInt(sqrtPriceX96);
  const rawPrice = Number(sqrt * sqrt) / Number(Q96 * Q96);
  return (1 / rawPrice) * 10 ** (decimalsToken0 - decimalsToken1);
}

async function quoteV4({ quoteIface, poolKey, zeroForOne, exactAmount, sqrtPriceLimitX96 }) {
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
  const [amountOut] = quoteIface.decodeFunctionResult("quoteExactInputSingle", raw);
  return amountOut; // BigInt (USDC 6dp)
}

// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  // Token order (token0 = min address)
  const token0 = CBBTC.toLowerCase() < USDC.toLowerCase() ? CBBTC : USDC; // => USDC is token0 here
  const token1 = CBBTC.toLowerCase() < USDC.toLowerCase() ? USDC  : CBBTC; // => cbBTC is token1 here

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
  const [sqrtP, , , lpFeePpm] = await stateView.getSlot0(POOL.poolId);
  console.log(`📈 Current sqrtPriceX96: ${sqrtP}`);
  console.log(`🧾 lpFee (ppm): ${Number(lpFeePpm)}`);

  // Direction: cbBTC→USDC is token1 -> token0 => zeroForOne = false
  const zeroForOne = poolKey.currency0.toLowerCase() === CBBTC.toLowerCase(); // false here

  // ε-movement limit: set just beyond current price in the swap direction
  // (so price impact is ~zero, only fee behavior is observed)
  const sqrtLimitEps = zeroForOne ? (BigInt(sqrtP) - 1n) : (BigInt(sqrtP) + 1n);
  console.log(`🧭 Using ε-limit sqrtPriceX96=${sqrtLimitEps.toString()}`);

  // Build quoter
  const quoter = await fetchQuoterIface(V4_QUOTER_ADDRESS);

  // Helper: mid-price USDC per cbBTC (token0=USDC(6), token1=cbBTC(8))
  const midUSDCperCbBTC = decodeSqrtPriceX96ToFloat(sqrtP, 8, 6);

  const expectNoFeeUSDC = (amountInSats) => {
    // amountInSats (BigInt, cbBTC 8dp) → USDC 6dp via mid (negligible price impact)
    return BigInt(Math.floor(Number(amountInSats) * midUSDCperCbBTC / 1e8 * 1e6));
  };

  const ppm = (exp, out) => {
    if (exp === 0n) return "n/a";
    const fee = exp > out ? (exp - out) : 0n;
    return ((fee * 1_000_000n) / exp).toString();
  };

  // ── ε-test: probe a small fixed set of tiny inputs (not a full scan)
  const probeSats = [1n, 5n, 10n, 50n, 100n, 333n];

  console.log("\n──── Ultra-tight ε-movement test (cbBTC→USDC) ────");
  console.log("sats_in, usdc_out, mid_no_fee, fee_usdc, fee_ppm");

  for (const sats of probeSats) {
    const out = await quoteV4({
      quoteIface: quoter,
      poolKey,
      zeroForOne,                   // false (cbBTC → USDC)
      exactAmount: sats,
      sqrtPriceLimitX96: sqrtLimitEps,
    });
    const exp = expectNoFeeUSDC(sats);
    const fee = exp > out ? (exp - out) : 0n;
    console.log(
      [
        sats.toString(),
        ethers.formatUnits(out, 6),
        ethers.formatUnits(exp, 6),
        ethers.formatUnits(fee, 6),
        ppm(exp, out),
      ].join(",")
    );
  }

  // ── Your main amount (left EXACTLY as requested)
  let amountInCBBTC = ethers.parseUnits("1", 8);

  // Quote with ε-limit for your chosen amount
  const outMain = await quoteV4({
    quoteIface: quoter,
    poolKey,
    zeroForOne,                   // false (cbBTC → USDC)
    exactAmount: amountInCBBTC,
    sqrtPriceLimitX96: sqrtLimitEps,
  });
  const expMain = expectNoFeeUSDC(amountInCBBTC);
  const feeMain = expMain > outMain ? (expMain - outMain) : 0n;
  const ppmMain = ppm(expMain, outMain);

  console.log("\n──── Your amount (ε-limit) ────");
  console.log(`amountIn  = ${ethers.formatUnits(amountInCBBTC, 8)} cbBTC`);
  console.log(`amountOut = ${ethers.formatUnits(outMain, 6)} USDC`);
  console.log(`mid(no-fee) = ${ethers.formatUnits(expMain, 6)} USDC`);
  console.log(`implied fee ≈ ${ethers.formatUnits(feeMain, 6)} USDC (${ppmMain} ppm)`);

  // Verdict helper
  const PASS_PPM = 5n; // treat ≤5 ppm as "fee-free" pragmatically
  if (ppmMain !== "n/a" && BigInt(ppmMain) <= PASS_PPM) {
    console.log(`✅ ε-limit looks fee-free at your size (${ppmMain} ppm).`);
  } else {
    console.log(`❌ ε-limit still shows material fee at your size (${ppmMain} ppm).`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

// Run: yarn hardhat run test/cbbtc_mass_test.js --network base