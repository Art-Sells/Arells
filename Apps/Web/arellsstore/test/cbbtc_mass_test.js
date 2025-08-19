
import { 
  ethers, 
  keccak256, 
  getAddress, 
  toBeHex,
  hexConcat, zeroPadValue, 
  toBeHex } from "ethers";
import dotenv from "dotenv";
import axios from "axios";
import { TickMath } from "@uniswap/v3-sdk";
import { keccak256, encodePacked, getAddress, solidityPacked } from "viem";
import { exitCode } from "process";
import { unlink } from "fs";
import { Token } from '@uniswap/sdk-core';
import crypto from "crypto";

dotenv.config();


















const V4_POOL_MANAGER = "0x498581fF718922c3f8e6A244956aF099B2652b2b";
const V4_POOL_AB_HOOK_ADDRESS = "0x5cd525c621AFCa515Bf58631D4733fbA7B72Aae4";
const STATE_VIEW_ADDRESS = "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71";
const V4_QUOTER_ADDRESS = "0x0d5e0f971ed27fbff6c2837bf31316121532048d";

const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const stateViewABI = [
  "function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)",
  "function getLiquidity(bytes32 poolId) view returns (uint128)"
];

const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);

const stateView = new ethers.Contract(STATE_VIEW_ADDRESS, stateViewABI, provider);
const V4_POOL_IDS = [
  {
    label: "V4 A (0.3%)",
    poolId: "0x64f978ef116d3c2e1231cfd8b80a369dcd8e91b28037c9973b65b59fd2cbbb96", 
    hooks: getAddress(V4_POOL_AB_HOOK_ADDRESS), 
    tickSpacing: 200,
    fee: 3000,
  },
];

const slot0Interface = new ethers.Interface([
  "function getSlot0(bytes32) view returns (uint160 sqrtPriceX96, int24 tick, uint16 protocolFee, uint16 lpFee)",
]);

const liquidityInterface = new ethers.Interface([
  "function getLiquidity(bytes32 poolId) view returns (uint128)",
]);
const tickInfoInterface = new ethers.Interface([
  "function getTickInfo(bytes32 poolId, int24 tick) view returns (uint128 liquidityGross, int128 liquidityNet, uint256 feeGrowthOutside0, uint256 feeGrowthOutside1)"
]);
const tickBitmapInterface = new ethers.Interface([
  "function getTickBitmap(bytes32 poolId, int16 wordPosition) view returns (uint256)"
]);

  // Fetch ABI dynamically
  async function fetchABI(address) {
    const apiKey = process.env.BASESCAN_API_KEY;
    const url = `https://api.basescan.org/api?module=contract&action=getabi&address=${address}&apikey=${apiKey}`;
    const response = await axios.get(url);
    if (response.data.status !== "1") throw new Error("Failed to fetch ABI from BaseScan");

    const abi = JSON.parse(response.data.result);
    //console.log("🔍 Full V4 Quoter ABI:\n", JSON.stringify(abi, null, 2));
    const quoteFragment = abi.find(
      (entry) => entry.name === "quoteExactInputSingle" && entry.type === "function"
    );
    console.log("🔍 quoteExactInputSingle ABI fragment:", quoteFragment);

    return abi;
  }

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

async function getTickBitmap(poolId, wordPosition) {
  const data = tickBitmapInterface.encodeFunctionData("getTickBitmap", [poolId, wordPosition]);
  const result = await provider.call({ to: STATE_VIEW_ADDRESS, data });
  return tickBitmapInterface.decodeFunctionResult("getTickBitmap", result)[0];
}
async function getSlot0FromStateView(poolId) {
  const data = slot0Interface.encodeFunctionData("getSlot0", [poolId]);
  const result = await provider.call({ to: STATE_VIEW_ADDRESS, data });
  return slot0Interface.decodeFunctionResult("getSlot0", result);
}

async function getLiquidity(poolId) {
  const data = liquidityInterface.encodeFunctionData("getLiquidity", [poolId]);
  const result = await provider.call({ to: STATE_VIEW_ADDRESS, data });
  return liquidityInterface.decodeFunctionResult("getLiquidity", result)[0];
}

