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

function mkContracts(customPrivateKey) {
  const wallet = new ethers.Wallet(customPrivateKey, provider);
  const USDCContract = new ethers.Contract(
    USDC,
    [
      "function balanceOf(address) view returns (uint256)",
      "function approve(address spender, uint256 value) returns (bool)",
      "function allowance(address owner, address spender) view returns (uint256)"
    ],
    wallet
  );
  return { wallet, USDCContract };
}

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

  const [slot0, tickSpacing, liquidity] = await Promise.all([
    pool.slot0(),
    pool.tickSpacing(),
    pool.liquidity ? pool.liquidity() : 0n,
  ]);

  const sqrtPriceX96 = slot0.sqrtPriceX96 ?? slot0[0];
  const tick         = slot0.tick ?? slot0[1];

  return {
    liquidity: BigInt(liquidity.toString ? liquidity.toString() : liquidity),
    sqrtPriceX96: BigInt(sqrtPriceX96.toString ? sqrtPriceX96.toString() : sqrtPriceX96),
    tick: Number(tick),
    tickSpacing: Number(tickSpacing),
  };
}












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


















async function checkUSDCBalance(USDCContract, wallet) {
  const balance = await USDCContract.balanceOf(wallet.address);
  console.log(`💰 USDC Balance for ${wallet.address}: ${ethers.formatUnits(balance, 6)} USDC`);
  return balance;
}

async function approveUSDC(amountIn, USDCContract, wallet) {
  console.log(`🔑 Approving Swap Router to spend ${amountIn} USDC...`);

  const allowance = await USDCContract.allowance(wallet.address, swapRouterAddress);
  console.log(`✅ Current Allowance: ${ethers.formatUnits(allowance, 6)} USDC`);

  if (allowance >= ethers.parseUnits(amountIn.toString(), 6)) {
    console.log("✅ Approval already granted.");
    return;
  }

  const tx = await USDCContract.approve(
    swapRouterAddress,
    ethers.parseUnits(amountIn.toString(), 6)
  );
  await tx.wait();
  console.log("✅ Approval Successful!");
}

async function checkETHBalance(wallet) {
  const ethBalance = await provider.getBalance(wallet.address);
  console.log(`💰 ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);
  return true;
}
















export async function executeSupplication(amountIn, customPrivateKey) {
  // Bind to the MASS wallet passed in
  const { wallet, USDCContract } = mkContracts(customPrivateKey);
  console.log(`✅ Using Wallet: ${wallet.address}`);
  console.log(`\n🚀 Executing Swap: ${amountIn} USDC → CBBTC`);

  // 1) Balance & gas checks
  const need = ethers.parseUnits(amountIn.toString(), 6);
  const bal  = await checkUSDCBalance(USDCContract, wallet);
  if (bal < need) throw new Error(`Insufficient USDC: have ${ethers.formatUnits(bal, 6)}, need ${amountIn}`);
  if (!(await checkETHBalance(wallet))) throw new Error("Not enough ETH for gas on MASS wallet");

  // 2) Get best routes (with amountOut)
  const lpp = await LPPv1(amountIn);
  if (!lpp || lpp.length === 0) throw new Error("LPP quote failed for this amount.");

  // 3) Approve
  await approveUSDC(amountIn, USDCContract, wallet);

  // 4) Attempt swap(s)
  const beforeUSDC   = await USDCContract.balanceOf(wallet.address);
  const swapRouterABI = await fetchABI(swapRouterAddress);
  if (!swapRouterABI) throw new Error("Swap router ABI unavailable.");
  const iface = new ethers.Interface(swapRouterABI);

  for (const route of lpp) {
    const { fee, sqrtPriceLimitX96, tick, amountOut } = route;

    const minOut = (() => {
      const calc  = (amountOut * 995n) / 1000n; // 0.5% slippage
      const floor = ethers.parseUnits("0.00000001", 8); // 1 sat
      return calc > floor ? calc : floor;
    })();

    const params = {
      tokenIn:  USDC,
      tokenOut: CBBTC,
      fee,
      recipient: wallet.address,
      deadline: Math.floor(Date.now() / 1000) + 600,
      amountIn: need,
      amountOutMinimum: minOut,
      sqrtPriceLimitX96,
    };

    const data = iface.encodeFunctionData("exactInputSingle", [params]);

    try {
      const feeData = await provider.getFeeData();
      const tx = await wallet.sendTransaction({
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

      const afterUSDC = await USDCContract.balanceOf(wallet.address);
      const spent = beforeUSDC - afterUSDC;
      console.log(`⚠️ Actually spent: ${ethers.formatUnits(spent, 6)} USDC`);
      return;
    } catch (err) {
      console.error(`❌ Route failed (fee ${fee}, tick ${tick}):`, err.reason || err.message || err);
    }
  }

  throw new Error("All routes failed.");
}












async function main() {

  const amountInUSDC = 2;
  const customPrivateKey = process.env.PRIVATE_KEY_TEST;

  console.log("\n🔍 Checking for a Fee-Free Quote...");
  const feeFreeRoutes = await checkFeeFreeRoute(amountInUSDC);
  if (feeFreeRoutes.length === 0) {
    console.error("❌ No route found");
    return;
  }

//  console.log("Running executeSupplication...");
//  await executeSupplication(amountInUSDC, customPrivateKey);

}



main().catch(console.error);

//to test run: yarn hardhat run **insert-file-route-here** --network base