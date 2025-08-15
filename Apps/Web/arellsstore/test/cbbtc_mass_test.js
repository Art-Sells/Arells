
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

// 🔹 Helper to fetch PoolKey from poolId
async function fetchPoolKeyFromId(poolManager, poolId) {
  const poolKey = await poolManager.getPoolKey(poolId);
  console.log("🔍 On-chain PoolKey for", poolId, ":", poolKey);
  return poolKey;
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



// --- V4 quoter "quote" with explicit sqrtPriceLimitX96 (lets us probe specific ticks) ---
async function simulateWithV4QuoterAtLimit({
  poolKey,            // {currency0, currency1, fee, tickSpacing, hooks}
  zeroForOne,         // true: token0->token1
  amountInCBBTC,      // uint128 (8 dp base units)
  sqrtPriceLimitX96,  // uint160 limit
  sender,             // address
}) {
  const abi = ["function quote(address sender, bytes hookData, bytes inputData) view returns (bytes)"];
  const quoter = new ethers.Contract(V4_QUOTER_ADDRESS, abi, provider);
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();

  // match PoolManager.swap params encoding the V4 Quoter expects
  const inputData = abiCoder.encode(
    [
      "tuple(address currency0, address currency1, uint24 fee, address hooks, int24 tickSpacing)", // PoolKey
      "address",   // sender (ignored for read)
      "bool",      // zeroForOne
      "int256",    // amountSpecified (positive => exact input)
      "uint160",   // sqrtPriceLimitX96
      "bytes",     // hookData
    ],
    [
      [ poolKey.currency0, poolKey.currency1, poolKey.fee, poolKey.hooks, poolKey.tickSpacing ],
      ethers.ZeroAddress, // or sender, not relevant in quote()
      zeroForOne,
      BigInt(amountInCBBTC),
      BigInt(sqrtPriceLimitX96),
      "0x"
    ]
  );

  const raw = await quoter.quote(sender, "0x", inputData);
  // The v4 quoter returns encoded bytes; for single-hop exact input this decodes to (uint256 amountOut)
  const [amountOut] = abiCoder.decode(["uint256"], raw);
  return amountOut; // bigint
}

// --- scan initialized ticks in current bitmap word & probe them with the quoter ---
async function probeInitializedTicksForFeeFreeV4({
  poolId,
  poolKey,
  amountInHuman,       // e.g. 1 for "1 cbBTC"
  maxCandidates = 12,  // probe up to this many nearest initialized ticks
}) {
  const sender = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider).address;

  // read slot0 + lpFee & basic direction
  const [sqrtX, tick, , lpFee] = await stateView.getSlot0(poolId);
  const zeroForOne = poolKey.currency0.toLowerCase() === CBBTC.toLowerCase();
  const spacing = Number(poolKey.tickSpacing);
  const currentTick = Number(tick);
  const baseWord = Math.trunc(currentTick / spacing / 256); // same approach as your bitmap reader

  // pull initialized ticks in this word
  const bitmap = await getTickBitmap(poolId, baseWord);
  const initTicks = getInitializedTicksFromBitmap(bitmap, baseWord, spacing);

  if (!initTicks.length) {
    console.log("⚠️ No initialized ticks found in the current word.");
    return [];
  }

  // sort by distance to current tick & keep the closest few, respecting direction
  const dirFilter = zeroForOne
    ? (t) => t <= currentTick  // for token0->token1, price moves to lower ticks
    : (t) => t >= currentTick; // token1->token0 moves to higher ticks

  const candidates = initTicks
    .filter(dirFilter)
    .sort((a, b) => Math.abs(a - currentTick) - Math.abs(b - currentTick))
    .slice(0, maxCandidates);

  console.log(`🧵 Initialized ticks (nearest, dir-filtered): ${candidates.join(", ")}`);
  console.log(`🔎 lpFee now: ${lpFee} (0 == fee-free) | currentTick: ${currentTick}`);

  const amountInCBBTC = ethers.parseUnits(String(amountInHuman), 8);
  const results = [];

  for (const t of candidates) {
    let limit;
    try {
      // Use v3 TickMath to compute the sqrt limit for that tick
      limit = BigInt(TickMath.getSqrtRatioAtTick(t).toString());
    } catch (e) {
      console.warn(`⚠️ skip tick ${t}: ${e.message}`);
      continue;
    }

    try {
      const out = await simulateWithV4QuoterAtLimit({
        poolKey,
        zeroForOne,
        amountInCBBTC,
        sqrtPriceLimitX96: limit,
        sender,
      });
      const outHuman = Number(ethers.formatUnits(out, 6));
      console.log(`✅ tick ${t}: out ≈ ${outHuman.toFixed(6)} USDC (limit=${limit})`);
      results.push({ tick: t, limit, amountOut: out, outHuman });
    } catch (err) {
      console.log(`❌ tick ${t} revert:`, err.reason || err.message || err);
    }
  }

  // pick best by amountOut
  results.sort((a, b) => (a.amountOut > b.amountOut ? -1 : 1));
  if (results[0]) {
    const best = results[0];
    console.log(`🏁 Best initialized-tick probe → tick ${best.tick} | ${best.outHuman.toFixed(6)} USDC`);
  } else {
    console.log("😕 No successful quotes at probed initialized ticks.");
  }

  return results;
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


    const liq = await getLiquidity(pool.poolId);
    if (liq === 0n) {
      console.log(`🚫 Skipping ${pool.label} — zero global liquidity.`);
      continue;
    }
  
    console.log(`\n🚀 Checking initialized-tick fee-free probes for ${pool.label} …`);
    await probeInitializedTicksForFeeFreeV4({
      poolId: pool.poolId,
      poolKey: {
        currency0: CBBTC.toLowerCase() < USDC.toLowerCase() ? CBBTC : USDC,
        currency1: CBBTC.toLowerCase() < USDC.toLowerCase() ? USDC : CBBTC,
        fee: BigInt(pool.fee),
        tickSpacing: BigInt(pool.tickSpacing),
        hooks: pool.hooks,
      },
      amountInHuman: 1,      // try with your actual input size (in cbBTC units)
      maxCandidates: 12,     // adjust if you want to probe more
    });

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
