import { ethers } from "ethers"; 
import dotenv from "dotenv";
import axios from "axios";
import { TickMath } from "@uniswap/v3-sdk";

dotenv.config();

const __abiCache = new Map(); // address(lowercased) -> abi array

const POOLS = {
  500: "0xfBB6Eed8e7aa03B138556eeDaF5D271A5E1e43ef",
  3000: "0xeC558e484cC9f2210714E345298fdc53B253c27D",
};

// Contract Addresses
const QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
const FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";
const swapRouterAddress = "0x2626664c2603336E57B271c5C0b26F421741e481";

// Token Addresses (flipped: USDC -> CBBTC)
const USDC  = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

// Set Up Ethereum Provider & Wallet
const provider   = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
console.log(`✅ Using Test Wallet: ${userWallet.address}`);

const USDCContract = new ethers.Contract(USDC, [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address, uint256)",
  "function allowance(address, address) view returns (uint256)"
], userWallet);

async function fetchABI(contractAddress) {
  const key = contractAddress.toLowerCase();
  if (__abiCache.has(key)) return __abiCache.get(key);

  // reuse a previously learned pool ABI for known pool addresses
  const knownPools = Object.values(POOLS).map(a => a.toLowerCase());
  if (knownPools.includes(key) && __abiCache.has("uniswapPoolABI")) {
    return __abiCache.get("uniswapPoolABI");
  }

  const attempt = async () => {
    console.log(`🔍 Fetching ABI for ${contractAddress} from BaseScan...`);
    const { data } = await axios.get(
      `https://api.basescan.org/api?module=contract&action=getabi&address=${contractAddress}&apikey=${process.env.BASESCAN_API_KEY}`
    );
    if (data.status !== "1") throw new Error(`BaseScan API Error: ${data.message}`);
    const abi = JSON.parse(data.result);

    if (abi.some(i => i.name === "slot0" && Array.isArray(i.inputs) && i.inputs.length === 0)) {
      __abiCache.set("uniswapPoolABI", abi);
    }
    __abiCache.set(key, abi);
    return abi;
  };

  try {
    return await attempt();
  } catch (e1) {
    // brief backoff; avoids NOTOK bursts without adding manual ABIs
    await new Promise(r => setTimeout(r, 200));
    try {
      return await attempt();
    } catch (e2) {
      console.error("❌ Failed to fetch ABI:", e2.message);
      if (__abiCache.has("uniswapPoolABI") && knownPools.includes(key)) {
        console.log("♻️ Reusing cached Uniswap pool ABI");
        return __abiCache.get("uniswapPoolABI");
      }
      return null;
    }
  }
}

async function checkPoolLiquidity(poolAddress) {
  const poolABI = await fetchABI(poolAddress);
  if (!poolABI) return null;

  const pool = new ethers.Contract(poolAddress, poolABI, provider);

  try {
    const slot0       = await pool.slot0();
    const tickSpacing = await pool.tickSpacing();

    // ✅ Fetch **USDC balance** held in this pool contract
    const usdcBalance = await USDCContract.balanceOf(poolAddress);

    console.log("\n🔍 Pool Liquidity Data:");
    console.log(`   - sqrtPriceX96: ${slot0[0]}`);
    console.log(`   - Current Tick: ${slot0[1]}`);
    console.log(`   - USDC Liquidity (actual token balance): ${ethers.formatUnits(usdcBalance, 6)} USDC`);
    console.log(`   - Tick Spacing: ${tickSpacing}`);

    return {
      usdcLiquidity: usdcBalance,    // raw BigInt
      sqrtPriceX96: slot0[0],
      tick: slot0[1],
      tickSpacing
    };
  } catch (error) {
    console.error("❌ Failed to fetch liquidity:", error.message);
    return null;
  }
}

async function simulateWithQuoter(params) {
  const quoterABI = await fetchABI(QUOTER_ADDRESS);
  if (!quoterABI) return null;

  const iface = new ethers.Interface(quoterABI);

  const functionData = iface.encodeFunctionData("quoteExactInputSingle", [{
    tokenIn:  params.tokenIn,
    tokenOut: params.tokenOut,
    fee:      params.fee,
    amountIn: params.amountIn,
    sqrtPriceLimitX96: params.sqrtPriceLimitX96
  }]);

  try {
    const result = await provider.call({
      to: QUOTER_ADDRESS,
      data: functionData
    });

    const [amountOut] = iface.decodeFunctionResult("quoteExactInputSingle", result);
    // USDC -> CBBTC, so amountOut is cbBTC (8 decimals)
    return amountOut;
  } catch {
    return null;
  }
}