async function getTickInfo(poolId, tick) {
  const data = tickInfoInterface.encodeFunctionData("getTickInfo", [poolId, tick]);
  const result = await provider.call({ to: STATE_VIEW_ADDRESS, data });
  const decoded = tickInfoInterface.decodeFunctionResult("getTickInfo", result);

  return {
    liquidityGross: decoded[0],
    liquidityNet: decoded[1],
    feeGrowthOutside0: decoded[2],
    feeGrowthOutside1: decoded[3],
  };
}

function decodeSqrtPriceX96ToFloat(sqrtPriceX96, decimalsToken0 = 8, decimalsToken1 = 6) {
  const Q96 = BigInt(2) ** BigInt(96);
  const sqrt = BigInt(sqrtPriceX96);
  const rawPrice = Number(sqrt * sqrt) / Number(Q96 * Q96);
  return (1 / rawPrice) * 10 ** (decimalsToken0 - decimalsToken1);
}

function decodeLiquidityAmountsv4(liquidity, sqrtPriceX96) {
  const sqrtPrice = Number(sqrtPriceX96) / 2 ** 96;
  const liquidityFloat = Number(liquidity);
  return {
    cbBTC: (liquidityFloat * sqrtPrice) / 1e8,
    usdc: (liquidityFloat / sqrtPrice) / 1e6,
  };
}

function getInitializedTicksFromBitmap(bitmap, wordPosition, tickSpacing) {
  const ticks = [];
  const binary = bitmap.toString(2).padStart(256, "0");

  for (let i = 0; i < 256; i++) {
    if (binary[255 - i] === "1") { // reverse bit order
      const tick = (wordPosition * 256 + i) * tickSpacing;
      ticks.push(tick);

    }
  }
  return ticks;
}

// ---- math helpers (V3 math applies to V4 pools per tick) ----
function tickToSqrtRatioX96(tick) {
  // TickMath from @uniswap/v3-sdk returns JSBI; convert to BigInt
  return BigInt(TickMath.getSqrtRatioAtTick(tick).toString());
}

// amount0 to move price DOWN (zeroForOne) from sqrtP to sqrtQ (sqrtQ < sqrtP):
// amt0 = L * (sqrtP - sqrtQ) / (sqrtQ * sqrtP)
function amount0ForPriceMove(sqrtP, sqrtQ, L) {
  // all BigInt; do division last
  const num = L * (sqrtP - sqrtQ);
  const den = (sqrtQ * sqrtP) >> 0n; // exact BigInt multiply
  return num * (1n << 96n) / (den / (1n << 96n)); // keep precision ~Q192
}

// amount1 to move price UP (oneForZero) from sqrtP to sqrtQ (sqrtQ > sqrtP):
// amt1 = L * (sqrtQ - sqrtP)
function amount1ForPriceMove(sqrtP, sqrtQ, L) {
  return L * (sqrtQ - sqrtP) / 1n; // BigInt
}

async function buildQuoterInterface() {
  const quoterABI = await fetchABI(V4_QUOTER_ADDRESS);
  return new ethers.Interface(quoterABI);
}

// Quote helper that ALWAYS uses fetched ABI and your current params
async function quoteV4({
  quoteIface, poolKey, zeroForOne, exactAmount,
  sqrtPriceLimitX96, hookData = "0x", callFrom
}) {
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
    hookData
  }]);

  const raw = await provider.call({
    to: V4_QUOTER_ADDRESS,
    data: calldata,
    ...(callFrom ? { from: callFrom } : {})   // ← key line
  });

  const [amountOut, gasEstimate] = quoteIface.decodeFunctionResult("quoteExactInputSingle", raw);
  return { amountOut, gasEstimate };
}

// Try sender-gated promos by varying the eth_call 'from'
const fromCandidates = [
  userWallet.address,
  // Add any router addresses you might actually execute through:
  // "0x...UNIVERSAL_ROUTER",
  // "0x...ONEINCH_ROUTER",
  // "0x...0x_ROUTER",
];
let chosenFrom = undefined;
let bestFrom = null;
for (const f of fromCandidates) {
  try {
    const r = quoteV4({
      quoteIface, poolKey, zeroForOne,
      exactAmount: parsedAmount,
      sqrtPriceLimitX96: effectiveLimit,
      hookData: "0x",
      callFrom: f
    });
    const out = Number(ethers.formatUnits(r.amountOut, 6));
    console.log(`👤 from=${f.slice(0,10)}… → ${out.toFixed(6)} USDC`);
    if (!bestFrom || out > bestFrom.out) bestFrom = { f, out, r };
  } catch {}
}
if (bestFrom) {
  chosenFrom = bestFrom.f;
  console.log(`🏆 Best 'from'=${chosenFrom} → ${bestFrom.out.toFixed(6)} USDC`);
}

