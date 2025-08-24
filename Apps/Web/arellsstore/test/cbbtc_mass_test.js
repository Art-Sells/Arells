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

// Known pool (we'll infer tickSpacing from poolId)
const POOL = {
  label: "V4 A (0.3%)",
  poolId: "0x64f978ef116d3c2e1231cfd8b80a369dcd8e91b28037c9973b65b59fd2cbbb96",
  hooks: "0x5cd525c621AFCa515Bf58631D4733fbA7B72Aae4",
  fee: 3000,
};

// ──────────────────────────────────────────────────────────────────────────────
// ABIs & helpers
// ──────────────────────────────────────────────────────────────────────────────
const stateViewABI = [
  "function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)",
  // (getLiquidity exists on this contract, but not required for this routine)
];
const stateView = new ethers.Contract(STATE_VIEW_ADDRESS, stateViewABI, provider);

async function fetchABI(contract) {
  const url = `https://api.basescan.org/api?module=contract&action=getabi&address=${contract}&apikey=${process.env.BASESCAN_API_KEY}`;
  const resp = await axios.get(url);
  if (resp.data.status !== "1") throw new Error(`Failed to fetch ABI for ${contract}`);
  return JSON.parse(resp.data.result);
}

function computePoolId(poolKey) {
  const abi = ethers.AbiCoder.defaultAbiCoder();
  const enc = abi.encode(
    ["address","address","uint24","int24","address"],
    [poolKey.currency0, poolKey.currency1, poolKey.fee, poolKey.tickSpacing, poolKey.hooks]
  );
  return ethers.keccak256(enc);
}

const TICK_SPACING_CANDIDATES = [1, 5, 10, 20, 40, 60, 100, 120, 200];
function inferTickSpacingFromPoolId({ token0, token1, fee, hooks, poolId }) {
  for (const ts of TICK_SPACING_CANDIDATES) {
    const id = computePoolId({ currency0: token0, currency1: token1, fee, tickSpacing: ts, hooks });
    if (id.toLowerCase() === poolId.toLowerCase()) return ts;
  }
  throw new Error("Could not infer tickSpacing from poolId.");
}

async function fetchQuoterIface(address) {
  const abi = await fetchABI(address);
  const frag = abi.find((e) => e.name === "quoteExactInputSingle" && e.type === "function");
  console.log("🔍 quoteExactInputSingle ABI fragment:", frag);
  return new ethers.Interface(abi);
}

// ── KEEP THIS LOGIC UNCHANGED (requested)
function decodeSqrtPriceX96ToFloat(sqrtPriceX96, decimalsToken0 = 6, decimalsToken1 = 8) {
  const Q96 = BigInt(2) ** BigInt(96);
  const sqrt = BigInt(sqrtPriceX96);
  const rawPrice = Number(sqrt * sqrt) / Number(Q96 * Q96);
  return (1 / rawPrice) * 10 ** (decimalsToken1 - decimalsToken0);
}

// V4 quoter call (exact-input single)
async function simulateWithQuoterV4({ poolKey, zeroForOne, amountIn, sqrtPriceLimitX96 }) {
  const iface = await fetchQuoterIface(V4_QUOTER_ADDRESS);
  const calldata = iface.encodeFunctionData("quoteExactInputSingle", [{
    poolKey: {
      currency0: poolKey.currency0,
      currency1: poolKey.currency1,
      fee: BigInt(poolKey.fee),
      tickSpacing: BigInt(poolKey.tickSpacing),
      hooks: poolKey.hooks,
    },
    zeroForOne,
    exactAmount: BigInt(amountIn),
    sqrtPriceLimitX96: BigInt(sqrtPriceLimitX96),
    hookData: "0x",
  }]);

  try {
    const raw = await provider.call({
      to: V4_QUOTER_ADDRESS,
      data: calldata,
      from: userWallet.address,
    });
    const [amountOut] = iface.decodeFunctionResult("quoteExactInputSingle", raw);
    console.log(`🔁 Simulated amountOut: ${ethers.formatUnits(amountOut, 6)} USDC`);
    return amountOut;
  } catch (err) {
    console.warn("⚠️ V4 quoter simulation failed:", err.reason || err.message || err);
    return null;
  }
}

// Slot0 helper
async function getPoolSlot0(poolId) {
  const [sqrtPriceX96, tick, protocolFee, lpFee] = await stateView.getSlot0(poolId);
  return { sqrtPriceX96, tick, protocolFee, lpFee };
}

