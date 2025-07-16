import { ethers, toBeHex, zeroPadValue } from "ethers"; 
import dotenv from "dotenv";
import axios from "axios";
import { TickMath } from "@uniswap/v3-sdk";
import { keccak256, encodePacked, getAddress, solidityPacked } from "viem";
import { exitCode } from "process";
import { unlink } from "fs";
import { Token } from '@uniswap/sdk-core';

dotenv.config();

// // ✅ Uniswap Contract Addresses
// // const QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
// // const FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";
// // const V3_POOL_ADDRESS = "0xfBB6Eed8e7aa03B138556eeDaF5D271A5E1e43ef";
// // const V4_POOL_MANAGER = "0x498581fF718922c3f8e6A244956aF099B2652b2b"; 
// // const V4_POOL_A_HOOK_ADDRESS = "0x5cd525c621AFCa515Bf58631D4733fbA7B72Aae4";
// // const V4_POOL_B_HOOK_ADDRESS = "0x0000000000000000000000000000000000000000";
// // const STATE_VIEW_ADDRESS = "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71";
// // const V4_QUOTER_ADDRESS = "0x0d5e0f971ed27fbff6c2837bf31316121532048d";
// // const V4_POOL_IDS = [
// //   {
// //     label: "V4 A (0.3%)",
// //     poolId: "0x64f978ef116d3c2e1231cfd8b80a369dcd8e91b28037c9973b65b59fd2cbbb96",
// //     poolAddress: "0x64f978ef116d3c2e1231cfd8b80a369dcd8e91b28037c9973b65b59fd2cbbb96", // same for now
// //     hooks: V4_POOL_A_HOOK_ADDRESS,
// //   },
// //   {
// //     label: "V4 B (0.3%)",
// //     poolId: "0x179492f1f9c7b2e2518a01eda215baab8adf0b02dd3a90fe68059c0cac5686f5",
// //     poolAddress: "0x179492f1f9c7b2e2518a01eda215baab8adf0b02dd3a90fe68059c0cac5686f5",
// //     hooks: V4_POOL_B_HOOK_ADDRESS,
// //   },
// // ];

// // // ✅ Token Addresses
// // const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
// // const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

// // // ✅ Set Up Ethereum Provider & Wallet
// // const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);




// // Below for checking quotes:
// async function fetchABI(contractAddress) {
//   try {
//     console.log(`🔍 Fetching ABI for ${contractAddress} from BaseScan...`);
//     const response = await axios.get(
//       `https://api.basescan.org/api?module=contract&action=getabi&address=${contractAddress}&apikey=${process.env.BASESCAN_API_KEY}`
//     );

//     if (response.data.status !== "1") throw new Error(`BaseScan API Error: ${response.data.message}`);

//     const abi = JSON.parse(response.data.result);
//     return abi;
//   } catch (error) {
//     console.error("❌ Failed to fetch ABI:", error.message);
//     return null;
//   }
// }

// function decodeSqrtPriceX96ToFloat(sqrtPriceX96, decimalsToken0 = 8, decimalsToken1 = 6) {
//   const Q96 = BigInt(2) ** BigInt(96);
//   const sqrt = BigInt(sqrtPriceX96);

//   const numerator = sqrt * sqrt;
//   const denominator = Q96 * Q96;

//   const rawPrice = Number(numerator) / Number(denominator);

//   const adjustedPrice = (1 / rawPrice) * 10 ** (decimalsToken0 - decimalsToken1); // ✅ Correct: Inverted & scaled

//   return adjustedPrice;
// }


// async function checkPoolLiquidity(poolAddress) {
//   const poolABI = await fetchABI(poolAddress);
//   if (!poolABI) return null;
//   const pool = new ethers.Contract(poolAddress, poolABI, provider);
//   try {
//     const slot0 = await pool.slot0();
//     const liquidity = await pool.liquidity();
//     const tickSpacing = await pool.tickSpacing();
//     console.log("\n🔍 Pool Liquidity Data:");
//     console.log(`   - sqrtPriceX96: ${slot0[0]}`);
//     console.log(`   - Current Tick: ${slot0[1]}`);
//     console.log(`   - Liquidity: ${liquidity}`);
//     console.log(`   - Tick Spacing: ${tickSpacing}`);
//     return { liquidity, sqrtPriceX96: slot0[0], tick: slot0[1], tickSpacing };
//   } catch (error) {
//     console.error("❌ Failed to fetch liquidity:", error.message);
//     return null;
//   }
// }