// Get a handful of initialized ticks around the current tick
async function getNearbyInitializedTicks(poolId, tickSpacing, baseTick, radiusWords = 2) {
  const wordOf = (t) => Math.floor(t / tickSpacing / 256);
  const baseWord = wordOf(baseTick);
  const ticks = new Set();

  for (let w = baseWord - radiusWords; w <= baseWord + radiusWords; w++) {
    const bm = await getTickBitmap(poolId, w);
    const arr = getInitializedTicksFromBitmap(bm, w, tickSpacing);
    arr.forEach(t => ticks.add(t));
  }

  // Sort numerically
  return Array.from(ticks).sort((a, b) => a - b);
}

// Probe by initialized ticks: estimate input needed to land near tick bands,
// then re-quote using those estimated amounts (still using fetched ABI).
async function probeByInitializedTicks({
  poolId,
  poolKey,
  amountInCBBTC,       // BigInt (cbBTC 8dp) — unchanged
  userWantsZeroForOne  // from your fixed token order check
}) {
  const quoteIface = await buildQuoterInterface();

  // current state
  const [sqrtP, tick] = await getSlot0FromStateView(poolId);
  const zeroForOne = userWantsZeroForOne;
  const tickSpacing = Number(poolKey.tickSpacing);
  const baseTick = Math.floor(Number(tick) / tickSpacing) * tickSpacing;

  console.log(`🔎 Tick-probe around tick=${Number(tick)} (base=${baseTick}), in=${Number(ethers.formatUnits(amountInCBBTC, 8))} cbBTC`);

  // gather initialized ticks near the current word ±2
// was: radiusWords = 2
const initTicks = await getNearbyInitializedTicks(poolId, tickSpacing, baseTick, 10);
  if (!initTicks.length) {
    console.log("⚠️ No initialized ticks nearby; skipping probe.");
    return null;
  }

  // We only want ticks on the correct side of the current price:
  // - zeroForOne (token0→token1) drives price DOWN → limit must be BELOW current
  // - oneForZero (token1→token0) drives price UP   → limit must be ABOVE current
  const candidatesTicks = initTicks.filter(t =>
    zeroForOne ? (t < baseTick) : (t > baseTick)
  ).slice(0, 12); // keep it small

  const candidates = [];
  for (const t of candidatesTicks) {
    const nudges = zeroForOne
      ? [t - 1, t - (tickSpacing - 1)]        // price down → below current
      : [t + 1, t + (tickSpacing - 1)];       // price up   → above current

    for (const limitTick of nudges) {
      let sqrtLimit;
      try {
        sqrtLimit = BigInt(TickMath.getSqrtRatioAtTick(limitTick).toString());
      } catch { continue; }

      // enforce direction
      if (zeroForOne && sqrtLimit >= BigInt(sqrtP)) continue;
      if (!zeroForOne && sqrtLimit <= BigInt(sqrtP)) continue;

      try {
        const { amountOut, gasEstimate } = await quoteV4({
          quoteIface, poolKey, zeroForOne,
          exactAmount: amountInCBBTC,
          sqrtPriceLimitX96: sqrtLimit,
          hookData: "0x"
        });
        const outHuman = Number(ethers.formatUnits(amountOut, 6));
        console.log(`✅ limit @ tick ${limitTick} → ~${outHuman.toFixed(6)} USDC (gas=${gasEstimate})`);
        candidates.push({ limitTick, sqrtLimit, outHuman, gas: gasEstimate, amountOut });
      } catch {/* ignore */}
    }
  }

  if (!candidates.length) {
    console.log("⚠️ No viable limit-tick quotes (hook ignores limit, or all reverts).");
    return null;
  }

  candidates.sort((a, b) => (a.outHuman > b.outHuman ? -1 : 1));
  const best = candidates[0];
  console.log(`🏁 Tick-probe best @ tick ${best.limitTick} → ${best.outHuman.toFixed(6)} USDC`);
  return best;
}

