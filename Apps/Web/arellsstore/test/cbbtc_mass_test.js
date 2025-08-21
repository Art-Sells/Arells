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

// Pick a limit **inside** the current tick so we never cross a boundary
function limitInsideCurrentTick({ tick, tickSpacing, zeroForOne }) {
  const baseTick = Math.floor(Number(tick) / tickSpacing) * tickSpacing;
  let limitTick;
  if (zeroForOne) {
    // token0→token1 (price down): keep above the lower boundary
    limitTick = baseTick + 1;
  } else {
    // token1→token0 (price up): keep below the upper boundary
    limitTick = baseTick + (tickSpacing - 1);
  }
  return BigInt(TickMath.getSqrtRatioAtTick(limitTick).toString());
}

// Limit just beyond the next boundary (to force a cross)
function limitBeyondNextBoundary({ tick, tickSpacing, zeroForOne }) {
  const baseTick = Math.floor(Number(tick) / tickSpacing) * tickSpacing;
  let targetTick;
  if (zeroForOne) {
    // For token0->token1 (price down), push to just **below** the lower boundary
    targetTick = baseTick - tickSpacing + 1;
  } else {
    // For token1->token0 (price up), push to just **above** the upper boundary
    targetTick = baseTick + tickSpacing + (tickSpacing - 1);
  }
  return BigInt(TickMath.getSqrtRatioAtTick(targetTick).toString());
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
  const [amountOut, gasEstimate] = quoteIface.decodeFunctionResult("quoteExactInputSingle", raw);
  return { amountOut, gasEstimate }; // amountOut in tokenOut decimals (USDC=6)
}

// Amount of token1 (cbBTC) required to move from sqrtP to upper boundary sqrtU (oneForZero)
// dy = ceil( L * (sqrtU - sqrtP) / Q96 )
function dyToUpperBoundary({ L, sqrtP, sqrtU }) {
  const Q96 = 2n ** 96n;
  const num = (BigInt(L) * (BigInt(sqrtU) - BigInt(sqrtP)));
  return (num + Q96 - 1n) / Q96; // ceil
}

// Amount of token0 required to move from sqrtP to lower boundary for zeroForOne (not used here)
function dxToLowerBoundary({ L, sqrtP, sqrtL }) {
  // dx = ceil( L * ( (sqrtP - sqrtL) / (sqrtP * sqrtL) ) * Q96 )
  const Q96 = 2n ** 96n;
  const sP = BigInt(sqrtP);
  const sL = BigInt(sqrtL);
  const num = BigInt(L) * (sP - sL) * Q96;
  const den = sP * sL;
  return (num + den - 1n) / den;
}

// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  // Fix token order (token0 = min address)
  const token0 = CBBTC.toLowerCase() < USDC.toLowerCase() ? CBBTC : USDC;
  const token1 = CBBTC.toLowerCase() < USDC.toLowerCase() ? USDC  : CBBTC;

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

  // slot0 + active liquidity
  const [sqrtP, tick, , lpFeePpm] = await stateView.getSlot0(POOL.poolId);
  const Lactive = await stateView.getLiquidity(POOL.poolId);

  console.log(`📈 Current sqrtPriceX96: ${sqrtP}`);
  console.log(`🧾 lpFee (ppm): ${Number(lpFeePpm)}`);
  console.log(`💧 Active Liquidity: ${Lactive.toString()}`);

  // Swap direction on this pair:
  // cbBTC→USDC is token1 -> token0 => zeroForOne = false when token0=USDC, token1=cbBTC
  const zeroForOne = poolKey.currency0.toLowerCase() === CBBTC.toLowerCase(); // false here

  // Boundaries of current tick
  const baseTick  = Math.floor(Number(tick) / POOL.tickSpacing) * POOL.tickSpacing;
  const lowerTick = baseTick;
  const upperTick = baseTick + POOL.tickSpacing;

  const sqrtLower = BigInt(TickMath.getSqrtRatioAtTick(lowerTick).toString());
  const sqrtUpper = BigInt(TickMath.getSqrtRatioAtTick(upperTick).toString());

  console.log(`🪵 Tick range: [${lowerTick}, ${upperTick})`);
  console.log(`  sqrt(lower)=${sqrtLower}`);
  console.log(`  sqrt(upper)=${sqrtUpper}`);

  // Limits for the two experiments
  const sqrtLimitInTick   = limitInsideCurrentTick({ tick, tickSpacing: POOL.tickSpacing, zeroForOne });
  const sqrtLimitCrossing = limitBeyondNextBoundary({ tick, tickSpacing: POOL.tickSpacing, zeroForOne });
  console.log(`🧭 In-tick  limit:  ${sqrtLimitInTick}`);
  console.log(`🧭 Cross-tick limit: ${sqrtLimitCrossing}`);

  // Amount of cbBTC required to reach the **upper** boundary (since zeroForOne=false)
  const needToUpper = dyToUpperBoundary({ L: Lactive, sqrtP, sqrtU: sqrtUpper });
  console.log(`📌 cbBTC needed to hit upper boundary (≈cross): ${needToUpper.toString()} sats = ${ethers.formatUnits(needToUpper, 8)} cbBTC`);

  // YOUR amount line (kept intact so you can change it freely)
  let amountInCBBTC = ethers.parseUnits("1", 8);

  // Build quoter iface
  const quoter = await fetchQuoterIface(V4_QUOTER_ADDRESS);

  // 1) In-tick quote (no crossing): use min(amount, needToUpper-1) and in-tick limit
  const amtInNoCross = needToUpper > 0n ? (amountInCBBTC < needToUpper ? amountInCBBTC : (needToUpper - 1n)) : amountInCBBTC;
  const { amountOut: outInTick } = await quoteV4({
    quoteIface: quoter,
    poolKey,
    zeroForOne,                   // false (cbBTC → USDC)
    exactAmount: amtInNoCross,
    sqrtPriceLimitX96: sqrtLimitInTick,
  });

  // 2) Cross-tick quote: use max(amount, needToUpper+1) and a limit beyond boundary
  const oneSat = 1n;
  const amtInCross = amountInCBBTC > (needToUpper + oneSat) ? amountInCBBTC : (needToUpper + oneSat);
  const { amountOut: outCross } = await quoteV4({
    quoteIface: quoter,
    poolKey,
    zeroForOne,                   // false (cbBTC → USDC)
    exactAmount: amtInCross,
    sqrtPriceLimitX96: sqrtLimitCrossing,
  });

  // Mid-price helper (for rough expectation)
  const dec0 = token0.toLowerCase() === CBBTC.toLowerCase() ? 8 : 6;
  const dec1 = token1.toLowerCase() === CBBTC.toLowerCase() ? 8 : 6;
  const midUSDCperCbBTC = decodeSqrtPriceX96ToFloat(sqrtP, 8, 6);