// async function simulateWithQuoterV4({
//   provider,
//   tokenIn,
//   tokenOut,
//   amountIn,
//   fee,
//   tickSpacing,
//   poolId
// }) {
//   const iface = new ethers.Interface([
//     "function quoteExactInputSingle((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks), bool zeroForOne, uint256 exactAmount, bytes hookData)",
//     "error QuoteSwap(uint256 amount)"
//   ]);

//   const stateViewIface = new ethers.Interface([
//     "function getPoolHook(bytes32 poolId) view returns (address)"
//   ]);

//   // Fetch the hook using poolId
//   const callData = stateViewIface.encodeFunctionData("getPoolHook", [poolId]);
//   const result = await provider.call({ to: STATE_VIEW_ADDRESS, data: callData });
//   const [hookAddress] = stateViewIface.decodeFunctionResult("getPoolHook", result);

//   const tokenInLower = tokenIn.toLowerCase();
//   const tokenOutLower = tokenOut.toLowerCase();
//   const sorted = [tokenInLower, tokenOutLower].sort();
//   const currency0 = sorted[0];
//   const currency1 = sorted[1];
//   const zeroForOne = tokenInLower === currency1;

//   const poolKey = [currency0, currency1, fee, tickSpacing, hookAddress];
//   const encodedCall = iface.encodeFunctionData("quoteExactInputSingle", [
//     poolKey,
//     zeroForOne,
//     amountIn,
//     "0x"
//   ]);

//   try {
//     await provider.call({
//       to: V4_QUOTER_ADDRESS,
//       data: encodedCall
//     });

//     console.warn("⚠️ Unexpected success — V4 Quoter did not revert.");
//     return null;
//   } catch (err) {
//     if (err.code === "CALL_EXCEPTION" && err.data) {
//       try {
//         const decoded = iface.decodeErrorResult("QuoteSwap", err.data);
//         const amountOut = decoded.amount || decoded[0];
//         console.log(`🔁 V4 Simulated amountOut: ${ethers.formatUnits(amountOut, 6)} USDC`);
//         return amountOut;
//       } catch (decodeErr) {
//         console.warn("❌ Revert occurred, but not QuoteSwap — possibly invalid hook or call.");
//       }
//     }

//     console.error("❌ V4 Quoter simulation failed:", err.reason || err.message || err);
//     return null;
//   }
// }


// async function simulateWithQuoter(params) {
//   const quoterABI = await fetchABI(QUOTER_ADDRESS);
//   if (!quoterABI) return null;

//   const iface = new ethers.Interface(quoterABI);

//   const functionData = iface.encodeFunctionData("quoteExactInputSingle", [{
//     tokenIn: params.tokenIn,
//     tokenOut: params.tokenOut,
//     fee: params.fee,
//     amountIn: params.amountIn,
//     sqrtPriceLimitX96: params.sqrtPriceLimitX96
//   }]);

//   try {
//     const result = await provider.call({
//       to: QUOTER_ADDRESS,
//       data: functionData
//     });

//     const [amountOut] = iface.decodeFunctionResult("quoteExactInputSingle", result);
//     console.log(`🔁 Simulated amountOut: ${ethers.formatUnits(amountOut, 6)} USDC`);
//     return amountOut;
//   } catch (err) {
//     console.warn("⚠️ QuoterV2 simulation failed:", err.reason || err.message || err);
//     return null;
//   }
// }

// async function getV3PoolReserves(poolAddress, provider) {
//   const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"];
//   const usdc = new ethers.Contract(USDC, ERC20_ABI, provider);
//   const cbbtc = new ethers.Contract(CBBTC, ERC20_ABI, provider);

//   const [usdcRaw, cbbtcRaw] = await Promise.all([
//     usdc.balanceOf(poolAddress),
//     cbbtc.balanceOf(poolAddress)
//   ]);

//   return {
//     usdc: Number(usdcRaw) / 1e6,
//     cbBTC: Number(cbbtcRaw) / 1e8
//   };
// }