// Time-separated quotes: wait for N new blocks (or delays) and re-quote
async function timeSeparatedQuotes({
  poolKey,
  poolId,
  amountInCBBTC,
  zeroForOne,
  rounds = 3,
  minBlocksBetween = 1
}) {
  const quoteIface = await buildQuoterInterface();
  const results = [];
  let lastBlock = await provider.getBlockNumber();

  for (let i = 0; i < rounds; i++) {
    // wait for block(s)
    while (true) {
      const b = await provider.getBlockNumber();
      if (b >= lastBlock + minBlocksBetween) {
        lastBlock = b;
        break;
      }
      // small sleep
      await new Promise(r => setTimeout(r, 400));
    }

    const { amountOut, gasEstimate } = await quoteV4({
      quoteIface, poolKey, zeroForOne, exactAmount: amountInCBBTC, hookData: "0x"
    });

    const outHuman = Number(ethers.formatUnits(amountOut, 6));
    results.push({ round: i + 1, outHuman, gas: gasEstimate, block: lastBlock });
    console.log(`⏱️ round ${i + 1} (block ${lastBlock}) → ${outHuman.toFixed(6)} USDC (gas=${gasEstimate})`);
  }
  return results;
}

async function sweepArithmeticTicks({
  poolId, poolKey, amountInCBBTC, zeroForOne,
  baseTick, tickSpacing, steps = 80 // ~80*200=16k ticks swept
}) {
  const quoteIface = await buildQuoterInterface();
  const [sqrtP] = await getSlot0FromStateView(poolId);
  const dir = zeroForOne ? -1 : +1;

  let best = null;

  for (let i = 1; i <= steps; i++) {
    const t = baseTick + dir * i * tickSpacing;

    // try both “inside” and “edge-outside”
    const tries = zeroForOne ? [t - 1, t - (tickSpacing - 1)] : [t + 1, t + (tickSpacing - 1)];

    for (const limitTick of tries) {
      let sqrtLimit;
      try { sqrtLimit = BigInt(TickMath.getSqrtRatioAtTick(limitTick).toString()); }
      catch { continue; }

      if (zeroForOne && sqrtLimit >= BigInt(sqrtP)) continue;
      if (!zeroForOne && sqrtLimit <= BigInt(sqrtP)) continue;

      try {
        const { amountOut } = await quoteV4({
          quoteIface, poolKey, zeroForOne,
          exactAmount: amountInCBBTC,
          sqrtPriceLimitX96: sqrtLimit,
          hookData: "0x"
        });
        const outHuman = Number(ethers.formatUnits(amountOut, 6));
        if (!best || outHuman > best.outHuman) {
          best = { limitTick, sqrtLimit, outHuman };
          console.log(`🌊 sweep better @ ${limitTick} → ${outHuman.toFixed(6)} USDC`);
        }
      } catch {/* ignore */}
    }
  }
  return best;
}


function* hookDataVariants({ user, poolId, amountInCBBTC }) {
  // ultra-cheap set; expand as you like
  yield "0x";                                    // empty
  yield "0x00"; yield "0x01"; yield "0xff";      // 1-byte tags
  // user address (left-padded to 32 bytes)
  yield "0x" + "0".repeat(24) + user.toLowerCase().replace(/^0x/, "");
  // poolId raw (32 bytes already)
  yield poolId;
  // amountIn as 32-byte BE
  yield "0x" + BigInt(amountInCBBTC).toString(16).padStart(64, "0");
}

async function searchHookDataForBestQuote({
  poolKey, zeroForOne, amountInCBBTC, sqrtPriceLimitX96, user, poolId
}) {
  const quoteIface = await buildQuoterInterface();
  let best = null;

  for (const hookData of hookDataVariants({ user, poolId, amountInCBBTC })) {
    try {
      const { amountOut, gasEstimate } = await quoteV4({
        quoteIface, poolKey, zeroForOne,
        exactAmount: amountInCBBTC,
        sqrtPriceLimitX96,
        hookData
      });
      const outHuman = Number(ethers.formatUnits(amountOut, 6));
      console.log(`🔬 hookData=${hookData.slice(0,18)}… → ${outHuman.toFixed(6)} USDC (gas=${gasEstimate})`);
      if (!best || outHuman > best.outHuman) {
        best = { hookData, amountOut, outHuman, gasEstimate };
      }
    } catch (e) {
      // ignore reverts; keep scanning
    }
  }
  return best;
}