function decodeSqrtPrice(sqrtPriceX96) {
  // Convert to bigint if not already
  const sqrt = BigInt(sqrtPriceX96);

  // (sqrtPriceX96^2) / 2^192
  const numerator   = sqrt * sqrt;
  const denominator = 1n << 192n;
  const rawPrice    = Number(numerator) / Number(denominator);

  // Token decimals
  const usdcDecimals  = 6;
  const cbbtcDecimals = 8;

  // Flip to USDC per CBBTC and adjust decimals
  const adjustedPrice = (1 / rawPrice) * (10 ** (cbbtcDecimals - usdcDecimals));

  return adjustedPrice;
}

async function checkFeeFreeRoute(amountIn) {
  console.log(`\n🚀 Checking Fee-Free Routes for ${amountIn} USDC → CBBTC`);

  const factoryABI = await fetchABI(FACTORY_ADDRESS);
  if (!factoryABI) return [];

  const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);
  const feeFreeRoutes = [];
  const feeTiers = [500, 3000]; // check both pools
  const results = [];

  for (let fee of feeTiers) {
    console.log(`\n--- 🌊 Checking Pool Fee Tier: ${fee} ---`);
    try {
      const poolAddress = await factory.getPool(USDC, CBBTC, fee);
      if (poolAddress === ethers.ZeroAddress) {
        console.log(`❌ No pool for fee tier ${fee}`);
        results.push({ amount: amountIn, pool: fee, cbbtc: "❌ Pool not deployed" });
        continue;
      }

      const poolData = await checkPoolLiquidity(poolAddress);
      if (!poolData) {
        results.push({ amount: amountIn, pool: fee, cbbtc: "⚠️ ABI unavailable" });
        continue;
      }
      if (poolData.liquidity === 0n) {
        console.log(`❌ Skipping fee ${fee}: no liquidity`);
        results.push({ amount: amountIn, pool: fee, cbbtc: "❌ No liquidity" });
        continue;
      }

      try {
        const decodedPrice = decodeSqrtPrice(poolData.sqrtPriceX96);
        console.log(`💵 Decoded price (fee ${fee}): ${decodedPrice.toLocaleString()} USDC/CBBTC`);
      } catch (e) {
        console.warn(`⚠️ Failed to decode sqrtPrice for fee ${fee}: ${e.message}`);
      }

      console.log(`\n--- 🐝 LPP v1 Quoting 🐝 ---`);

      const tickSpacing = Number(poolData.tickSpacing);
      const baseTick    = Math.floor(Number(poolData.tick) / tickSpacing) * tickSpacing;
      let bestQuote = null;

      // Test 3 ticks around base
      for (let i = 0; i < 3; i++) {
        const testTick = baseTick + i * tickSpacing;
        try {
          const sqrtPriceLimitX96 = BigInt(TickMath.getSqrtRatioAtTick(testTick).toString());
          const amountInWei = ethers.parseUnits(amountIn.toString(), 6); // USDC decimals

          const simulation = await simulateWithQuoter({
            tokenIn:  USDC,
            tokenOut: CBBTC,
            fee,
            amountIn: amountInWei,
            sqrtPriceLimitX96
          });

          if (simulation && simulation > 0n) {
            const formatted = ethers.formatUnits(simulation, 8);
            console.log(`✅ Pool ${fee}: Tick ${testTick} → ${formatted} cbBTC`);
            feeFreeRoutes.push({ poolAddress, fee, sqrtPriceLimitX96, poolData, tick: testTick });

            // keep the last non-zero simulation for table summary
            bestQuote = formatted;
          } else {
            console.log(`⚠️ Skipping Pool ${fee}: Tick ${testTick} returned zero or failed`);
          }
        } catch (err) {
          console.warn(`⚠️ Pool ${fee}: skip tick ${testTick} → ${err.message}`);
        }
      }

      results.push({ amount: amountIn, pool: fee, cbbtc: bestQuote ?? "❌ Quote failed" });

    } catch (err) {
      console.warn(`⚠️ Fee tier ${fee} skipped: ${err.message}`);
      results.push({ amount: amountIn, pool: fee, cbbtc: "⚠️ Factory error" });
    }
  }

  // 📊 side-by-side summary
  console.table(results);

  return feeFreeRoutes;
}