// function decodeLiquidityAmountsv4(liquidity, sqrtPriceX96) {
//   const sqrtPrice = Number(sqrtPriceX96) / 2 ** 96;
//   const price = sqrtPrice ** 2;
//   const liquidityFloat = Number(liquidity);

//   const amount0 = liquidityFloat / sqrtPrice; // USDC
//   const amount1 = liquidityFloat * sqrtPrice; // CBBTC

//   return {
//     cbBTC: amount1 / 1e8,
//     usdc: amount0 / 1e6,
//   };
// }


// const ERC20_ABI = [
//   "function balanceOf(address owner) view returns (uint256)"
// ];


// export async function checkFeeFreeRoute(amountIn) {
//   console.log(`\n🚀 Checking Fee-Free Routes for ${amountIn} CBBTC → USDC`);

//   const V4_FEE = 3000;
//   const V4_TICK_SPACING = 60; // for 0.3% pool
//   const amountInWei = ethers.parseUnits(amountIn.toString(), 8);


//   // === V3 PRICE & LIQUIDITY ===
//   const v3Data = await checkPoolLiquidity(V3_POOL_ADDRESS);
//   const v3Price = decodeSqrtPriceX96ToFloat(v3Data.sqrtPriceX96);
//   console.log(`💲 Implied Price (V3 0.05%): $${v3Price.toFixed(2)} per CBBTC`);

//   const reserves = await getV3PoolReserves(V3_POOL_ADDRESS, provider);
//   console.log(`   - V3 Pool Reserves (Total):`);
//   console.log(`     - CBBTC in Pool: ${reserves.cbBTC.toFixed(6)} CBBTC`);
//   console.log(`     - USDC in Pool: ${reserves.usdc.toFixed(2)} USDC`);
//   const iface = new ethers.Interface([
//     "function getSlot0(bytes32 poolId) view returns (tuple(uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee))",
//     "function getLiquidity(bytes32 poolId) view returns (uint128)"
//   ]);

//   let bestV4Sim = null;
//   let bestV4Price = 0;
//   let bestV4Label = null;

//   for (const { poolId, poolAddress, label, hooks } of V4_POOL_IDS) {
//     console.log(`📛 Checking ${label}: ${poolId}`);
//     const slot0Data = iface.encodeFunctionData("getSlot0", [poolId]);
//     const liquidityData = iface.encodeFunctionData("getLiquidity", [poolId]);

//     try {
//       const [slot0Raw, liquidityRaw] = await Promise.all([
//         provider.call({ to: STATE_VIEW_ADDRESS, data: slot0Data }),
//         provider.call({ to: STATE_VIEW_ADDRESS, data: liquidityData })
//       ]);

//       const [slot0] = iface.decodeFunctionResult("getSlot0", slot0Raw);
//       const [liquidity] = iface.decodeFunctionResult("getLiquidity", liquidityRaw);

//       const { sqrtPriceX96, tick, protocolFee, lpFee } = slot0;
//       console.log(`✅ StateView.getSlot0 for ${label}:`);
//       console.log(`   - sqrtPriceX96: ${sqrtPriceX96}`);
//       console.log(`   - Tick: ${tick}`);
//       console.log(`   - Protocol Fee: ${protocolFee}`);
//       console.log(`   - LP Fee: ${lpFee}`);

//       const price = decodeSqrtPriceX96ToFloat(sqrtPriceX96);
//       console.log(`💲 Implied Price (${label}): $${price.toFixed(2)} per CBBTC`);
//       const decodedLiquidity = decodeLiquidityAmountsv4(liquidity, sqrtPriceX96);
//       console.log(`   - V4 Liquidity (Decoded):`);
//       console.log(`     - CBBTC in Pool: ${decodedLiquidity.cbBTC.toFixed(6)} CBBTC`);
//       console.log(`     - USDC in Pool: ${decodedLiquidity.usdc.toFixed(2)} USDC`);
//       const sim = await simulateWithQuoterV4({
//         provider,
//         tokenIn: CBBTC,
//         tokenOut: USDC,
//         amountIn: amountInWei,
//         fee: V4_FEE,
//         tickSpacing: V4_TICK_SPACING,
//         poolId
//       });