async function findMaxZeroFeeChunk({
  poolKey, zeroForOne, limitX96, quoteIface, // quoter bits
  priceUSDCperBTC,                           // from slot0 decode
  decimalsIn = 8, decimalsOut = 6,
  maxTry = 100000000n                         // cap search up to 1 cbBTC here (1e8)
}) {
  // Treat “fee-free” as “implied fee < 0.05%” (tunable)
  const THRESH_PPM = 500n; // 0.05%
  const one = 10_0000_0000n; // helper scale (not units)
  
  const impliedFeePpm = (amtIn, amtOut) => {
    // expected out (no price move) = amtIn * price
    // amtIn is 8dp cbBTC; priceUSDCperBTC is a JS number
    const expOut = BigInt(Math.floor(Number(amtIn) * priceUSDCperBTC / (10 ** decimalsIn) * (10 ** decimalsOut)));
    if (expOut === 0n) return 1_000_000n;
    const diff = expOut > amtOut ? (expOut - amtOut) : 0n;
    return (diff * 1_000_000n) / expOut; // ppm
  };

  async function q(amt) {
    const { amountOut } = await quoteV4({
      quoteIface, poolKey, zeroForOne,
      exactAmount: amt,
      sqrtPriceLimitX96: limitX96,
      hookData: "0x"
    });
    return amountOut;
  }

  // quick ladder up by 10x until fee is clearly > threshold
  let current = 1_000n; // 1e3 sats = 0.00001 cbBTC
  let lastGood = 0n;
  while (current <= maxTry) {
    const out = await q(current);
    const feePpm = impliedFeePpm(current, out);
    if (feePpm <= THRESH_PPM) {
      lastGood = current;
      current *= 10n;
    } else break;
  }
  if (lastGood === 0n) return 0n; // no fee-free size

  // binary search between lastGood..min(current,maxTry)
  let lo = lastGood, hi = current <= maxTry ? current : maxTry, ans = lastGood;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1n;
    const out = await q(mid);
    const feePpm = impliedFeePpm(mid, out);
    if (feePpm <= THRESH_PPM) {
      ans = mid; lo = mid + 1n;
    } else {
      hi = mid - 1n;
    }
  }
  return ans; // largest fee-free chunk size (base units of cbBTC)
}

// Brute-force tiny random hookData to see if any hook path gives better quotes
async function bruteHookDataForBest({
  quoteIface,
  poolKey,
  zeroForOne,
  amountInCBBTC,         // BigInt
  sqrtPriceLimitX96,     // BigInt
  callFrom,              // optional 'from' for eth_call sender-gates
  rounds = 1024,         // how many random trials
  bytes = 2,             // how many random bytes to stuff after 0x
  logEvery = 128         // throttle logs
}) {
  let best = null;

  for (let i = 0; i < rounds; i++) {
    // random small payload like 0xA1B2 (tunable via 'bytes')
    const hookData = "0x" + crypto.randomBytes(bytes).toString("hex");

    try {
      const { amountOut, gasEstimate } = await quoteV4({
        quoteIface,
        poolKey,
        zeroForOne,
        exactAmount: amountInCBBTC,
        sqrtPriceLimitX96,
        hookData,
        callFrom
      });

      const outHuman = Number(ethers.formatUnits(amountOut, 6));
      if (!best || outHuman > best.out) {
        best = { hookData, amountOut, gasEstimate, out: outHuman };
      }

      if (i % logEvery === 0) {
        console.log(`🥊 brute ${i}/${rounds}: best so far ~${best?.out?.toFixed(6)} USDC (hookData=${best?.hookData?.slice?.(0,18)}…)`);
      }
    } catch {
      // ignore reverts and keep trying other random bytes
    }
  }

  return best; // { hookData, amountOut (BigInt), gasEstimate (BigInt), out (Number) } or null
}



