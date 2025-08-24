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

// For completeness (not used by the quoter itself)
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

  const fragOut = abi.find((e) => e.name === "quoteExactOutputSingle" && e.type === "function");
  if (!fragOut) throw new Error("IV4Quoter.quoteExactOutputSingle not found on this quoter");
  console.log("🔍 quoteExactOutputSingle ABI fragment:", fragOut);

  return new ethers.Interface(abi);
}

// KEEP THIS LOGIC UNCHANGED (your requested signature/order)
function decodeSqrtPriceX96ToFloat(sqrtPriceX96, decimalsToken0 = 6, decimalsToken1 = 8) {
  const Q96 = BigInt(2) ** BigInt(96);
  const sqrt = BigInt(sqrtPriceX96);
  const rawPrice = Number(sqrt * sqrt) / Number(Q96 * Q96);
  return (1 / rawPrice) * 10 ** (decimalsToken1 - decimalsToken0);
}

// ε-limit: nudge 1 ULP in favorable direction (zeroForOne=false → +1)
function epsilonLimit({ sqrtP, zeroForOne }) {
  return zeroForOne ? (BigInt(sqrtP) - 1n) : (BigInt(sqrtP) + 1n);
}

// exact-output quote (amountOut in tokenOut units; here tokenOut=USDC with 6 dp)
async function quoteExactOutput({ quoteIface, poolKey, zeroForOne, exactAmountOut, sqrtPriceLimitX96 }) {
  const data = quoteIface.encodeFunctionData("quoteExactOutputSingle", [{
    poolKey: {
      currency0: poolKey.currency0,
      currency1: poolKey.currency1,
      fee: BigInt(poolKey.fee),
      tickSpacing: BigInt(poolKey.tickSpacing),
      hooks: poolKey.hooks,
    },
    zeroForOne,
    exactAmount: BigInt(exactAmountOut),
    sqrtPriceLimitX96: BigInt(sqrtPriceLimitX96),
    hookData: "0x",
  }]);

  const raw = await provider.call({
    to: V4_QUOTER_ADDRESS,
    data,
    from: userWallet.address,
  });
  const [amountIn, gasEstimate] = quoteIface.decodeFunctionResult("quoteExactOutputSingle", raw);
  return { amountIn, gasEstimate }; // amountIn is cbBTC sats (8 dp)
}

// Pretty ppm on the INPUT side: (feeSats/expSats)*1e6
function ppm(expSats, gotSats) {
  if (expSats === 0n) return "n/a";
  const feeSats = gotSats > expSats ? (gotSats - expSats) : 0n;
  return ((feeSats * 1_000_000n) / expSats).toString();
}

// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  // Token order (force as requested)
  const token0 = USDC.toLowerCase();  // USDC
  const token1 = CBBTC.toLowerCase(); // cbBTC

  const poolKey = {
    currency0: token0,
    currency1: token1,
    fee: POOL.fee,
    tickSpacing: POOL.tickSpacing,
    hooks: POOL.hooks,
  };

  console.log(`\n🔎 ${POOL.label}`);
  console.log(`• Using manual poolId: ${POOL.poolId}`);

  // Confirm poolId (sanity)
  const computedId = computePoolId(poolKey);
  console.log(
    computedId.toLowerCase() === POOL.poolId.toLowerCase()
      ? `✅ poolId matches: ${computedId}`
      : `⚠️ poolId mismatch! ${computedId}`
  );

  // slot0 + fee readout
  const [sqrtP, , protocolFeePpm, lpFeePpm] = await stateView.getSlot0(POOL.poolId);
  console.log(`📈 Current sqrtPriceX96: ${sqrtP}`);
  console.log(`🧾 Fees (ppm): lpFee=${Number(lpFeePpm)} protocolFee=${Number(protocolFeePpm)}`);

  // Direction: cbBTC → USDC means token1 -> token0, so zeroForOne = false (with our forced order)
  const zeroForOne = false;

  // ε-limit (to minimize price impact; helpful for tiny exact outputs)
  const sqrtLimit = epsilonLimit({ sqrtP, zeroForOne });
  console.log(`🧭 Using ε-limit sqrtPriceX96=${sqrtLimit.toString()}`);

  // Quoter iface
  const quoter = await fetchQuoterIface(V4_QUOTER_ADDRESS);

  // Mid price USDC per cbBTC using your decoder (token0=USDC(6), token1=cbBTC(8))
  const midUSDCperCbBTC = decodeSqrtPriceX96ToFloat(sqrtP, 6, 8);

  // Helper: given microUSDC target, expected no-fee input sats
  // microUSDC = (sats * mid) / 100   →   sats = ceil(microUSDC * 100 / mid)
  const expSatsForMicroOut = (micro) => {
    const x = Number(micro) * 100 / midUSDCperCbBTC;
    return BigInt(Math.ceil(x));
  };

  // ── YOUR AMOUNT LINE (kept exactly as requested; not used in exact-output search)
  let amountInCBBTC = ethers.parseUnits("1", 8);

  // Boundary set: exact-output micro targets
  //  - Tiny outputs (to isolate rounding)
  //  - A few denser points (powers of 10) for variety
  const fibMicro = [1n,2n,3n,5n,8n,13n,21n,34n,55n,89n,144n,233n,377n,610n,987n,1597n,2584n,4181n,6765n];
  const pow10Micro = [10n,100n,1_000n,10_000n,100_000n,1_000_000n]; // up to 1 USDC
  const targets = [...new Set([...fibMicro, ...pow10Micro])].sort((a,b)=> (a<b?-1:1));

  console.log("\n──── Exact-output boundary search (ε-limit) ────");
  console.log("usdc_micro_out, cbBTC_in_sats, mid_no_fee_in_sats, fee_sats, fee_ppm");

  let best = null;

  for (const micro of targets) {
    // Ask for EXACTLY `micro` micro-USDC out
    const { amountIn } = await quoteExactOutput({
      quoteIface: quoter,
      poolKey,
      zeroForOne,
      exactAmountOut: micro,          // tokenOut = USDC(6dp), so 1 = 1 micro USDC
      sqrtPriceLimitX96: sqrtLimit,   // ε-limit to minimize price impact
    });

    const expSats = expSatsForMicroOut(micro);
    const feeSats = amountIn > expSats ? (amountIn - expSats) : 0n;
    const p = ppm(expSats, amountIn);

    console.log(
      [
        micro.toString(),
        amountIn.toString(),
        expSats.toString(),
        feeSats.toString(),
        p
      ].join(",")
    );

    // keep the lowest ppm (as a candidate “sweet spot”)
    if (p !== "n/a") {
      const pBig = BigInt(p);
      if (!best || pBig < best.ppm) {
        best = { micro, amountIn, expSats, feeSats, ppm: pBig };
      }
    }
  }

  if (best) {
    console.log("\n🏁 Best exact-output boundary (ε-limit):");
    console.log(
      `micro_out=${best.micro.toString()} → ppm≈${best.ppm.toString()} (fee ${best.feeSats.toString()} sats on expected ${best.expSats.toString()} sats)`
    );
  } else {
    console.log("\n(no finite ppm found in this boundary set)");
  }

  console.log("\nℹ️ Interpretation:");
  console.log("If none of these exact-output micro boundaries produce ppm ≪ lpFee,");
  console.log("then rounding doesn’t yield ‘fee-free’ sweet spots on this v4 pool at ε-limit.");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

// Run: yarn hardhat run test/cbbtc_mass_test.js --network base