//       if (sim && price > bestV4Price) {
//         bestV4Sim = sim;
//         bestV4Price = price;
//         bestV4Label = label;
//       }
//     } catch (err) {
//       console.warn(`❌ ${label} failed: ${err.message}`);
//     }
//   }

//   if (bestV4Sim) {
//     console.log(`🏆 Best Pool: ${bestV4Label} with simulated out ${ethers.formatUnits(bestV4Sim, 6)} USDC`);
//     return [{ poolAddress: bestV4Label, fee: V4_FEE, amountOut: bestV4Sim }];
//   } else {
//     console.warn(`⚠️ All V4 pool simulations failed or were worse than V3. Falling back to V3...`);
//   }

//   const tickSpacing = Number(v3Data.tickSpacing);
//   const baseTick = Math.floor(Number(v3Data.tick) / tickSpacing) * tickSpacing;
//   const feeFreeRoutes = [];

//   for (let i = 0; i < 3; i++) {
//     const testTick = baseTick + i * tickSpacing;
//     try {
//       const sqrtPriceLimitX96 = BigInt(TickMath.getSqrtRatioAtTick(testTick).toString());
//       const sim = await simulateWithQuoter({
//         tokenIn: CBBTC,
//         tokenOut: USDC,
//         fee: 500,
//         amountIn: amountInWei,
//         sqrtPriceLimitX96,
//       });

//       if (sim && sim > 0n) {
//         console.log(`✅ Route at tick ${testTick} is valid. Estimated out: ${ethers.formatUnits(sim, 6)} USDC`);
//         feeFreeRoutes.push({
//           poolAddress: V3_POOL_ADDRESS,
//           fee: 500,
//           sqrtPriceLimitX96,
//           poolData: v3Data,
//           tick: testTick,
//         });
//       }
//     } catch (err) {
//       console.warn(`⚠️ Tick ${testTick} failed: ${err.message}`);
//     }
//   }

//   return feeFreeRoutes;
// }





















// // Below for executing Supplications


// async function checkCBBTCBalance(userWallet) {
//   const proxyCBBTCContract = new ethers.Contract(CBBTC, [
//     "function balanceOf(address) view returns (uint256)"
//   ], provider);
//   const balance = await proxyCBBTCContract.balanceOf(userWallet.address);
//   console.log(`💰 CBBTC Balance: ${ethers.formatUnits(balance, 8)} CBBTC`);
//   return balance;
// }

// async function getBalances(userWallet, USDCContract) {
//   const usdcBalance = await USDCContract.balanceOf(userWallet.address);
//   const cbbtcBalance = await checkCBBTCBalance(userWallet);
//   return {
//     usdc: ethers.formatUnits(usdcBalance, 6),
//     cbbtc: ethers.formatUnits(cbbtcBalance, 8)
//   };
// }

// async function approveCBBTC(userWallet, amountIn) {
//   console.log(`🔑 Approving Swap Router to spend ${amountIn} CBBTC...`);
//   const balance = await checkCBBTCBalance(userWallet);
//   const amountBaseUnits = ethers.parseUnits(amountIn.toString(), 8);

//   if (balance < amountBaseUnits) {
//     console.error(`❌ ERROR: Insufficient CBBTC balance!`);
//     return;
//   }

//   const proxyCBBTCContract = new ethers.Contract(CBBTC, [
//     "function approve(address, uint256)",
//     "function allowance(address, address) view returns (uint256)"
//   ], userWallet);

//   const currentAllowance = await proxyCBBTCContract.allowance(userWallet.address, swapRouterAddress);
//   console.log(`📎 BEFORE Approval: ${ethers.formatUnits(currentAllowance, 8)} CBBTC`);

//   if (currentAllowance < amountBaseUnits) {
//     const tx = await proxyCBBTCContract.approve(swapRouterAddress, amountBaseUnits);
//     const receipt = await tx.wait();
//     console.log("✅ Approval Successful!");
//     console.log("📎 Approval Logs:", receipt.logs);
//   } else {
//     console.log("✅ Approval already sufficient.");
//   }

//   const postAllowance = await proxyCBBTCContract.allowance(userWallet.address, swapRouterAddress);
//   console.log(`📎 AFTER Approval: ${ethers.formatUnits(postAllowance, 8)} CBBTC`);
// }