async function checkUSDCBalance() {
  const balance = await USDCContract.balanceOf(userWallet.address);
  console.log(`💰 USDC Balance: ${ethers.formatUnits(balance, 6)} USDC`);
  return balance;
}

async function approveUSDC(amountIn) {
  console.log(`🔑 Approving Swap Router to spend ${amountIn} USDC...`);

  const allowance = await USDCContract.allowance(userWallet.address, swapRouterAddress);
  console.log(`✅ USDC Allowance: ${ethers.formatUnits(allowance, 6)} USDC`);
  
  if (allowance >= ethers.parseUnits(amountIn.toString(), 6)) {
    console.log("✅ Approval already granted.");
    return;
  }

  // 🔥 Fetch current gas price
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice;
  console.log(`⛽ Current Gas Price: ${ethers.formatUnits(gasPrice, "gwei")} Gwei`);

  // 🔥 Calculate max gas units for $0.03 (static cap; adjust as you like)
  const ethPriceInUSD = 2100; 
  const maxETHForGas  = 0.03 / ethPriceInUSD; // Convert $0.03 to ETH
  const maxGasUnits   = Math.floor(maxETHForGas / ethers.formatUnits(gasPrice, "ether"));

  console.log(`🔹 Max Gas Allowed: ${maxGasUnits} units (≈ $0.03 in ETH)`);

  const tx = await USDCContract.approve(
    swapRouterAddress,
    ethers.parseUnits(amountIn.toString(), 6),
    { gasLimit: maxGasUnits }
  );

  await tx.wait();
  console.log("✅ Approval Successful!");
}

