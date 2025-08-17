
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
  quoteIface,
  poolKey,
  zeroForOne,
  exactAmount,
  hookData = "0x",
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
    hookData
  }]);

  const raw = await provider.call({ to: V4_QUOTER_ADDRESS, data: calldata });
  const [amountOut, gasEstimate] = quoteIface.decodeFunctionResult("quoteExactInputSingle", raw);
  return { amountOut, gasEstimate };
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
  amountInCBBTC,      // BigInt (cbBTC base units, 8dp)
  userWantsZeroForOne // from your fixed token order test
}) {
  const quoteIface = await buildQuoterInterface();

  // current state
  const [sqrtP, tick] = await getSlot0FromStateView(poolId); // sqrtPriceX96, current tick
  const L = await getLiquidity(poolId);

  const zeroForOne = userWantsZeroForOne; // do NOT change token order per your rule
  const tickSpacing = Number(poolKey.tickSpacing);
  const baseTick = Math.floor(Number(tick) / tickSpacing) * tickSpacing;

  const inHuman = Number(ethers.formatUnits(amountInCBBTC, 8));
  console.log(`🔎 Tick-probe around tick=${Number(tick)} (base=${baseTick}), in=${inHuman} cbBTC`);

  const initTicks = await getNearbyInitializedTicks(poolId, tickSpacing, baseTick, 2);
  if (initTicks.length === 0) {
    console.log("⚠️ No initialized ticks found nearby; skipping probe.");
    return null;
  }

  // Choose a small window of bands around current
  const window = initTicks.filter(t => Math.abs(t - baseTick) <= tickSpacing * 6);

  const candidates = [];
  for (const t of window) {
    // pick a sqrt target a hair inside the band we want to “end near”
    // for zeroForOne (price down), we need sqrtQ just BELOW sqrtP
    // for oneForZero (price up), sqrtQ just ABOVE sqrtP
    const sqrtTarget = tickToSqrtRatioX96(t + (zeroForOne ? -1 : +1));

    let estInBase;
    if (zeroForOne) {
      if (sqrtTarget >= sqrtP) continue; // invalid direction
      // amountIn is cbBTC? In your fixed order, you’re swapping cbBTC->USDC,
      // so cbBTC is token0 or token1 depending on addresses. We keep your direction:
      // For zeroForOne, formula uses token0-in; if your cbBTC is token0, this matches.
      estInBase = amount0ForPriceMove(BigInt(sqrtP), sqrtTarget, BigInt(L));
    } else {
      if (sqrtTarget <= sqrtP) continue;
      estInBase = amount1ForPriceMove(BigInt(sqrtP), sqrtTarget, BigInt(L));
    }

    // floor/clip to a sane range: 0 < est <= 5x user amount
    if (estInBase <= 0n) continue;
    const maxEst = amountInCBBTC * 5n;
    const est = estInBase > maxEst ? maxEst : estInBase;

    try {
      const { amountOut, gasEstimate } = await quoteV4({
        quoteIface, poolKey, zeroForOne, exactAmount: est, hookData: "0x"
      });
      const outHuman = Number(ethers.formatUnits(amountOut, 6));
      candidates.push({
        tick: t,
        estIn: est,
        outHuman,
        gas: gasEstimate
      });
      console.log(`✅ tick ${t} → estIn≈${Number(ethers.formatUnits(est, 8)).toFixed(6)} cbBTC → out≈${outHuman.toFixed(6)} USDC (gas=${gasEstimate})`);
    } catch (e) {
      // ignore individual failures
    }
  }

  if (!candidates.length) {
    console.log("⚠️ No viable tick-limited amounts produced a quote.");
    return null;
  }

  // Best by amountOut
  candidates.sort((a, b) => (a.outHuman > b.outHuman ? -1 : 1));
  const best = candidates[0];

  console.log(`🏁 Tick-probe best @ tick ${best.tick} | in≈${Number(ethers.formatUnits(best.estIn, 8)).toFixed(6)} cbBTC → out≈${best.outHuman.toFixed(6)} USDC`);
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



async function simulateWithV4QuoterPoolA(poolKey, poolId, amountInCBBTC, sqrtPriceLimitX96 = 0n) {
  const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
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
    const [currentSqrtPriceX96] = await stateView.getSlot0(targetPoolId);
    sqrtPriceLimitX96 = currentSqrtPriceX96;
    console.log("📈 Current sqrtPriceX96:", currentSqrtPriceX96.toString());
    console.log("📈 Applied sqrtPriceLimitX96:", sqrtPriceLimitX96.toString());
  } catch (e) {
    console.warn("⚠️ Failed to fetch slot0. Falling back to 0n sqrtPriceLimitX96");
    sqrtPriceLimitX96 = 0n;
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

  const calldata = quoteIface.encodeFunctionData("quoteExactInputSingle", [{
    poolKey: {
      currency0: poolKey.currency0,
      currency1: poolKey.currency1,
      fee: BigInt(poolKey.fee),
      tickSpacing: BigInt(poolKey.tickSpacing),
      hooks: poolKey.hooks,
    },
    zeroForOne,
    exactAmount: parsedAmount,
    hookData
  }]);

  const result = await provider.call({ to: V4_QUOTER_ADDRESS, data: calldata });
  const [amountOut, gasEstimate] = quoteIface.decodeFunctionResult("quoteExactInputSingle", result);
  console.log(`→ Quoted amountOut: ${ethers.formatUnits(amountOut, 6)} USDC`);
  console.log(`⛽ Gas estimate (units): ${gasEstimate.toString()}`);

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
} catch (e) {
  console.warn("⚠️ Tick-probe failed:", e.message || e);
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

// The v4 quote() function doesn’t take poolId as input
// if above fails, 
// look for other public quote functions with external from quoter

// It takes:
// 	•	A poolKey (token0, token1, fee, tickSpacing, hook)
// 	•	Then internally computes the poolId using that key
// 	•	And tries to find the pool on-chain
