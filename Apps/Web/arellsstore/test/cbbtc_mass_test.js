
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


const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);


//V3 Quoter

dotenv.config();

// ✅ Uniswap Contract Addresses
const QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
const FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";

const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
console.log(`✅ Using Test Wallet: ${userWallet.address}`);

const USDCContract = new ethers.Contract(USDC, [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address, uint256)",
  "function allowance(address, address) view returns (uint256)"
], userWallet);


async function fetchABI(contractAddress) {
  try {
      console.log(`🔍 Fetching ABI for ${contractAddress} from BaseScan...`);
      const response = await axios.get(
          `https://api.basescan.org/api?module=contract&action=getabi&address=${contractAddress}&apikey=${process.env.BASESCAN_API_KEY}`
      );

      if (response.data.status !== "1") throw new Error(`BaseScan API Error: ${response.data.message}`);

      const abi = JSON.parse(response.data.result);

      return abi;
  } catch (error) {
      console.error("❌ Failed to fetch ABI:", error.message);
      return null;
  }
}

async function getPoolAddress() {
    const factoryABI = await fetchABI(FACTORY_ADDRESS);
    if (!factoryABI) return null;

    const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);
    const feeTiers = [500]; // 0.01%, 0.05%, 0.3%, 1%

    for (let fee of feeTiers) {
        try {
            const poolAddress = await factory.getPool(USDC, CBBTC, fee);
            if (poolAddress !== ethers.ZeroAddress) {
                console.log(`✅ Found Pool for fee tier ${fee}: ${poolAddress}`);
                return { poolAddress, fee };
            }
        } catch (error) {
            console.warn(`⚠️ Failed to get pool for fee tier ${fee}: ${error.message}`);
        }
    }

    console.error("❌ No Uniswap V3 Pool found for USDC-CBBTC.");
    return null;
}

async function checkPoolLiquidity(poolAddress) {
  const poolABI = await fetchABI(poolAddress);
  if (!poolABI) return null;
  const pool = new ethers.Contract(poolAddress, poolABI, provider);
  try {
    const slot0 = await pool.slot0();
    const liquidity = await pool.liquidity();
    const tickSpacing = await pool.tickSpacing();
    console.log("\n🔍 Pool Liquidity Data:");
    console.log(`   - sqrtPriceX96: ${slot0[0]}`);
    console.log(`   - Current Tick: ${slot0[1]}`);
    console.log(`   - Liquidity: ${liquidity}`);
    console.log(`   - Tick Spacing: ${tickSpacing}`);
    return { liquidity, sqrtPriceX96: slot0[0], tick: slot0[1], tickSpacing };
  } catch (error) {
    console.error("❌ Failed to fetch liquidity:", error.message);
    return null;
  }
}


async function simulateWithV3Quoter(params) {
  const quoterABI = await fetchABI(QUOTER_ADDRESS);
  if (!quoterABI) return null;

  const iface = new ethers.Interface(quoterABI);

  const functionData = iface.encodeFunctionData("quoteExactInputSingle", [{
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    fee: params.fee,
    amountIn: params.amountIn,
    sqrtPriceLimitX96: params.sqrtPriceLimitX96
  }]);

  try {
    const result = await provider.call({
      to: QUOTER_ADDRESS,
      data: functionData
    });

    const [amountOut] = iface.decodeFunctionResult("quoteExactInputSingle", result);
    console.log(`🔁 Simulated amountOut: ${ethers.formatUnits(amountOut, 6)} USDC`);
    return amountOut;
  } catch (err) {
    console.warn("⚠️ QuoterV2 simulation failed:", err.reason || err.message || err);
    return null;
  }
}










// V4 Quoter



const V4_POOL_MANAGER = "0x498581fF718922c3f8e6A244956aF099B2652b2b";
const V4_POOL_AB_HOOK_ADDRESS = "0x5cd525c621AFCa515Bf58631D4733fbA7B72Aae4";
const STATE_VIEW_ADDRESS = "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71";
const V4_QUOTER_ADDRESS = "0x0d5e0f971ed27fbff6c2837bf31316121532048d";


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

function safeBigInt(value, label = "value") {
  if (value === null || value === undefined) {
    console.trace(`❌ CRITICAL: ${label} is null or undefined`);
    throw new Error(`❌ Invalid BigInt input: ${label} is null or undefined`);
  }
  if (typeof value === "bigint") return value; // ✅ already valid
  try {
    return BigInt(value);
  } catch (e) {
    console.error(`❌ Failed to convert ${label} to BigInt. Value:`, value);
    throw e;
  }
}

