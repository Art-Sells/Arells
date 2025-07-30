
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
const V4_POOL_A_HOOK_ADDRESS = "0x5cd525c621AFCa515Bf58631D4733fbA7B72Aae4";
const V4_POOL_B_HOOK_ADDRESS = "0x0000000000000000000000000000000000000000";
const STATE_VIEW_ADDRESS = "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71";
const V4_QUOTER_ADDRESS = "0x0d5e0f971ed27fbff6c2837bf31316121532048d";

const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const stateViewABI = [
  "function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96, int24 tick, uint16 protocolFee, uint16 lpFee)",
  "function getLiquidity(bytes32 poolId) view returns (uint128)"
];

const stateView = new ethers.Contract(STATE_VIEW_ADDRESS, stateViewABI, provider);
const V4_POOL_IDS = [
  {
    label: "V4 A (0.3%)",
    poolId: "0x64f978ef116d3c2e1231cfd8b80a369dcd8e91b28037c9973b65b59fd2cbbb96", 
    hooks: getAddress(V4_POOL_A_HOOK_ADDRESS), 
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


async function simulateWithV4Quoter(poolKey, computedPoolId, amountInCBBTC, sqrtPriceLimitX96 = 0n) {
  const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
  console.log(`✅ Using userWallet for quote simulation`);

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
  const zeroForOne = true; // cbBTC → USDC
  const signedAmountIn = zeroForOne ? BigInt(amountInCBBTC) : -BigInt(amountInCBBTC);
  const hookData = "0x";

  // Fetch ABI from BaseScan or static file (you can cache locally for performance)
  async function fetchABI(address) {
    const apiKey = process.env.BASESCAN_API_KEY;
    const url = `https://api.basescan.org/api?module=contract&action=getabi&address=${address}&apikey=${apiKey}`;
    const response = await axios.get(url);
    if (response.data.status !== "1") throw new Error("Failed to fetch ABI from BaseScan");
    return JSON.parse(response.data.result);
  }

  // Inside simulateWithV4Quoter:
  const quoterABI = await fetchABI(V4_QUOTER_ADDRESS);
  const quoteIface = new ethers.Interface(quoterABI);

  console.log("🚧 DEBUG INPUT for quoteExactInputSingle:");
  console.dir({
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
      zeroForOne: true,
      amountSpecified: signedAmountIn,
      sqrtPriceLimitX96,
    }
  }, { depth: null });

  // ✅ Encode manually like we did for exactInputSingle
  const calldata = quoteIface.encodeFunctionData("quoteExactInputSingle", [{
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
      zeroForOne: true,
      amountSpecified: signedAmountIn,
      sqrtPriceLimitX96,
    }
  }]);
  
  const result = await provider.call({ to: V4_QUOTER_ADDRESS, data: calldata });
  const [amountOut, sqrtPriceAfter, tickAfter] = quoteIface.decodeFunctionResult("quoteExactInputSingle", result);
  
  console.log(`→ Quoted amountOut: ${ethers.formatUnits(amountOut, 6)} USDC`);
  console.log(`📈 sqrtPriceX96 After: ${sqrtPriceAfter}`);
  console.log(`📊 Tick After: ${tickAfter}`);

  // 🔍 Fetch reserves using computedPoolId
  try {
    console.log(`🆔 Computed Pool ID: ${computedPoolId}`);
    const [sqrtPriceX96] = await stateView.getSlot0(computedPoolId);
    const liquidity = await stateView.getLiquidity(computedPoolId);

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
  const amountInCBBTC = ethers.parseUnits("0.000023", 8);

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

    // 🔒 Compute poolId manually from poolKey
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
    const computedPoolId = ethers.keccak256(encodedKey);

    console.log(`\n🔎 ${pool.label}`);
    console.log(`• Manual poolId:   ${pool.poolId}`);
    console.log(`• Computed poolId: ${computedPoolId}`);

    if (computedPoolId.toLowerCase() === pool.poolId.toLowerCase()) {
      console.log("✅ Match! The computed poolId is correct.");
    } else {
      console.log("❌ Mismatch! Check token order, fee, spacing, and hook.");
      continue; // ⛔ Skip simulation if mismatch
    }

    const liquidity = await getLiquidity(pool.poolId);
    if (liquidity === 0n) {
      console.log(`🚫 Skipping ${pool.label} — pool has zero global liquidity.`);
    } else {
      await simulateWithV4Quoter(poolKey, computedPoolId, amountInCBBTC);
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