async function checkETHBalance() {
  const ethBalance = await provider.getBalance(userWallet.address);
  console.log(`💰 ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice;
  const maxGasUnitsNumber = 70000n; // example limit
  const requiredGasETH = gasPrice * maxGasUnitsNumber;

  if (ethBalance < requiredGasETH) {
    console.error(`❌ Not enough ETH for gas fees! Required: ${ethers.formatEther(requiredGasETH)} ETH`);
    return false;
  }
  return true;
}

async function quotePoolsForAmount(amountInUSDC) {
  const amountInWei = ethers.parseUnits(amountInUSDC.toString(), 6);
  const results = [];

  for (const [fee] of Object.entries(POOLS)) {
    const out = await simulateWithQuoter({
      tokenIn: USDC,
      tokenOut: CBBTC,
      fee: Number(fee),
      amountIn: amountInWei,
      sqrtPriceLimitX96: 0n, // safe default
    });

    if (out && out > 0n) {
      results.push({ amount: amountInUSDC, pool: fee, cbbtc: ethers.formatUnits(out, 8) });
    } else {
      results.push({ amount: amountInUSDC, pool: fee, cbbtc: "❌ Quote failed" });
    }
  }

  console.table(results);
}

// LPP (Liquidity Pool Polination) v1 logic below
async function LPPv1(amountIn) {
  const amountInWei = ethers.parseUnits(amountIn.toString(), 6); // USDC decimals
  const routes = await checkFeeFreeRoute(amountIn);
  if (!routes || routes.length === 0) return [];

  const scored = [];
  for (const r of routes) {
    const out = await simulateWithQuoter({
      tokenIn:  USDC,
      tokenOut: CBBTC,
      fee: r.fee,
      amountIn: amountInWei,
      sqrtPriceLimitX96: r.sqrtPriceLimitX96, // match how we'll actually swap
    });
    if (out && out > 0n) {
      scored.push({ ...r, amountOut: out });
    }
  }

  console.log(`\n--- 🐝 LPP v1 Sorting 🐝 ---`);
  scored.sort((a, b) => (a.amountOut === b.amountOut ? 0 : (a.amountOut < b.amountOut ? 1 : -1)));

  console.table(
    scored.map(s => ({
      fee: s.fee,
      tick: s.tick,
      cbBTCOut: ethers.formatUnits(s.amountOut, 8),
      pool: s.poolAddress,
    }))
  );

  return scored;
}
// LPP (Liquidity Pool Polination) v1 logic above

export async function executeSupplication(amountIn) {
  console.log(`\n🚀 Executing Swap: ${amountIn} USDC → CBBTC`);

  // 1) Balance & gas checks
  const bal = await checkUSDCBalance();
  if (bal < ethers.parseUnits(amountIn.toString(), 8)) {
    console.error(`❌ ERROR: Insufficient CBBTC balance!`);
    return;
  }
  if (!(await checkETHBalance())) return;

  // 2) LPP
  const lpp = await LPPv1(amountIn);
  if (lpp.length === 0) {
    console.error("❌ LPP quote failed for this amount.");
    return;
  }

  // 3) Approve (once) before attempting swaps
  await approveUSDC(amountIn);

  // 4) Try routes from best to worst (highest cbBTC first)
  const beforeUSDC = await USDCContract.balanceOf(userWallet.address);
  const swapRouterABI = await fetchABI(swapRouterAddress);
  if (!swapRouterABI) {
    console.error("❌ Swap router ABI unavailable.");
    return;
  }
  const iface = new ethers.Interface(swapRouterABI);

  for (const route of lpp) {
    const { fee, sqrtPriceLimitX96, tick, amountOut } = route;

    // dynamic minOut: 0.5% slippage guard (and never below 1 sat)
    const minOut = (() => {
      const calc  = (amountOut * 995n) / 1000n; // 0.5% less than quoted
      const floor = ethers.parseUnits("0.00000001", 8); // 1 satoshi
      return calc > floor ? calc : floor;
    })();

    const params = {
      tokenIn:  USDC,
      tokenOut: CBBTC,
      fee,
      recipient: userWallet.address,
      deadline: Math.floor(Date.now() / 1000) + 600,
      amountIn: ethers.parseUnits(amountIn.toString(), 6),
      amountOutMinimum: minOut,
      sqrtPriceLimitX96, // exactly what we quoted with
    };

    console.log(
      `🔁 Trying best route: fee ${fee}, tick ${tick}, minOut ${ethers.formatUnits(minOut, 8)} cbBTC`
    );

    const data = iface.encodeFunctionData("exactInputSingle", [params]);

    try {
      const feeData = await provider.getFeeData();
      const tx = await userWallet.sendTransaction({
        to: swapRouterAddress,
        data,
        gasLimit: 300000,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? ethers.parseUnits("1", "gwei"),
      });

      console.log("⏳ Waiting for confirmation...");
      const receipt = await tx.wait();
      console.log("✅ Swap Confirmed!");
      console.log(`🔗 Tx Hash: ${receipt.hash}`);

      const afterUSDC = await USDCContract.balanceOf(userWallet.address);
      const spent = beforeUSDC - afterUSDC;
      console.log(`⚠️ Actually spent: ${ethers.formatUnits(spent, 6)} USDC`);
      return;
    } catch (err) {
      console.error(
        `❌ Route failed (fee ${fee}, tick ${tick}):`,
        err.reason || err.message || err
      );
    }
  }

  console.error("❌ All fee-free routes (by highest Quoter amount) failed.");
}

async function main() {
  // console.log("\n🔍 Checking for Fee-Free Quotes across fee tiers 500 (0.05%) & 3000 (0.3%)...");

  // const usdcAmounts = [50, 100, 250, 500, 1000];

  // for (const amount of usdcAmounts) {
  //   console.log(`\n==============================`);
  //   console.log(`💰 Checking amount: ${amount} USDC`);
  //   console.log(`==============================`);

  //   await quotePoolsForAmount(amount);

  //   const routes = await checkFeeFreeRoute(amount); 
  //   if (routes.length === 0) {
  //     console.log(`❌ No valid quotes found for ${amount} USDC at either fee tier.`);
  //   } else {
  //     console.log(`🎉 Found ${routes.length} valid route(s) for ${amount} USDC!`);
  //   }
  // }

  // await checkFeeFreeRoute(3);

  await executeSupplication(3);
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exitCode = 1;
});

// to test run: yarn hardhat run test/usdc_mass_test.js --network base