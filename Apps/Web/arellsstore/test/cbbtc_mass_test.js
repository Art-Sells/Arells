import { ethers } from "ethers"; 
import dotenv from "dotenv";
import axios from "axios";
import { TickMath } from "@uniswap/v3-sdk";



dotenv.config();

// ✅ Uniswap Contract Addresses
const QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
const FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";
const V3_POOL_ADDRESS = "0xfBB6Eed8e7aa03B138556eeDaF5D271A5E1e43ef";
const V4_POOL_MANAGER = "0x498581fF718922c3f8e6A244956aF099B2652b2b"; 
const V4_HOOK_ADDRESS = "0x5cd525c621AFCa515Bf58631D4733fbA7B72Aae4";
const STATE_VIEW_ADDRESS = "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71";

// ✅ Token Addresses
const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

// ✅ Set Up Ethereum Provider & Wallet
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);




// Below for checking quotes:
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

function decodeSqrtPriceX96ToFloat(sqrtPriceX96, decimalsToken0 = 8, decimalsToken1 = 6) {
  const Q96 = BigInt(2) ** BigInt(96);
  const sqrt = BigInt(sqrtPriceX96);

  const numerator = sqrt * sqrt;
  const denominator = Q96 * Q96;

  const rawPrice = Number(numerator) / Number(denominator);

  // ✅ Adjust for token decimals (CBBTC = 8, USDC = 6)
  const adjustedPrice = rawPrice * 10 ** (decimalsToken1 - decimalsToken0);

  return adjustedPrice;
}

// ... rest of the unchanged code