// async function checkETHBalance(userWallet) {
//   const ethBalance = await provider.getBalance(userWallet.address);
//   const feeData = await provider.getFeeData();
//   const requiredGasETH = feeData.gasPrice * 70000n;
//   if (ethBalance < requiredGasETH) {
//     console.error(`❌ Not enough ETH for gas fees! Required: ${ethers.formatEther(requiredGasETH)} ETH`);
//     return false;
//   }
//   return true;
// }

// export async function executeSupplication(amountIn, customPrivateKey) {
//   console.log(`\n🚀 Executing Swap: ${amountIn} CBBTC → USDC`);

//   const privateKeyToUse = customPrivateKey || process.env.PRIVATE_KEY_TEST;
//   const userWallet = new ethers.Wallet(privateKeyToUse, provider);
//   console.log(`✅ Using Test Wallet: ${userWallet.address}`);

//   const USDCContract = new ethers.Contract(USDC, [
//     "function balanceOf(address) view returns (uint256)",
//     "function approve(address, uint256)",
//     "function allowance(address, address) view returns (uint256)"
//   ], userWallet);

//   const CBBTCContract = new ethers.Contract(CBBTC, [
//     "function balanceOf(address) view returns (uint256)"
//   ], userWallet);

//   const cbbtcBalanceRaw = await CBBTCContract.balanceOf(userWallet.address);
//   const ethBalanceRaw = await provider.getBalance(userWallet.address);

//   console.log(`💰 USDC Balance: ${ethers.formatUnits(cbbtcBalanceRaw, 6)} USDC`);
//   console.log(`💰 ETH Balance: ${ethers.formatEther(ethBalanceRaw)} ETH`);

//   const balance = await checkCBBTCBalance(userWallet);
//   if (balance < ethers.parseUnits(amountIn.toString(), 8)) {
//     console.error(`❌ ERROR: Insufficient CBBTC balance!`);
//     return;
//   }

//   const poolInfo = await getBestPricedPool();
//   if (!poolInfo) return;
//   const { poolAddress, fee } = poolInfo;

//   const poolData = await checkPoolLiquidity(poolAddress);
//   if (!poolData || poolData.liquidity === 0) {
//     console.error("❌ No liquidity available.");
//     return;
//   }

//   const feeFreeRoutes = await checkFeeFreeRoute(amountIn);
//   if (!feeFreeRoutes || feeFreeRoutes.length === 0) {
//     console.error("❌ No fee-free route available. Aborting.");
//     return;
//   }

//   console.log("✅ Fee-Free Route Confirmed!");

//   await approveCBBTC(userWallet, amountIn);             
//   if (!(await checkETHBalance(userWallet))) return;    
  
//   let lastError = null;

//   for (const route of feeFreeRoutes) {
//     const { fee, poolData } = route;
  
//     const tickSpacing = Number(poolData.tickSpacing);
//     const baseTick = Math.floor(Number(poolData.tick) / tickSpacing) * tickSpacing;
  
//     for (let i = 0; i < 3; i++) {
//       const testTick = baseTick + (i * tickSpacing);
//       console.log(`🔁 Trying supplication for fee ${fee} at tick ${testTick}`);
  
//       let limitX96;
//       try {
//         limitX96 = BigInt(TickMath.getSqrtRatioAtTick(testTick).toString());
//       } catch (err) {
//         console.warn(`⚠️ Failed sqrtPriceLimitX96 for tick ${testTick}: ${err.message}`);
//         lastError = err;
//         continue;
//       }
  
//       const params = {
//         tokenIn: CBBTC,
//         tokenOut: USDC,
//         fee,
//         recipient: userWallet.address,
//         deadline: Math.floor(Date.now() / 1000) + 600,
//         amountIn: ethers.parseUnits(amountIn.toString(), 8),
//         amountOutMinimum: ethers.parseUnits("0.01", 6),
//         sqrtPriceLimitX96: limitX96,
//       };
  
//       console.log("🔍 Attempting supplication with params:", params);
  
//       const swapRouterABI = await fetchABI(swapRouterAddress);
//       const iface = new ethers.Interface(swapRouterABI);
//       const functionData = iface.encodeFunctionData("exactInputSingle", [params]);

