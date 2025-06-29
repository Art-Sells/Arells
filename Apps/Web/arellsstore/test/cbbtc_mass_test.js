import { ethers, toBeHex, zeroPadValue } from "ethers"; 
import dotenv from "dotenv";
import axios from "axios";
import { TickMath } from "@uniswap/v3-sdk";
import { keccak256, encodePacked, getAddress } from "viem";
import { exitCode } from "process";
import { unlink } from "fs";



dotenv.config();





const V4_POOL_MANAGER = "0x498581fF718922c3f8e6A244956aF099B2652b2b"; 
const V4_HOOK_ADDRESS = "0x5cd525c621AFCa515Bf58631D4733fbA7B72Aae4";
const STATE_VIEW_ADDRESS = "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71";
const V4_QUOTER_ADDRESS = "0x0d5e0f971ed27fbff6c2837bf31316121532048d";
const V4_POOL_IDS = [
  {
    label: "V4 A (0.3%)",
    poolId: "0x64f978ef116d3c2e1231cfd8b80a369dcd8e91b28037c9973b65b59fd2cbbb96",
    poolAddress: "0x64f978ef116d3c2e1231cfd8b80a369dcd8e91b28037c9973b65b59fd2cbbb96", // same for now
    hooks: V4_HOOK_ADDRESS,
  },
  {
    label: "V4 B (0.3%)",
    poolId: "0x179492f1f9c7b2e2518a01eda215baab8adf0b02dd3a90fe68059c0cac5686f5",
    poolAddress: "0x179492f1f9c7b2e2518a01eda215baab8adf0b02dd3a90fe68059c0cac5686f5",
    hooks: V4_HOOK_ADDRESS,
  },
];

// ✅ Token Addresses
const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

// ✅ Set Up Ethereum Provider & Wallet
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
// const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);

const stateViewInterface = new ethers.Interface([
  "function simulateSwap((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks) key,bool zeroForOne,int256 amountSpecified,uint160 sqrtPriceLimitX96,bytes hookData) view returns (int256 amount0, int256 amount1, uint160 sqrtPriceX96After, int24 tickAfter, uint128 liquidityAfter)"
]);


const stateViewTickInterface = new ethers.Interface([
  "function getPoolTickSpacing(bytes32 poolId) view returns (int24)"
]);

async function getTickSpacingFromStateView(poolId) {
  const callData = stateViewTickInterface.encodeFunctionData("getPoolTickSpacing", [poolId]);
  const result = await provider.call({
    to: STATE_VIEW_ADDRESS,
    data: callData,
  });
  const [tickSpacing] = stateViewTickInterface.decodeFunctionResult("getPoolTickSpacing", result);
  console.log("✅ Tick Spacing (StateView):", tickSpacing.toString());
  return tickSpacing;
}