const expInTickNoFee = BigInt(Math.floor(Number(amtInNoCross) * midUSDCperCbBTC / 100));
const expCrossNoFee  = BigInt(Math.floor(Number(amtInCross)   * midUSDCperCbBTC / 100));

  const feeInTick  = expInTickNoFee > outInTick ? (expInTickNoFee - outInTick) : 0n;
  const feeCross   = expCrossNoFee  > outCross  ? (expCrossNoFee  - outCross)  : 0n;

  const ppm = (exp, fee) => (exp === 0n ? 0n : (fee * 1_000_000n) / exp);

  console.log("\n──────── Slot-by-slot Fee Readout ────────");
  console.log(`In-tick  swap (no crossing):`);
  console.log(`  amountIn  = ${ethers.formatUnits(amtInNoCross, 8)} cbBTC`);
  console.log(`  amountOut = ${ethers.formatUnits(outInTick, 6)} USDC`);
  console.log(`  mid(no-fee est) = ${ethers.formatUnits(expInTickNoFee, 6)} USDC`);
  console.log(`  implied fee ≈ ${ethers.formatUnits(feeInTick, 6)} USDC (${ppm(expInTickNoFee, feeInTick).toString()} ppm)`);

  console.log(`\nCross-tick swap (forces crossing):`);
  console.log(`  amountIn  = ${ethers.formatUnits(amtInCross, 8)} cbBTC`);
  console.log(`  amountOut = ${ethers.formatUnits(outCross, 6)} USDC`);
  console.log(`  mid(no-fee est) = ${ethers.formatUnits(expCrossNoFee, 6)} USDC`);
  console.log(`  implied fee ≈ ${ethers.formatUnits(feeCross, 6)} USDC (${ppm(expCrossNoFee, feeCross).toString()} ppm)`);

  console.log("\nΔ When forcing a cross (vs in-tick):");
  const effRateInTick  = Number(outInTick) / Number(amtInNoCross === 0n ? 1n : amtInNoCross);
  const effRateCross   = Number(outCross)  / Number(amtInCross  === 0n ? 1n : amtInCross);
  console.log(`  effective USDC per sat (in-tick):  ${effRateInTick}`);
  console.log(`  effective USDC per sat (crossing): ${effRateCross}`);
  console.log("  (Crossing usually shows more fee taken due to how V4 applies fees without the V3 step-flooring behavior.)");
  // Put this right after computing: outInTick, expInTickNoFee
  const PASS_PPM = 5n; // treat ≤5 ppm as "fee-free" for practical purposes
  const feeInTickPpm = expInTickNoFee === 0n ? 0n : ((expInTickNoFee - outInTick > 0n ? expInTickNoFee - outInTick : 0n) * 1_000_000n) / expInTickNoFee;

  if (feeInTickPpm <= PASS_PPM) {
    console.log(`✅ FEE-FREE ROUTE (in-tick): ${feeInTickPpm.toString()} ppm`);
  } else {
    console.log(`❌ Not fee-free in-tick: ${feeInTickPpm.toString()} ppm`);
  }
}


main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

// Run: yarn hardhat run test/cbbtc_mass_test.js --network base