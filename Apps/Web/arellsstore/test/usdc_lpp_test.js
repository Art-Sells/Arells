// usdc_cbBTC_exactOutput_ladder_dryrun.js
import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// ------------ Addresses (Base) -------------
const QUOTER_ADDRESS   = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a"; // Uniswap V3 QuoterV2
const FACTORY_ADDRESS  = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"; // Uniswap V3 Factory
const USDC             = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // 6 decimals
const CBBTC            = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf"; // 8 decimals
const FEE_TIERS        = [500, 3000]; // 0.05% and 0.30%

// ------------ Provider / Wallet (read-only) -------------
const provider   = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST ?? ethers.ZeroHash, provider);
console.log(`✅ Using Test Wallet (read-only): ${userWallet.address}`);

// ------------ Simple ABI cache -------------
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

async function getPoolAddressForFee(fee) {
  const factoryAbi = await fetchABI(FACTORY_ADDRESS);
  const factory = new ethers.Contract(FACTORY_ADDRESS, factoryAbi, provider);
  try {
    return await factory.getPool(USDC, CBBTC, fee);
  } catch {
    return ethers.ZeroAddress;
  }
}

async function readPoolBasics(poolAddress) {
  const poolAbi = await fetchABI(poolAddress);
  const pool = new ethers.Contract(poolAddress, poolAbi, provider);
  const [slot0, tickSpacing] = await Promise.all([pool.slot0(), pool.tickSpacing()]);
  const sqrtPriceX96 = slot0.sqrtPriceX96 ?? slot0[0];
  const tick         = slot0.tick ?? slot0[1];
  return { sqrtPriceX96: BigInt(sqrtPriceX96), tick: Number(tick), tickSpacing: Number(tickSpacing) };
}

function decodeSpotUSDCperCBBTC(sqrtPriceX96) {
  const sqrt = BigInt(sqrtPriceX96);
  const num  = sqrt * sqrt;        // Q192
  const den  = 1n << 192n;
  const raw  = Number(num) / Number(den); // token1/token0
  const usdcDecimals = 6, cbbtcDecimals = 8;
  return (1 / raw) * (10 ** (cbbtcDecimals - usdcDecimals));
}

// ------------ Quoter helpers (robust, no state changes) -------------
async function quoter() {
  const abi = await fetchABI(QUOTER_ADDRESS);
  return new ethers.Contract(QUOTER_ADDRESS, abi, provider);
}

// ---- drop-in FIX ----
async function quoteExactInputSingle({ tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96 = 0n }) {
  const abi = await fetchABI(QUOTER_ADDRESS);
  const q   = new ethers.Contract(QUOTER_ADDRESS, abi, provider);
  const iface = new ethers.Interface(abi);

  // Detect legacy vs V2: legacy has 5 inputs, V2 has 1 tuple input
  const fn = abi.find(f => f.name === "quoteExactInputSingle");
  if (!fn) throw new Error("quoteExactInputSingle not in ABI");

  try {
    let res;
    if (fn.inputs.length === 1 && fn.inputs[0].type.startsWith("tuple")) {
      // V2: (tuple) -> (amountOut, sqrtAfter, ticksCrossed, gasEstimate)
      res = await q.quoteExactInputSingle({ tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96 });
    } else {
      // Legacy: (a,b,fee,amountIn,limit) -> (amountOut)
      res = await q.quoteExactInputSingle(tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96);
    }
    const amountOut = Array.isArray(res) ? res[0] : (res.amountOut ?? res);
    return BigInt(amountOut.toString());
  } catch (e) {
    // Robust fallback via manual encode/decode (works for both ABIs)
    try {
      const data = iface.encodeFunctionData("quoteExactInputSingle",
        fn.inputs.length === 1
          ? [{ tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96 }]
          : [tokenIn, tokenOut, fee, amountIn, sqrtPriceLimitX96]
      );
      const raw  = await provider.call({ to: QUOTER_ADDRESS, data });
      const dec  = iface.decodeFunctionResult("quoteExactInputSingle", raw);
      const amountOut = Array.isArray(dec) ? dec[0] : (dec.amountOut ?? dec);
      return BigInt(amountOut.toString());
    } catch (e2) {
      console.error("quoteExactInputSingle failed:", e2?.reason || e2?.message || e2);
      return null;
    }
  }
}