//       const ethBefore = await provider.getBalance(userWallet.address);
//       console.log(`💰 ETH Balance Before: ${ethers.formatEther(ethBefore)} ETH`);
  
//       try {
//         const feeData = await provider.getFeeData();
//         const tx = await userWallet.sendTransaction({
//           to: swapRouterAddress,
//           data: functionData,
//           gasLimit: 300000,
//           maxFeePerGas: feeData.maxFeePerGas,
//           maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? ethers.parseUnits("1", "gwei"),
//         });
  
//         console.log("⏳ Waiting for confirmation...");
//         const receipt = await tx.wait();
//         console.log("✅ Supplication Transaction Confirmed:");
//         console.log(`🔗 Tx Hash: ${receipt.hash}`);
//         const ethAfter = await provider.getBalance(userWallet.address);
//         console.log(`💰 ETH Balance After: ${ethers.formatEther(ethAfter)} ETH`);
//         return;
//       } catch (err) {
//         console.error(`❌ Supplication failed at tick ${testTick}:`, err.reason || err.message || err);
//         lastError = err;
//       }
//     }
//   }

// console.error("❌ All fee-free tick attempts failed.");
// throw lastError;

  
// }



// const swapRouterAddress = "0x2626664c2603336E57B271c5C0b26F421741e481";




















const V4_POOL_MANAGER = "0x498581fF718922c3f8e6A244956aF099B2652b2b";
const V4_POOL_A_HOOK_ADDRESS = "0x5cd525c621AFCa515Bf58631D4733fbA7B72Aae4";
const V4_POOL_B_HOOK_ADDRESS = "0x0000000000000000000000000000000000000000";
const STATE_VIEW_ADDRESS = "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71";
const V4_QUOTER_ADDRESS = "0x0d5e0f971ed27fbff6c2837bf31316121532048d";

const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);