// ──────────────────────────────────────────────────────────────────────────────
// V4 checkFeeFreeRoute — mirrors your V3 structure (no PPMs, just “> 0” test)
// ──────────────────────────────────────────────────────────────────────────────
async function checkFeeFreeRoute(amountIn) {
  console.log(`\n🚀 Checking Fee-Free Routes for ${amountIn} CBBTC → USDC (V4)`);

  // Token order fixed exactly as requested
  const token0 = USDC.toLowerCase();
  const token1 = CBBTC.toLowerCase();

  // We already know the pool; infer tickSpacing and recompute poolId sanity
  const tickSpacing = inferTickSpacingFromPoolId({
    token0, token1, fee: POOL.fee, hooks: POOL.hooks, poolId: POOL.poolId,
  });

  const poolKey = {
    currency0: token0,
    currency1: token1,
    fee: POOL.fee,
    tickSpacing,
    hooks: POOL.hooks,
  };

  const recomputed = computePoolId(poolKey);
  if (recomputed.toLowerCase() !== POOL.poolId.toLowerCase()) {
    console.warn("⚠️ poolId mismatch with inferred tickSpacing; aborting.");
    return [];
  }

  // Pull slot0 (tick) from the state view (V4 analogue of “pool.slot0()” in V3)
  const slot0 = await getPoolSlot0(POOL.poolId);
  if (!slot0) return [];
  const baseTick = Math.floor(Number(slot0.tick) / tickSpacing) * tickSpacing;

  const feeFreeRoutes = [];
  // Per your V3 loop: check baseTick, baseTick + tickSpacing, baseTick + 2*tickSpacing
  for (let i = 0; i < 3; i++) {
    const testTick = baseTick + i * tickSpacing;
    try {
      const sqrtPriceLimitX96 = BigInt(TickMath.getSqrtRatioAtTick(testTick).toString());
      const amountInSats = ethers.parseUnits(amountIn.toString(), 8);

      // Direction: cbBTC (token1) → USDC (token0) => zeroForOne = false
      const zeroForOne = false;

      const simulation = await simulateWithQuoterV4({
        poolKey,
        zeroForOne,
        amountIn: amountInSats,
        sqrtPriceLimitX96,
      });

      if (simulation && simulation > 0n) {
        console.log(
          `✅ Route at tick ${testTick} is valid. Estimated out: ${ethers.formatUnits(simulation, 6)} USDC`
        );
        feeFreeRoutes.push({
          poolId: POOL.poolId,
          fee: POOL.fee,
          sqrtPriceLimitX96,
          tick: testTick,
          poolKey,
        });
      } else {
        // console.log(`❌ Route at tick ${testTick} returned zero or failed`);
      }
    } catch (err) {
      console.warn(`⚠️ Skip tick ${testTick}: ${err.message}`);
    }
  }

  return feeFreeRoutes;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  // Keep this exact token order (as requested)
  const token0 = USDC.toLowerCase();
  const token1 = CBBTC.toLowerCase();

  // Infer tickSpacing and verify poolId
  const tickSpacing = inferTickSpacingFromPoolId({
    token0, token1, fee: POOL.fee, hooks: POOL.hooks, poolId: POOL.poolId,
  });

  const poolKey = {
    currency0: token0,
    currency1: token1,
    fee: POOL.fee,
    tickSpacing,
    hooks: POOL.hooks,
  };

  console.log(`\n🔎 ${POOL.label}`);
  console.log(`• Using manual poolId: ${POOL.poolId}`);
  const computed = computePoolId(poolKey);
  console.log(
    computed.toLowerCase() === POOL.poolId.toLowerCase()
      ? `✅ poolId matches: ${computed}`
      : `⚠️ poolId mismatch! ${computed}`
  );
  console.log(`🧮 tickSpacing=${tickSpacing}`);

  // slot0 info (just logging; not needed for the fee-free “>0” check)
  const { sqrtPriceX96, tick, protocolFee, lpFee } = await getPoolSlot0(POOL.poolId);
  console.log(`📈 Current sqrtPriceX96: ${sqrtPriceX96}`);
  console.log(`🧾 Fees (ppm): lpFee=${Number(lpFee)} protocolFee=${Number(protocolFee)}`);

  // ── KEEP THIS EXACT LINE (your request)
  let amountInCBBTC = ethers.parseUnits("1", 8);

  // Run the V3-style checker on V4 (no ppm, just “> 0”)
  const amountInFloat = Number(ethers.formatUnits(amountInCBBTC, 8));
  const routes = await checkFeeFreeRoute(amountInFloat);

  if (!routes || routes.length === 0) {
    console.log("\n❌ No candidate routes returned a positive quote at those tick anchors.");
  } else {
    console.log("\n✅ Candidate routes (positive quotes):");
    for (const r of routes) {
      console.log(`• tick=${r.tick} | sqrtLimit=${r.sqrtPriceLimitX96.toString()}`);
    }
  }

  // Decoder is kept here per your requirement (not used in this routine directly)
  // Example (do nothing): decodeSqrtPriceX96ToFloat(sqrtPriceX96, 6, 8);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

// Run: yarn hardhat run test/cbbtc_mass_test.js --network base