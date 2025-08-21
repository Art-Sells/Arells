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

async function fetchQuoterABI(address) {
  const url  = `https://api.basescan.org/api?module=contract&action=getabi&address=${address}&apikey=${process.env.BASESCAN_API_KEY}`;
  const resp = await axios.get(url);
  if (resp.data.status !== "1") throw new Error("Failed to fetch Quoter ABI from BaseScan");
  const abi  = JSON.parse(resp.data.result);
  const frag = abi.find((e) => e.name === "quoteExactInputSingle" && e.type === "function");
  console.log("🔍 quoteExactInputSingle ABI fragment:", frag);
  return new ethers.Interface(abi);
}

// YOUR decoder (left exactly as requested)
function decodeSqrtPriceX96ToFloat(sqrtPriceX96, decimalsToken0 = 8, decimalsToken1 = 6) {
  const Q96 = BigInt(2) ** BigInt(96);
  const sqrt = BigInt(sqrtPriceX96);
  const rawPrice = Number(sqrt * sqrt) / Number(Q96 * Q96);
  return (1 / rawPrice) * 10 ** (decimalsToken0 - decimalsToken1);
}

// Choose a limit INSIDE the current tick so we don't cross a boundary
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

async function quoteV4({ quoteIface, poolKey, zeroForOne, exactAmount, sqrtPriceLimitX96, hookData = "0x" }) {
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
    hookData,
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

  // slot0 → get current tick & lpFee
  const [sqrtP, tick, , lpFeePpm] = await stateView.getSlot0(POOL.poolId);
  console.log(`📈 Current sqrtPriceX96: ${sqrtP}`);
  console.log(`🧾 lpFee (ppm): ${Number(lpFeePpm)}`);

  // derive limit **inside** current tick
  const zeroForOne = poolKey.currency0.toLowerCase() === CBBTC.toLowerCase(); // false for cbBTC→USDC here
  const sqrtLimit  = limitInsideCurrentTick({ tick, tickSpacing: poolKey.tickSpacing, zeroForOne });
  console.log(`🧭 Using in-tick sqrtPriceLimitX96=${sqrtLimit}`);

  // YOUR amount line (left intact so you can change it directly)
  let amountInCBBTC = ethers.parseUnits("1", 8);

  // quoter call (single step)
  const quoter = await fetchQuoterABI(V4_QUOTER_ADDRESS);
  const out = await quoteV4({
    quoteIface: quoter,
    poolKey,
    zeroForOne,                   // cbBTC → USDC on this pool => false
    exactAmount: amountInCBBTC,   // use your amount directly
    sqrtPriceLimitX96: sqrtLimit, // stay within tick
    hookData: "0x",
  });

  // Compare to mid-price (expected no-fee output for this single call)
  const dec0 = token0.toLowerCase() === CBBTC.toLowerCase() ? 8 : 6;
  const dec1 = token1.toLowerCase() === CBBTC.toLowerCase() ? 8 : 6;
  const priceUSDCperCbBTC = decodeSqrtPriceX96ToFloat(sqrtP, dec1, dec0);

  const expOutNoFee = BigInt(
    Math.floor(Number(amountInCBBTC) * priceUSDCperCbBTC / 1e8 * 1e6) // cbBTC(8) -> USDC(6)
  );

  const diff = expOutNoFee > out ? (expOutNoFee - out) : 0n;
  const feePpmImplied = expOutNoFee === 0n ? 0n : (diff * 1_000_000n) / expOutNoFee;

  console.log(`→ Quoted out: ${ethers.formatUnits(out, 6)} USDC`);
  console.log(`→ Expected (no-fee, mid): ${ethers.formatUnits(expOutNoFee, 6)} USDC`);
  console.log(`≈ Implied fee: ${feePpmImplied.toString()} ppm`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

// Run: yarn hardhat run test/cbbtc_mass_test.js --network base