async function quoteExactOutputSingle({ tokenIn, tokenOut, fee, amountOut, sqrtPriceLimitX96 = 0n }) {
  const abi = await fetchABI(QUOTER_ADDRESS);
  const q   = new ethers.Contract(QUOTER_ADDRESS, abi, provider);
  const iface = new ethers.Interface(abi);

  const fn = abi.find(f => f.name === "quoteExactOutputSingle");
  if (!fn) throw new Error("quoteExactOutputSingle not in ABI");

  try {
    let res;
    if (fn.inputs.length === 1 && fn.inputs[0].type.startsWith("tuple")) {
      // V2: (tuple) -> (amountIn, sqrtAfter, ticksCrossed, gasEstimate)
      res = await q.quoteExactOutputSingle({ tokenIn, tokenOut, fee, amount: amountOut, sqrtPriceLimitX96 });
    } else {
      // Legacy: (a,b,fee,amountOut,limit) -> (amountIn)
      res = await q.quoteExactOutputSingle(tokenIn, tokenOut, fee, amountOut, sqrtPriceLimitX96);
    }
    const amountIn = Array.isArray(res) ? res[0] : (res.amountIn ?? res);
    return BigInt(amountIn.toString());
  } catch (e) {
    // Fallback manual encode/decode
    try {
      const data = iface.encodeFunctionData("quoteExactOutputSingle",
        fn.inputs.length === 1
          ? [{ tokenIn, tokenOut, fee, amount: amountOut, sqrtPriceLimitX96 }]
          : [tokenIn, tokenOut, fee, amountOut, sqrtPriceLimitX96]
      );
      const raw  = await provider.call({ to: QUOTER_ADDRESS, data });
      const dec  = iface.decodeFunctionResult("quoteExactOutputSingle", raw);
      const amountIn = Array.isArray(dec) ? dec[0] : (dec.amountIn ?? dec);
      return BigInt(amountIn.toString());
    } catch (e2) {
      console.error("quoteExactOutputSingle failed:", e2?.reason || e2?.message || e2);
      return null;
    }
  }
}
// ---- end FIX ----

// ------------ Ladder logic -------------
function sats(n) { return BigInt(n); }                            // 1 sat = 1 raw unit (8 dp)
function fmtUSDC(bi) { return ethers.formatUnits(bi, 6); }
function fmtBTC(bi)  { return ethers.formatUnits(bi, 8); }