async function getBestPricedPool() {
  const poolConfigs = [
    { poolAddress: "0xfBB6Eed8e7aa03B138556eeDaF5D271A5E1e43ef", fee: 500, label: "V3 (0.05%)" },
    { poolAddress: "0x5cd525c621AFCa515Bf58631D4733fbA7B72Aae4", fee: 3000, label: "V4 (0.3%)" }
  ];

  let bestPool = null;
  let highestPrice = 0;

  for (const { poolAddress, fee, label } of poolConfigs) {
    const poolABI = await fetchABI(poolAddress);
    if (!poolABI) continue;

    try {
      const pool = new ethers.Contract(poolAddress, poolABI, provider);
      const slot0 = await pool.slot0();
      const sqrtPriceX96 = BigInt(slot0[0].toString());

      const price = decodeSqrtPriceX96ToFloat(sqrtPriceX96);
      console.log(`🔍 Pool ${label}: sqrtPriceX96 = ${sqrtPriceX96}`);
      console.log(`💲 Implied Price (${label}): $${price.toFixed(2)} per CBBTC`);

      if (price > highestPrice) {
        highestPrice = price;
        bestPool = { poolAddress, fee, label, sqrtPriceX96 };
      }
    } catch (err) {
      console.warn(`⚠️ Failed to read from ${label}: ${err.message}`);
    }
  }

  if (bestPool) {
    console.log(`\n🏆 Best Pool: ${bestPool.label} with price $${highestPrice.toFixed(2)}`);
    return bestPool;
  }

  console.error("❌ Could not determine best-priced pool.");
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

const V4_QUOTER_ADDRESS = "0x0d5e0f971ed27fbff6c2837bf31316121532048d";

const QUOTER_V4_ABI = [
  "function quoteExactInputSingle((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks), bool zeroForOne, uint256 exactAmount, bytes hookData)"
];

const QUOTE_SWAP_ERROR = "error QuoteSwap(uint256 amount)";

const parseQuoteRevert = (data) => {
  const iface = new ethers.Interface([QUOTE_SWAP_ERROR]);
  try {
    const decoded = iface.decodeErrorResult("QuoteSwap", data);
    return decoded.amount;
  } catch (err) {
    console.warn("Failed to decode QuoteSwap revert:", err.message);
    return null;
  }
};

export async function simulateWithQuoterV4({
  provider,
  tokenIn,
  tokenOut,
  amountIn,
  fee,
  tickSpacing,
  hooks = ethers.ZeroAddress
}) {

  const poolKey = {
    currency0: tokenOut,
    currency1: tokenIn,
    fee,
    tickSpacing,
    hooks
  };

  const iface = new ethers.Interface(QUOTER_V4_ABI);
  const data = iface.encodeFunctionData("quoteExactInputSingle", [poolKey, true, amountIn, "0x"]);

  try {
    await provider.call({ to: V4_QUOTER_ADDRESS, data });
    console.warn("⚠️ Expected revert with QuoteSwap but call succeeded unexpectedly.");
    return null;
  } catch (err) {
    if (err.code === "CALL_EXCEPTION" && err.data) {
      const amountOut = parseQuoteRevert(err.data);
      if (amountOut) {
        console.log(`🔁 V4 Simulated amountOut: ${ethers.formatUnits(amountOut, 6)} USDC`);
        return amountOut;
      }
    }
    console.error("❌ V4 Quoter simulation failed:", err.reason || err.message);
    return null;
  }
}



async function simulateWithQuoter(params) {
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

function decodeLiquidityAmounts(liquidity, sqrtPriceX96, decimalsToken0 = 8, decimalsToken1 = 6) {
  const Q96 = BigInt(2) ** BigInt(96);
  const sqrtP = BigInt(sqrtPriceX96);
  const L = BigInt(liquidity);

  // From Uniswap formula: amount0 = L * (2^96) / sqrtPrice
  const amount0 = (L * Q96) / sqrtP;
  // amount1 = L * sqrtPrice / (2^96)
  const amount1 = (L * sqrtP) / Q96;

  return {
    token0Amount: Number(amount0) / 10 ** decimalsToken0, // CBBTC
    token1Amount: Number(amount1) / 10 ** decimalsToken1, // USDC
  };
}

const VAULT_ADDRESS = "0xbB08f90C03D9550C2e0619c5bD2940c88f76DDc8"; // Uniswap V4 Vault on Base

const VAULT_ABI = [
  "function getPoolBalances(bytes32[] calldata poolIds) view returns (uint256[][] balances, uint256[][] lastChangeBlock, bytes[] metadata)"
];

async function getVaultBalances(poolId, provider) {
  const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
  try {
    const result = await vault.getPoolBalances([poolId]);
    const balances = result.balances[0]; // balances[0] is the [cbBTC, USDC] for this pool

    const cbBTC = ethers.formatUnits(balances[0], 8); // cbBTC is index 0
    const usdc = ethers.formatUnits(balances[1], 6);  // USDC is index 1

    return {
      cbBTC,
      usdc,
    };
  } catch (err) {
    console.error(`❌ Failed to fetch vault balances for ${poolId}: ${err.message}`);
    return {
      cbBTC: "0.0000",
      usdc: "0.00",
    };
  }
}

export async function checkFeeFreeRoute(amountIn) {
  console.log(`\n🚀 Checking Fee-Free Routes for ${amountIn} CBBTC → USDC`);

  const V4_FEE = 3000;
  const V4_TICK_SPACING = 60; // for 0.3% pool
  const amountInWei = ethers.parseUnits(amountIn.toString(), 8);

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

  // === V3 PRICE & LIQUIDITY ===
  const v3Data = await checkPoolLiquidity(V3_POOL_ADDRESS);
  const v3Price = decodeSqrtPriceX96ToFloat(v3Data.sqrtPriceX96);
  console.log(`💲 Implied Price (V3 0.05%): $${v3Price.toFixed(2)} per CBBTC`);

  const v3Liquidity = decodeLiquidityAmounts(
    v3Data.liquidity,
    v3Data.sqrtPriceX96
  );
  console.log(`   - V3 Liquidity: ${v3Data.liquidity}`);
  console.log(`   - CBBTC in Pool: ${v3Liquidity.token0Amount.toFixed(6)} CBBTC`);
  console.log(`   - USDC in Pool: ${v3Liquidity.token1Amount.toFixed(2)} USDC`);

  const iface = new ethers.Interface([
    "function getSlot0(bytes32 poolId) view returns (tuple(uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee))",
    "function getLiquidity(bytes32 poolId) view returns (uint128)"
  ]);

  let bestV4Sim = null;
  let bestV4Price = 0;
  let bestV4Label = null;

  for (const { poolId, poolAddress, label, hooks } of V4_POOL_IDS) {
    console.log(`📛 Checking ${label}: ${poolId}`);
    const slot0Data = iface.encodeFunctionData("getSlot0", [poolId]);
    const liquidityData = iface.encodeFunctionData("getLiquidity", [poolId]);

    try {
      const [slot0Raw, liquidityRaw] = await Promise.all([
        provider.call({ to: STATE_VIEW_ADDRESS, data: slot0Data }),
        provider.call({ to: STATE_VIEW_ADDRESS, data: liquidityData })
      ]);

      const [slot0] = iface.decodeFunctionResult("getSlot0", slot0Raw);
      const [liquidity] = iface.decodeFunctionResult("getLiquidity", liquidityRaw);

      const { sqrtPriceX96, tick, protocolFee, lpFee } = slot0;
      console.log(`✅ StateView.getSlot0 for ${label}:`);
      console.log(`   - sqrtPriceX96: ${sqrtPriceX96}`);
      console.log(`   - Tick: ${tick}`);
      console.log(`   - Protocol Fee: ${protocolFee}`);
      console.log(`   - LP Fee: ${lpFee}`);

      const price = decodeSqrtPriceX96ToFloat(sqrtPriceX96);
      console.log(`💲 Implied Price (${label}): $${price.toFixed(2)} per CBBTC`);

      const { cbBTC, usdc } = await getVaultBalances(poolId, provider);
      console.log(`   - V4 Liquidity (Real via Vault):`);
      console.log(`     - CBBTC in Pool: ${cbBTC} CBBTC`);
      console.log(`     - USDC in Pool: ${usdc} USDC`);

      const sim = await simulateWithQuoterV4({
        provider,
        tokenIn: CBBTC,
        tokenOut: USDC,
        amountIn: amountInWei,
        fee: V4_FEE,
        tickSpacing: V4_TICK_SPACING,
        hooks,
      });

      if (sim && price > bestV4Price) {
        bestV4Sim = sim;
        bestV4Price = price;
        bestV4Label = label;
      }
    } catch (err) {
      console.warn(`❌ ${label} failed: ${err.message}`);
    }
  }

  if (bestV4Sim) {
    console.log(`🏆 Best Pool: ${bestV4Label} with simulated out ${ethers.formatUnits(bestV4Sim, 6)} USDC`);
    return [{ poolAddress: bestV4Label, fee: V4_FEE, amountOut: bestV4Sim }];
  } else {
    console.warn(`⚠️ All V4 pool simulations failed or were worse than V3. Falling back to V3...`);
  }

  const tickSpacing = Number(v3Data.tickSpacing);
  const baseTick = Math.floor(Number(v3Data.tick) / tickSpacing) * tickSpacing;
  const feeFreeRoutes = [];

  for (let i = 0; i < 3; i++) {
    const testTick = baseTick + i * tickSpacing;
    try {
      const sqrtPriceLimitX96 = BigInt(TickMath.getSqrtRatioAtTick(testTick).toString());
      const sim = await simulateWithQuoter({
        tokenIn: CBBTC,
        tokenOut: USDC,
        fee: 500,
        amountIn: amountInWei,
        sqrtPriceLimitX96,
      });

      if (sim && sim > 0n) {
        console.log(`✅ Route at tick ${testTick} is valid. Estimated out: ${ethers.formatUnits(sim, 6)} USDC`);
        feeFreeRoutes.push({
          poolAddress: V3_POOL_ADDRESS,
          fee: 500,
          sqrtPriceLimitX96,
          poolData: v3Data,
          tick: testTick,
        });
      }
    } catch (err) {
      console.warn(`⚠️ Tick ${testTick} failed: ${err.message}`);
    }
  }

  return feeFreeRoutes;
}





















// Below for executing Supplications


async function checkCBBTCBalance(userWallet) {
  const proxyCBBTCContract = new ethers.Contract(CBBTC, [
    "function balanceOf(address) view returns (uint256)"
  ], provider);
  const balance = await proxyCBBTCContract.balanceOf(userWallet.address);
  console.log(`💰 CBBTC Balance: ${ethers.formatUnits(balance, 8)} CBBTC`);
  return balance;
}

async function getBalances(userWallet, USDCContract) {
  const usdcBalance = await USDCContract.balanceOf(userWallet.address);
  const cbbtcBalance = await checkCBBTCBalance(userWallet);
  return {
    usdc: ethers.formatUnits(usdcBalance, 6),
    cbbtc: ethers.formatUnits(cbbtcBalance, 8)
  };
}

async function approveCBBTC(userWallet, amountIn) {
  console.log(`🔑 Approving Swap Router to spend ${amountIn} CBBTC...`);
  const balance = await checkCBBTCBalance(userWallet);
  const amountBaseUnits = ethers.parseUnits(amountIn.toString(), 8);

  if (balance < amountBaseUnits) {
    console.error(`❌ ERROR: Insufficient CBBTC balance!`);
    return;
  }

  const proxyCBBTCContract = new ethers.Contract(CBBTC, [
    "function approve(address, uint256)",
    "function allowance(address, address) view returns (uint256)"
  ], userWallet);

  const currentAllowance = await proxyCBBTCContract.allowance(userWallet.address, swapRouterAddress);
  console.log(`📎 BEFORE Approval: ${ethers.formatUnits(currentAllowance, 8)} CBBTC`);

  if (currentAllowance < amountBaseUnits) {
    const tx = await proxyCBBTCContract.approve(swapRouterAddress, amountBaseUnits);
    const receipt = await tx.wait();
    console.log("✅ Approval Successful!");
    console.log("📎 Approval Logs:", receipt.logs);
  } else {
    console.log("✅ Approval already sufficient.");
  }

  const postAllowance = await proxyCBBTCContract.allowance(userWallet.address, swapRouterAddress);
  console.log(`📎 AFTER Approval: ${ethers.formatUnits(postAllowance, 8)} CBBTC`);
}

async function checkETHBalance(userWallet) {
  const ethBalance = await provider.getBalance(userWallet.address);
  const feeData = await provider.getFeeData();
  const requiredGasETH = feeData.gasPrice * 70000n;
  if (ethBalance < requiredGasETH) {
    console.error(`❌ Not enough ETH for gas fees! Required: ${ethers.formatEther(requiredGasETH)} ETH`);
    return false;
  }
  return true;
}

export async function executeSupplication(amountIn, customPrivateKey) {
  console.log(`\n🚀 Executing Swap: ${amountIn} CBBTC → USDC`);

  const privateKeyToUse = customPrivateKey || process.env.PRIVATE_KEY_TEST;
  const userWallet = new ethers.Wallet(privateKeyToUse, provider);
  console.log(`✅ Using Test Wallet: ${userWallet.address}`);

  const USDCContract = new ethers.Contract(USDC, [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address, uint256)",
    "function allowance(address, address) view returns (uint256)"
  ], userWallet);

  const CBBTCContract = new ethers.Contract(CBBTC, [
    "function balanceOf(address) view returns (uint256)"
  ], userWallet);

  const cbbtcBalanceRaw = await CBBTCContract.balanceOf(userWallet.address);
  const ethBalanceRaw = await provider.getBalance(userWallet.address);

  console.log(`💰 USDC Balance: ${ethers.formatUnits(cbbtcBalanceRaw, 6)} USDC`);
  console.log(`💰 ETH Balance: ${ethers.formatEther(ethBalanceRaw)} ETH`);

  const balance = await checkCBBTCBalance(userWallet);
  if (balance < ethers.parseUnits(amountIn.toString(), 8)) {
    console.error(`❌ ERROR: Insufficient CBBTC balance!`);
    return;
  }

  const poolInfo = await getBestPricedPool();
  if (!poolInfo) return;
  const { poolAddress, fee } = poolInfo;

  const poolData = await checkPoolLiquidity(poolAddress);
  if (!poolData || poolData.liquidity === 0) {
    console.error("❌ No liquidity available.");
    return;
  }

  const feeFreeRoutes = await checkFeeFreeRoute(amountIn);
  if (!feeFreeRoutes || feeFreeRoutes.length === 0) {
    console.error("❌ No fee-free route available. Aborting.");
    return;
  }

  console.log("✅ Fee-Free Route Confirmed!");

  await approveCBBTC(userWallet, amountIn);             
  if (!(await checkETHBalance(userWallet))) return;    
  
  let lastError = null;

  for (const route of feeFreeRoutes) {
    const { fee, poolData } = route;
  
    const tickSpacing = Number(poolData.tickSpacing);
    const baseTick = Math.floor(Number(poolData.tick) / tickSpacing) * tickSpacing;
  
    for (let i = 0; i < 3; i++) {
      const testTick = baseTick + (i * tickSpacing);
      console.log(`🔁 Trying supplication for fee ${fee} at tick ${testTick}`);
  
      let limitX96;
      try {
        limitX96 = BigInt(TickMath.getSqrtRatioAtTick(testTick).toString());
      } catch (err) {
        console.warn(`⚠️ Failed sqrtPriceLimitX96 for tick ${testTick}: ${err.message}`);
        lastError = err;
        continue;
      }
  
      const params = {
        tokenIn: CBBTC,
        tokenOut: USDC,
        fee,
        recipient: userWallet.address,
        deadline: Math.floor(Date.now() / 1000) + 600,
        amountIn: ethers.parseUnits(amountIn.toString(), 8),
        amountOutMinimum: ethers.parseUnits("0.01", 6),
        sqrtPriceLimitX96: limitX96,
      };
  
      console.log("🔍 Attempting supplication with params:", params);
  
      const swapRouterABI = await fetchABI(swapRouterAddress);
      const iface = new ethers.Interface(swapRouterABI);
      const functionData = iface.encodeFunctionData("exactInputSingle", [params]);

      const ethBefore = await provider.getBalance(userWallet.address);
      console.log(`💰 ETH Balance Before: ${ethers.formatEther(ethBefore)} ETH`);
  
      try {
        const feeData = await provider.getFeeData();
        const tx = await userWallet.sendTransaction({
          to: swapRouterAddress,
          data: functionData,
          gasLimit: 300000,
          maxFeePerGas: feeData.maxFeePerGas,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? ethers.parseUnits("1", "gwei"),
        });
  
        console.log("⏳ Waiting for confirmation...");
        const receipt = await tx.wait();
        console.log("✅ Supplication Transaction Confirmed:");
        console.log(`🔗 Tx Hash: ${receipt.hash}`);
        const ethAfter = await provider.getBalance(userWallet.address);
        console.log(`💰 ETH Balance After: ${ethers.formatEther(ethAfter)} ETH`);
        return;
      } catch (err) {
        console.error(`❌ Supplication failed at tick ${testTick}:`, err.reason || err.message || err);
        lastError = err;
      }
    }
  }

console.error("❌ All fee-free tick attempts failed.");
throw lastError;

  
}








const swapRouterAddress = "0x2626664c2603336E57B271c5C0b26F421741e481";

async function main() {
  console.log("\n🔍 Checking for a Fee-Free Quote...");
  // ✅ CBBTC amounts (8 decimals)
  const cbbtcAmounts = [
    0.002323, 
    // 0.0120323, 
    // 1.3233, 
    // 0.50012345, 
    // 2.12345678
  ];

  let foundFeeFree = false; // Track if any fee-free route was found

  // ✅ Check for CBBTC → USDC
  for (const amount of cbbtcAmounts) {
      const feeFree = await checkFeeFreeRoute(amount, "CBBTC", "USDC", 8);

      if (feeFree) {
          console.log(`\n✅ **Fee-Free Quote Found at ${amount} CBBTC!** 🚀`);
          foundFeeFree = true;
      }
  }
  if (!foundFeeFree) {
    console.log("\n❌ **No Fee-Free Quote Available for Any Checked Amounts.** Try Again Later.");
  } else {
      console.log("\n🎉 **Fee-Free Routes Checked for All Amounts!** 🚀");
  }

  // const cbbtcAmountToTrade = 0.00007024;

  // while (true) {
  //   try {
  //     await checkFeeFreeRoute(cbbtcAmountToTrade);
  //     console.log("🎉 Sqrt Price Check successful!");
  //     // await executeSupplication(cbbtcAmountToTrade);
  //     // console.log("🎉 Supplication successful!");
  //     break; // Exit loop after success
  //   } catch (error) {
  //     console.warn("❌ Supplication failed, retrying in 15s...\n", error.message || error);
  //     await new Promise(res => setTimeout(res, 15000));
  //   }
  // }
}



main().catch(console.error);

//to test run: yarn hardhat run test/cbbtc_mass_test.js --network base