const V4_POOL_IDS = [
  // {
  //   label: "V4 A (0.3%)",
  //   poolId: "0x64f978ef116d3c2e1231cfd8b80a369dcd8e91b28037c9973b65b59fd2cbbb96", 
  //   hooks: getAddress(V4_POOL_A_HOOK_ADDRESS), 
  //   tickSpacing: 200,
  //   fee: 3000,
  // },
  {
    label: "V4 B (0.3%)",
    poolId: "0x179492f1f9c7b2e2518a01eda215baab8adf0b02dd3a90fe68059c0cac5686f5",
    hooks: getAddress(V4_POOL_B_HOOK_ADDRESS),
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

async function testAllPoolKeyPermutations() {
  const poolsWithData = [];

  for (const pool of V4_POOL_IDS) {
    console.log(`\n🧪 Testing Pool: ${pool.label}`);
    console.log(`→ poolId: ${pool.poolId}`);
    try {
      const [sqrtPriceX96, rawTick] = await getSlot0FromStateView(pool.poolId);

      const currentTick = Number(rawTick); // ensure it's a Number
      console.log(`🧮 Current Tick: ${currentTick}`);

      const wordPosition = Math.floor(currentTick / pool.tickSpacing / 256);
      console.log(`🔍 Scanning Tick Bitmaps from wordPosition ${wordPosition - 100} to ${wordPosition + 100}:`);
      
      for (let wp = wordPosition - 100; wp <= wordPosition + 100; wp++) {
        const bitmap = await getTickBitmap(pool.poolId, wp);
        if (bitmap === 0n) continue;
        const binary = bitmap.toString(2).padStart(256, "0");
        const initializedTicks = getInitializedTicksFromBitmap(bitmap, wp, pool.tickSpacing);
        if (initializedTicks.length > 0) {
          console.log(`🧠 Tick Bitmap [wordPosition=${wp}]: ${binary}`);
          console.log(`🧵 Initialized Ticks in wordPosition ${wp}:`, initializedTicks);
          let nonZeroLiquidityTicks = 0;

          for (const t of initializedTicks) {
            const tickInfo = await getTickInfo(pool.poolId, t);
            const gross = BigInt(tickInfo.liquidityGross.toString());
            const net = BigInt(tickInfo.liquidityNet.toString());
            if (gross > 0n || net !== 0n) {
              console.log(`🔹 Tick ${t}: liquidityGross=${gross}, liquidityNet=${net}`);
            }
          }
          
          if (nonZeroLiquidityTicks === 0) {
            console.log(`⚠️ All initialized ticks in wordPosition ${wp} have zero liquidity — skipping logs.`);
          }
        }
      }
      const liquidity = await getLiquidity(pool.poolId);
    
      const poolKey = {
        currency0: CBBTC,
        currency1: USDC,
        fee: 3000,
        hooks: pool.hooks,
        tickSpacing: pool.tickSpacing,
      };

      const price = decodeSqrtPriceX96ToFloat(sqrtPriceX96);
      const reserves = decodeLiquidityAmountsv4(liquidity, sqrtPriceX96);
    
      console.log(`📈 sqrtPriceX96: ${sqrtPriceX96}`);
      console.log(`💰 cbBTC/USDC Price: $${price.toFixed(2)}`);
      console.log(`📦 cbBTC Reserve: ${reserves.cbBTC.toFixed(6)} cbBTC`);
      console.log(`📦 USDC Reserve: ${reserves.usdc.toFixed(2)} USDC`);
      console.log(`🎯 Using Hardcoded Tick Spacing: ${pool.tickSpacing}`);


      console.log(`✅ Matched Tick Spacing: ${poolKey.tickSpacing}`);
      console.log(`🧩 PoolKey:`, poolKey);
    
      poolsWithData.push({
        ...pool,
        price,
        reserves,
        sqrtPriceX96,
        tickSpacing: pool.tickSpacing,
        poolKey,
      });
    } catch (err) {
      console.log(`❌ Failed to fetch info for poolId: ${pool.poolId}`);
      console.error(err.message || err);
    }
  }

  return poolsWithData;
}


async function simulateWithV4Quoter(poolKey, amountInCBBTC, sqrtPriceLimitX96 = 0n) {
  const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
  console.log(`✅ Using Test Wallet: ${userWallet.address}`);

  // 🔹 Log CBBTC Balance
  const erc20ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];
  const cbBtcContract = new ethers.Contract(CBBTC, erc20ABI, provider);
  const balance = await cbBtcContract.balanceOf(userWallet.address);
  const formattedBalance = ethers.formatUnits(balance, 8);
  console.log(`💰 CBBTC Balance: ${formattedBalance} CBBTC`);

  // 🧮 Prepare Swap Params
  const zeroForOne = true; // cbBTC → USDC
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const hookData = "0x";
  const signedAmountIn = zeroForOne ? BigInt(amountInCBBTC) : -BigInt(amountInCBBTC);

  const encodedSwapParams = abiCoder.encode(
    [
      "tuple(address currency0, address currency1, uint24 fee, address hooks, int24 tickSpacing)",
      "address",
      "bool",
      "int256",
      "uint160",
      "bytes",
    ],
    [
      [
        poolKey.currency0,
        poolKey.currency1,
        poolKey.fee,
        poolKey.hooks,
        poolKey.tickSpacing,
      ],
      ethers.ZeroAddress,
      zeroForOne,
      signedAmountIn,
      sqrtPriceLimitX96,
      hookData,
    ]
  );

  // 🔍 Simulate Swap
  const quoter = new ethers.Contract(
    V4_QUOTER_ADDRESS,
    ["function quote(address sender, bytes hookData, bytes inputData) view returns (bytes)"],
    userWallet
  );

  const result = await quoter.quote(userWallet.address, hookData, encodedSwapParams);
  const [amountOut] = abiCoder.decode(["uint256"], result);
  console.log(`→ Quoted amountOut: ${ethers.formatUnits(amountOut, 6)} USDC`);
}



async function main() {
  await testAllPoolKeyPermutations();
  // const amountInCBBTC = ethers.parseUnits("0.000023", 8);

  // for (const pool of V4_POOL_IDS) {
  //   const poolKey = {
  //     currency0: CBBTC,
  //     currency1: USDC,
  //     fee: pool.fee,
  //     tickSpacing: pool.tickSpacing,
  //     hooks: pool.hooks,
  //   };
  
  //   console.log(`\n🧪 Simulating Quote for ${pool.label}`);
  //   await simulateWithV4Quoter(poolKey, amountInCBBTC);
  // }
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