async function simulateWithV4Quoter(poolKey, amountIn, customPrivateKey = null, sqrtPriceLimitX96) {
  const privateKeyToUse = customPrivateKey || process.env.PRIVATE_KEY_TEST;
  const userWallet = new ethers.Wallet(privateKeyToUse, provider);
  console.log(`✅ Using Test Wallet: ${userWallet.address}`);

  // Fetch balances
  const CBBTCContract = new ethers.Contract(CBBTC, ["function balanceOf(address) view returns (uint256)"], userWallet);
  const cbbtcBalanceRaw = await CBBTCContract.balanceOf(userWallet.address);
  const ethBalanceRaw = await provider.getBalance(userWallet.address);
  console.log(`💰 CBBTC Balance: ${ethers.formatUnits(cbbtcBalanceRaw, 8)} CBBTC`);
  console.log(`💰 ETH Balance: ${ethers.formatEther(ethBalanceRaw)} ETH`);

  const zeroForOne = false;

  const abiCoder = ethers.AbiCoder.defaultAbiCoder();

  const encodedKey = abiCoder.encode(
    ["address", "address", "uint24", "int24", "address"],
    [
      poolKey.currency0,
      poolKey.currency1,
      poolKey.fee,
      poolKey.tickSpacing,
      poolKey.hooks
    ]
  );

  console.log("🔍 Step 1 — Encoded `poolKey`:", encodedKey);

  const decodedKey = abiCoder.decode(
    ["address", "address", "uint24", "int24", "address"],
    encodedKey
  );

  console.log("✅ Decoded `poolKey`:");
  console.log("→ currency0:", decodedKey[0]);
  console.log("→ currency1:", decodedKey[1]);
  console.log("→ fee:", decodedKey[2].toString());
  console.log("→ tickSpacing:", decodedKey[3].toString());
  console.log("→ hooks:", decodedKey[4]);

  const hookData = abiCoder.encode(["bytes"], ["0x"]);
  
  const encodedSwapParams = abiCoder.encode(
    ["bytes", "address", "bool", "int256", "uint160", "bytes"],
    [
      encodedKey,
      ethers.ZeroAddress,         // sender
      zeroForOne,
      amountIn,                   // input direction
      sqrtPriceLimitX96,
      hookData
    ]
  );

  console.log("🔍 Step 2 — Encoded Swap Params:", encodedSwapParams);

  const decodedSwap = abiCoder.decode(
    ["bytes", "address", "bool", "int256", "uint160", "bytes"],
    encodedSwapParams
  );

  console.log("✅ Decoded Swap Params:");
  console.log("→ encodedKey:", decodedSwap[0]);
  console.log("→ sender:", decodedSwap[1]);
  console.log("→ zeroForOne:", decodedSwap[2]);
  console.log("→ amountSpecified:", decodedSwap[3].toString());
  console.log("→ sqrtPriceLimitX96:", decodedSwap[4].toString());
  console.log("→ hookData:", decodedSwap[5]);
  
  const quoter = new ethers.Contract(
    V4_QUOTER_ADDRESS,
    ["function quote(address sender, bytes hookData, bytes inputData) view returns (bytes)"],
    userWallet
  );
  
  const result = await quoter.quote(
    ethers.ZeroAddress,
    hookData,
    encodedSwapParams
  );

  console.log("✅ callStatic.quote success:");
  console.log("→ raw outputData:", result);

  // decode output
  const [amountOut] = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], result);
  console.log("→ decoded amountOut:", amountOut.toString());
}

async function main() {

  const [currency0, currency1] = [USDC, CBBTC].sort((a, b) =>
    a.toLowerCase() < b.toLowerCase() ? -1 : 1
  );
  
  console.log("📦 Token Order:");
  console.log("→ currency0:", currency0 === USDC ? "USDC" : "CBBTC");
  console.log("→ currency1:", currency1 === USDC ? "USDC" : "CBBTC");

  const poolId = V4_POOL_IDS[0].poolId;

  const slot0Interface = new ethers.Interface([
    "function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96, int24 tick, uint16 protocolFee, uint16 hookFee)"
  ]);

  const slotCall = slot0Interface.encodeFunctionData("getSlot0", [poolId]);
  const result = await provider.call({ to: STATE_VIEW_ADDRESS, data: slotCall });
  const decoded = slot0Interface.decodeFunctionResult("getSlot0", result);
  console.log("✅ getSlot0 StateView:", decoded);

  let spacing;
  try {
    spacing = await getTickSpacingFromStateView(poolId);
  } catch {
    console.warn("⚠️ Falling back to manual tickSpacing: 60");
    spacing = 60;
  }

  const amountIn = ethers.parseUnits("0.002323", 8); // 8 decimals for CBBTC

  const poolKey = {
    currency0,
    currency1,
    fee: 3000,
    tickSpacing: spacing,
    hooks: V4_HOOK_ADDRESS,
  };

  console.log("🧪 Constructed poolKey:", poolKey);

  const sqrtPriceX96 = decoded[0];
  await simulateWithV4Quoter(poolKey, amountIn, null, sqrtPriceX96);

}



main().catch(console.error);




//to test run: yarn hardhat run test/cbbtc_mass_test.js --network base