async function simulateWithV4QuoterPoolA(poolKey, poolId, amountInCBBTC, sqrtPriceLimitX96 = 0n) {
  console.log(`✅ Using userWallet for Pool A quote simulation`);

  // 🔹 Check cbBTC Balance
  const erc20ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];
  const cbBtcContract = new ethers.Contract(CBBTC, erc20ABI, provider);
  const balance = await cbBtcContract.balanceOf(userWallet.address);
  const formattedBalance = ethers.formatUnits(balance, 8);
  console.log(`💰 CBBTC Balance: ${formattedBalance} CBBTC`);

  // 🔹 Compute canonical Pool ID
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

  // 🔹 Prepare Quote Params
  const zeroForOne = poolKey.currency0.toLowerCase() === CBBTC.toLowerCase();
  const parsedAmount = BigInt(amountInCBBTC);
  const hookData = "0x";

  console.log("🔍 signedAmountIn =", parsedAmount);
  console.log("🔍 sqrtPriceLimitX96 =", sqrtPriceLimitX96);

  const quoterABI = await fetchABI(V4_QUOTER_ADDRESS);
  const quoteIface = new ethers.Interface(quoterABI);

  // 🔹 Fetch current slot0 price
  try {
    const [currentSqrtPriceX96, currentTick, protocolFee, lpFee] = await stateView.getSlot0(targetPoolId);
    sqrtPriceLimitX96 = currentSqrtPriceX96;

    console.log(`📈 Current sqrtPriceX96: ${currentSqrtPriceX96.toString()}`);
    console.log(`🧾 Fees (ppm): lpFee=${Number(lpFee)} protocolFee=${Number(protocolFee)}`);
  } catch (e) {
    console.warn("⚠️ Failed to fetch slot0. Falling back to 0n sqrtPriceLimitX96");
    sqrtPriceLimitX96 = 0n;
  }

  // Decide the limit we’ll actually use for the main quote:
  // try the initialized-tick probe first; if it yields a limit, use it.
  // otherwise, fall back to the current price (no-op limit).
  let effectiveLimit = sqrtPriceLimitX96;
  let bestProbe = null;
  try {
    bestProbe = await probeByInitializedTicks({
      poolId: targetPoolId,
      poolKey,
      amountInCBBTC: parsedAmount,      // same amount you’re quoting
      userWantsZeroForOne: zeroForOne
    });
    if (bestProbe?.sqrtLimit) {
      effectiveLimit = bestProbe.sqrtLimit; // use the probe’s limit
      console.log(`🧭 Using tick-probe limit sqrtPriceLimitX96=${effectiveLimit.toString()}`);
    } else {
      console.log(`🧭 No probe limit; using slot0 as limit`);
    }
  } catch (e) {
    console.warn("⚠️ Tick-probe failed:", e.message || e);
  }

  // --- NEW: detect a fee-free size band (if any) and propose chunking ---
  try {
    const [sqrtP] = await stateView.getSlot0(targetPoolId);
    const midPrice = decodeSqrtPriceX96ToFloat(sqrtP); // USDC per 1 cbBTC

    const quoteIface = await buildQuoterInterface();   // ensure we pass fetched ABI
    const feeFreeChunk = await findMaxZeroFeeChunk({
      poolKey,
      zeroForOne,
      limitX96: BigInt(effectiveLimit),
      quoteIface,
      priceUSDCperBTC: midPrice,
      maxTry: parsedAmount // don’t search beyond your intended size
    });

    if (feeFreeChunk > 0n && feeFreeChunk < parsedAmount) {
      const chunks = (parsedAmount + feeFreeChunk - 1n) / feeFreeChunk;
      console.log(`🎯 Detected fee-free chunk ≈ ${ethers.formatUnits(feeFreeChunk, 8)} cbBTC`);
      console.log(`🧩 Plan: split ${ethers.formatUnits(parsedAmount, 8)} cbBTC into ${chunks} chunk(s) of ≤ ${ethers.formatUnits(feeFreeChunk, 8)} cbBTC`);
      console.log(`   (Use same poolKey/limit/hookData=0x for each sub-quote/swap)`);
    } else if (feeFreeChunk >= parsedAmount) {
      console.log(`🎯 Entire amount appears fee-free at this limit (rare but possible).`);
    } else {
      console.log(`🚫 No fee-free size band detected at this limit.`);
    }
  } catch (e) {
    console.warn("⚠️ fee-free size detection failed:", e.message || e);
  }

  // ✅ Checks
  function assertNotNull(label, val) {
    if (val === null || val === undefined) {
      throw new Error(`❌ ${label} is NULL or UNDEFINED`);
    }
  }
  assertNotNull("userWallet.address", userWallet.address);
  assertNotNull("poolKey.currency0", poolKey.currency0);
  assertNotNull("poolKey.currency1", poolKey.currency1);
  assertNotNull("poolKey.fee", poolKey.fee);
  assertNotNull("poolKey.tickSpacing", poolKey.tickSpacing);
  assertNotNull("poolKey.hooks", poolKey.hooks);
  assertNotNull("amountInCBBTC", amountInCBBTC);
  assertNotNull("sqrtPriceLimitX96", sqrtPriceLimitX96);

  console.log("🧪 Full Encode Sanity Check:");
  console.dir({
    sender: userWallet.address,
    poolKey,
    zeroForOne,
    parsedAmount,
    sqrtPriceLimitX96
  }, { depth: null });

  // Try to improve with hookData variants (same amount + limit)
  // 1) Structured tiny set
  let bestHook = null;
  try {
    bestHook = await searchHookDataForBestQuote({
      poolKey,
      zeroForOne,
      amountInCBBTC: parsedAmount,
      sqrtPriceLimitX96: effectiveLimit,
      user: userWallet.address,
      poolId: targetPoolId,
      callFrom: chosenFrom
    });
    if (bestHook) console.log(`🎯 Structured best → ${bestHook.outHuman?.toFixed?.(6) ?? Number(ethers.formatUnits(bestHook.amountOut,6)).toFixed(6)} USDC`);
  } catch (e) {
    console.warn("⚠️ hookData scan failed:", e.message || e);
  }

  // 2) Brute tiny-random hookData (2 bytes × 1024 = fast)
  let brute = null;
  try {
    brute = await bruteHookDataForBest({
      poolKey,
      zeroForOne,
      amountInCBBTC: parsedAmount,
      sqrtPriceLimitX96: effectiveLimit,
      quoteIface,
      callFrom: chosenFrom,
      rounds: 1024,
      bytes: 2
    });
    if (brute) console.log(`🥊 Brute best → ${brute.out.toFixed(6)} USDC`);
  } catch (e) {
    console.warn("⚠️ bruteHookData failed:", e.message || e);
  }


  // --- BASELINE QUOTE (hookData = 0x), then upgrade with bestHook if better ---
  // --- Baseline (hookData=0x) with chosenFrom
  const baseline = await quoteV4({
    quoteIface,
    poolKey,
    zeroForOne,
    exactAmount: parsedAmount,
    sqrtPriceLimitX96: effectiveLimit,
    hookData: "0x",
    callFrom: chosenFrom
  });
  let chosen = { amountOut: baseline.amountOut, gasEstimate: baseline.gasEstimate, hookData: "0x" };

  // Compare to structured + brute
  const cmp = (x) => (x ? BigInt(x.amountOut ?? x.amountOut) : 0n);
  if (bestHook && cmp(bestHook) > chosen.amountOut) {
    chosen = { amountOut: bestHook.amountOut, gasEstimate: bestHook.gasEstimate, hookData: bestHook.hookData };
    console.log(`✅ Using structured hookData=${bestHook.hookData.slice(0,18)}…`);
  }
  if (brute && BigInt(brute.amountOut) > chosen.amountOut) {
    chosen = { amountOut: brute.amountOut, gasEstimate: brute.gasEstimate, hookData: brute.hookData };
    console.log(`✅ Using brute hookData=${brute.hookData.slice(0,18)}…`);
  }

  console.log(`→ Quoted amountOut: ${ethers.formatUnits(chosen.amountOut, 6)} USDC`);
  console.log(`⛽ Gas estimate (units): ${chosen.gasEstimate.toString()}`);

  // 🔍 Fetch reserves using computed id
  try {
    console.log(`🆔 Pool ID (computed): ${targetPoolId}`);
    const [sqrtPriceX96] = await stateView.getSlot0(targetPoolId);
    const liquidity = await stateView.getLiquidity(targetPoolId);
    const price = decodeSqrtPriceX96ToFloat(sqrtPriceX96);
    const reserves = decodeLiquidityAmountsv4(liquidity, sqrtPriceX96);
    console.log(`📈 sqrtPriceX96: ${sqrtPriceX96}`);
    console.log(`💰 cbBTC/USDC Price: $${price.toFixed(2)}`);
    console.log(`📦 cbBTC Reserve: ${reserves.cbBTC.toFixed(6)} cbBTC`);
    console.log(`📦 USDC Reserve: ${reserves.usdc.toFixed(2)} USDC`);

    const [sqrtPriceX96_2, tick_2, protocolFee2, lpFee2] = await stateView.getSlot0(targetPoolId);
    console.log(`🧾 Post-quote fees (ppm): lpFee=${Number(lpFee2)} protocolFee=${Number(protocolFee2)}`);

    // --- extra experiments you asked for ---
// keep your token order, derive direction the same way you already do
const zeroForOne = poolKey.currency0.toLowerCase() === CBBTC.toLowerCase();

// (a) Initialized-tick probe (try to land near bands)
try {
  await probeByInitializedTicks({
    poolId: targetPoolId,
    poolKey,
    amountInCBBTC: parsedAmount,       // use the SAME amount you input
    userWantsZeroForOne: zeroForOne
  });
  if (!bestProbe) {
    const tickSpacingNum = Number(poolKey.tickSpacing);
    const [, curTick] = await getSlot0FromStateView(targetPoolId);
    const baseTick = Math.floor(Number(curTick) / tickSpacingNum) * tickSpacingNum;

    const sweepBest = await sweepArithmeticTicks({
      poolId: targetPoolId,
      poolKey,
      amountInCBBTC: parsedAmount,
      zeroForOne,
      baseTick,
      tickSpacing: tickSpacingNum,
      steps: 80
    });

    if (sweepBest && sweepBest.outHuman > Number(ethers.formatUnits(amountOut ?? 0n, 6))) {
      effectiveLimit = sweepBest.sqrtLimit;
      console.log(`🧭 Using sweep limit sqrtPriceLimitX96=${effectiveLimit.toString()}`);
    }
  }
} catch (e) {
  console.warn("⚠️ Tick-probe failed:", e.message || e);
}

// --- NEW: detect a fee-free size band (if any) and propose chunking ---
try {
  const [sqrtP] = await stateView.getSlot0(targetPoolId);
  const midPrice = decodeSqrtPriceX96ToFloat(sqrtP); // USDC per 1 cbBTC

  const quoteIface = await buildQuoterInterface();   // ensure we pass fetched ABI
  const feeFreeChunk = await findMaxZeroFeeChunk({
    poolKey,
    zeroForOne,
    limitX96: BigInt(effectiveLimit),
    quoteIface,
    priceUSDCperBTC: midPrice,
    maxTry: parsedAmount // don’t search beyond your intended size
  });

  if (feeFreeChunk > 0n && feeFreeChunk < parsedAmount) {
    const chunks = (parsedAmount + feeFreeChunk - 1n) / feeFreeChunk;
    console.log(`🎯 Detected fee-free chunk ≈ ${ethers.formatUnits(feeFreeChunk, 8)} cbBTC`);
    console.log(`🧩 Plan: split ${ethers.formatUnits(parsedAmount, 8)} cbBTC into ${chunks} chunk(s) of ≤ ${ethers.formatUnits(feeFreeChunk, 8)} cbBTC`);
    console.log(`   (Use same poolKey/limit/hookData=0x for each sub-quote/swap)`);
  } else if (feeFreeChunk >= parsedAmount) {
    console.log(`🎯 Entire amount appears fee-free at this limit (rare but possible).`);
  } else {
    console.log(`🚫 No fee-free size band detected at this limit.`);
  }
} catch (e) {
  console.warn("⚠️ fee-free size detection failed:", e.message || e);
}

// (b) Time-separated quotes (rare promo windows)
try {
  await timeSeparatedQuotes({
    poolKey,
    poolId: targetPoolId,
    amountInCBBTC: parsedAmount,
    zeroForOne,
    rounds: 3,              // do 3 spaced quotes
    minBlocksBetween: 1     // wait ≥1 new block between quotes
  });
} catch (e) {
  console.warn("⚠️ Time-separated quotes failed:", e.message || e);
}
  } catch (e) {
    console.warn("⚠️ Could not fetch reserves/price:", e.message || e);
  }
}




async function main() {
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

    const liquidity = await getLiquidity(pool.poolId);
    if (liquidity === 0n) {
      console.log(`🚫 Skipping ${pool.label} — pool has zero global liquidity.`);
    } else {
      await simulateWithV4QuoterPoolA(poolKey, pool.poolId, amountInCBBTC, 0n);
    }
  }
}

main().catch(console.error);


//to test run: yarn hardhat run test/cbbtc_mass_test.js --network base