async function runForFeeTier(fee, amountInUSDC = 3) {
  console.log(`\n=== Fee Tier ${fee} (ppm) ===`);
  const pool = await getPoolAddressForFee(fee);
  if (pool === ethers.ZeroAddress) {
    console.log("❌ No pool for this fee.");
    return null;
  }

  const basics = await readPoolBasics(pool);
  try {
    console.log(`💵 Spot price (approx): ${decodeSpotUSDCperCBBTC(basics.sqrtPriceX96).toLocaleString()} USDC/CBBTC`);
  } catch {}

  const amountInRaw = ethers.parseUnits(amountInUSDC.toString(), 6);

  // 1) Single-shot exactInput for reference output
  const singleOut = await quoteExactInputSingle({
    tokenIn: USDC, tokenOut: CBBTC, fee, amountIn: amountInRaw
  });
  if (!singleOut) { console.log("⚠️ Quoter failed for exactInputSingle."); return null; }
  console.log(`🎯 Single-shot out (exactInputSingle @ ${amountInUSDC} USDC): ${fmtBTC(singleOut)} cbBTC`);

  // Also compute exactOutput for the same out (should ≈ amountInRaw)
  const singleInFromEO = await quoteExactOutputSingle({
    tokenIn: USDC, tokenOut: CBBTC, fee, amountOut: singleOut
  });
  if (!singleInFromEO) { console.log("⚠️ Quoter failed for exactOutputSingle (full target)."); return null; }
  console.log(`🧮 Input required for that exact output (exactOutputSingle): ${fmtUSDC(singleInFromEO)} USDC`);

  // 2) Probe per-leg quotes for 1–10 sats
  const candidates = Array.from({ length: 10 }, (_, i) => sats(i + 1)); // 1..10 sats
  const rows = [];
  let best = null;

  for (const satChunk of candidates) {
    const inForChunk = await quoteExactOutputSingle({
      tokenIn: USDC, tokenOut: CBBTC, fee, amountOut: satChunk
    });
    if (inForChunk == null) {
      rows.push({
        satChunk: Number(satChunk),
        inputPerSatUSDC: "fail",
        chunkUSDC: "fail"
      });
      continue;
    }
    const inputPerSat = Number(fmtUSDC(inForChunk)) / Number(fmtBTC(satChunk)); // USDC per sat
    rows.push({
      satChunk: Number(satChunk),
      chunkUSDC: Number(fmtUSDC(inForChunk)),
      inputPerSatUSDC: inputPerSat
    });

    if (!best || inputPerSat < best.inputPerSatUSDC) {
      best = { satChunk, chunkIn: inForChunk, inputPerSatUSDC: inputPerSat };
    }
  }

  console.log("\n— Per-leg (exactOutputSingle) cost for 1–10 sat chunks —");
  console.table(rows);

  if (!best) { console.log("❌ No valid per-leg quotes."); return null; }
  console.log(`🏅 Best sat-chunk: ${best.satChunk} sat(s) requiring ~${fmtUSDC(best.chunkIn)} USDC (≈ ${best.inputPerSatUSDC} USDC/sat)`);

  // 3) Build a naive ladder to reach the same total output as single-shot
  const targetOut = singleOut;                // cbBTC raw units
  const chunkOut  = best.satChunk;            // sats per leg
  const nFull     = targetOut / chunkOut;     // integer legs
  const remainder = targetOut % chunkOut;     // leftover sats

  let totalInLadder = nFull * best.chunkIn;
  if (remainder > 0n) {
    const remIn = await quoteExactOutputSingle({
      tokenIn: USDC, tokenOut: CBBTC, fee, amountOut: remainder
    });
    totalInLadder += (remIn ?? 0n);
  }

  console.log("\n— Ladder result (static quoter approximation) —");
  console.log(`Target out  : ${fmtBTC(targetOut)} cbBTC`);
  console.log(`Leg size    : ${best.satChunk.toString()} sat(s) x ${nFull.toString()} legs, remainder = ${remainder.toString()} sat(s)`);
  console.log(`Ladder input: ${fmtUSDC(totalInLadder)} USDC`);
  console.log(`Single input: ${fmtUSDC(singleInFromEO)} USDC`);
  const diff = (totalInLadder > singleInFromEO) ? (totalInLadder - singleInFromEO) : (singleInFromEO - totalInLadder);
  console.log(`Δ (ladder − single): ${fmtUSDC(diff)} USDC ${totalInLadder > singleInFromEO ? "(worse)" : "(better)"}`);

  return {
    fee,
    pool,
    singleOutCbBTC: Number(fmtBTC(singleOut)),
    singleInputUSDC: Number(fmtUSDC(singleInFromEO)),
    ladderInputUSDC: Number(fmtUSDC(totalInLadder)),
    bestChunkSat: Number(best.satChunk),
  };
}

// ------------ Main -------------
async function main() {
  console.log("\n🧪 DRY RUN — exactOutput ladder vs single-shot (no txs)");
  const sum = [];
  for (const fee of FEE_TIERS) {
    try {
      const res = await runForFeeTier(fee, 3); // 3 USDC
      if (res) sum.push(res);
    } catch (e) {
      console.error(`Fee ${fee} error:`, e.message || e);
    }
  }

  console.log("\n===== SUMMARY =====");
  console.table(sum);
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exitCode = 1;
});

// to test run: yarn hardhat run test/usdc_lpp_test.js --network base