async function simulateWithV4QuoterPoolA(poolKey, poolId, amountInCBBTC, sqrtPriceLimitX96 = 0n) {
  const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
  console.log(`✅ Using userWallet for Pool B quote simulation`);

  // 🔹 Check cbBTC Balance
  const erc20ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];
  const cbBtcContract = new ethers.Contract(CBBTC, erc20ABI, provider);
  const balance = await cbBtcContract.balanceOf(userWallet.address);
  const formattedBalance = ethers.formatUnits(balance, 8);
  console.log(`💰 CBBTC Balance: ${formattedBalance} CBBTC`);

  // 🔹 Prepare Quote Params
  const zeroForOne = poolKey.currency0.toLowerCase() === CBBTC.toLowerCase();
  const signedAmountIn = BigInt(amountInCBBTC);
  const hookData = "0x";

  // Fetch ABI from BaseScan or static file (you can cache locally for performance)
  async function fetchABI(address) {
    const apiKey = process.env.BASESCAN_API_KEY;
    const url = `https://api.basescan.org/api?module=contract&action=getabi&address=${address}&apikey=${apiKey}`;
    const response = await axios.get(url);
    if (response.data.status !== "1") throw new Error("Failed to fetch ABI from BaseScan");
  
    const abi = JSON.parse(response.data.result);
  
    // 🔍 Log the quoteExactInputSingle function ABI
    const quoteFragment = abi.find(
      (entry) => entry.name === "quoteExactInputSingle" && entry.type === "function"
    );
    console.log("🔍 quoteExactInputSingle ABI fragment:", quoteFragment);
  
    return abi;
  }

  console.log("🔍 signedAmountIn =", signedAmountIn);
  console.log("🔍 sqrtPriceLimitX96 =", sqrtPriceLimitX96);

  // Inside simulateWithV4Quoter:
  const quoterABI = await fetchABI(V4_QUOTER_ADDRESS);
  const quoteIface = new ethers.Interface(quoterABI);

  const parsedAmount = BigInt(amountInCBBTC);

  // 🔹 Fetch current slot0 price from StateView
  try {
    const [currentSqrtPriceX96] = await stateView.getSlot0(poolId);
    sqrtPriceLimitX96 = currentSqrtPriceX96;

    console.log("📈 Current sqrtPriceX96:", currentSqrtPriceX96.toString());
    console.log("📈 Applied sqrtPriceLimitX96:", sqrtPriceLimitX96.toString());
  } catch (e) {
    console.warn("⚠️ Failed to fetch slot0. Falling back to 0n sqrtPriceLimitX96");
    sqrtPriceLimitX96 = 0n;
  }

  console.log("✅ Pre-Encode Sanity Check:");
  console.dir({
    encodingCall: {
      sender: userWallet.address,
      poolKey: {
        currency0: poolKey.currency0,
        currency1: poolKey.currency1,
        fee: poolKey.fee,
        tickSpacing: poolKey.tickSpacing,
        hooks: poolKey.hooks,
      },
      hookData: "0x",
      params: {
        zeroForOne,
        amountSpecified: parsedAmount,
        sqrtPriceLimitX96: sqrtPriceLimitX96,
      },
    },
    types: {
      sender: typeof userWallet.address,
      currency0: typeof poolKey.currency0,
      currency1: typeof poolKey.currency1,
      fee: typeof poolKey.fee,
      tickSpacing: typeof poolKey.tickSpacing,
      hooks: typeof poolKey.hooks,
      zeroForOne: typeof true,
      amountSpecified: typeof amountInCBBTC,
      sqrtPriceLimitX96: typeof sqrtPriceLimitX96,
    },
  }, { depth: null });
  
  if (
    !userWallet.address ||
    !poolKey.currency0 ||
    !poolKey.currency1 ||
    poolKey.fee == null ||
    poolKey.tickSpacing == null ||
    !poolKey.hooks ||
    amountInCBBTC == null
  ) {
    throw new Error("❌ One or more required quote parameters are null or undefined.");
  }
  console.log(`🧪 amountInCBBTC at quote time:`, amountInCBBTC);
  if (amountInCBBTC === null || amountInCBBTC === undefined || typeof amountInCBBTC !== 'bigint') {
    throw new Error(`❌ amountInCBBTC is invalid or not a BigInt: ${amountInCBBTC}`);
  }
  const amountSpecified = BigInt(amountInCBBTC);
  console.log("✅ amountSpecified:", amountSpecified);

  console.log("🧪 Full Encode Sanity Check:");
  console.log("sender:", userWallet.address);
  console.log("currency0:", poolKey.currency0);
  console.log("currency1:", poolKey.currency1);
  console.log("fee:", poolKey.fee, typeof poolKey.fee);
  console.log("tickSpacing:", poolKey.tickSpacing, typeof poolKey.tickSpacing);
  console.log("hooks:", poolKey.hooks);
  console.log("zeroForOne:", true);
  console.log("amountSpecified:", amountInCBBTC, typeof amountInCBBTC);
  console.log("sqrtPriceLimitX96:", sqrtPriceLimitX96, typeof sqrtPriceLimitX96);

  function assertNotNull(label, val) {
    if (val === null || val === undefined) {
      throw new Error(`❌ ${label} is NULL or UNDEFINED`);
    }
  }

  // Check sender
  assertNotNull("userWallet.address", userWallet.address);

  // Check poolKey fields
  assertNotNull("poolKey.currency0", poolKey.currency0);
  assertNotNull("poolKey.currency1", poolKey.currency1);
  assertNotNull("poolKey.fee", poolKey.fee);
  assertNotNull("poolKey.tickSpacing", poolKey.tickSpacing);
  assertNotNull("poolKey.hooks", poolKey.hooks);

  // Check params
  assertNotNull("zeroForOne", zeroForOne);
  assertNotNull("amountInCBBTC", amountInCBBTC);
  assertNotNull("sqrtPriceLimitX96", sqrtPriceLimitX96);

  const encodeInput = {
    sender: userWallet.address,
    poolKey,
    hookData: "0x",
    params: {
      zeroForOne: true,
      amountSpecified: parsedAmount,
      sqrtPriceLimitX96,
    },
  };
  
  console.log("✅ Final object being passed to encodeFunctionData:");
  console.dir(encodeInput, { depth: null });
  
  for (const [section, obj] of Object.entries(encodeInput)) {
    if (typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj)) {
        console.log(`${section}.${k} =`, v, `(type: ${typeof v})`);
        if (v == null) throw new Error(`❌ ${section}.${k} is ${v}`);
      }
    } else {
      console.log(`${section} =`, obj, `(type: ${typeof obj})`);
      if (obj == null) throw new Error(`❌ ${section} is ${obj}`);
    }
  }
  
  const calldata = quoteIface.encodeFunctionData("quoteExactInputSingle", [{
    poolKey: {
      currency0: poolKey.currency0,
      currency1: poolKey.currency1,
      fee:       BigInt(poolKey.fee),
      tickSpacing: BigInt(poolKey.tickSpacing),
      hooks:     poolKey.hooks,
    },
    zeroForOne,                          // true if swapping currency0 -> currency1
    exactAmount: parsedAmount,            // uint128, POSITIVE
    hookData: "0x",
  }]);
  
  const result = await provider.call({ to: V4_QUOTER_ADDRESS, data: calldata });
  const [amountOut, gasEstimate] = quoteIface.decodeFunctionResult("quoteExactInputSingle", result);
  
  console.log(`→ Quoted amountOut: ${ethers.formatUnits(amountOut, 6)} USDC`);
  console.log(`⛽ Gas estimate (units): ${gasEstimate.toString()}`);

  // 🔍 Fetch reserves using poolId
  try {
    console.log(`🆔 Pool ID: ${poolId}`);
    const [sqrtPriceX96] = await stateView.getSlot0(poolId);
    const liquidity = await stateView.getLiquidity(poolId);

    const price = decodeSqrtPriceX96ToFloat(sqrtPriceX96);
    const reserves = decodeLiquidityAmountsv4(liquidity, sqrtPriceX96);

    console.log(`📈 sqrtPriceX96: ${sqrtPriceX96}`);
    console.log(`💰 cbBTC/USDC Price: $${price.toFixed(2)}`);
    console.log(`📦 cbBTC Reserve: ${reserves.cbBTC.toFixed(6)} cbBTC`);
    console.log(`📦 USDC Reserve: ${reserves.usdc.toFixed(2)} USDC`);
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

