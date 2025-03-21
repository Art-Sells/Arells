import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// ✅ Uniswap Contract Addresses
const QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
const FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";

// ✅ Token Addresses
const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";

// ✅ Set Up Ethereum Provider & Wallet
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
console.log(`✅ Using Test Wallet: ${userWallet.address}`);

const USDCContract = new ethers.Contract(USDC, [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address, uint256)",
  "function allowance(address, address) view returns (uint256)"
], userWallet);

async function getImplementationAddress(proxyAddress) {
  const proxyABI = ["function implementation() view returns (address)"];
  const proxyContract = new ethers.Contract(proxyAddress, proxyABI, provider);
  try {
    const implementationAddress = await proxyContract.implementation();
    console.log(`✅ CBBTC Implementation Contract: ${implementationAddress}`);
    return implementationAddress;
  } catch (error) {
    console.error("❌ ERROR: Could not fetch implementation contract:", error.message);
    return null;
  }
}

async function fetchABI(contractAddress) {
  try {
    console.log(`🔍 Fetching ABI for ${contractAddress} from BaseScan...`);
    const response = await axios.get(
      `https://api.basescan.org/api?module=contract&action=getabi&address=${contractAddress}&apikey=${process.env.BASESCAN_API_KEY}`
    );
    if (response.data.status !== "1") throw new Error(`BaseScan API Error: ${response.data.message}`);
    const abi = JSON.parse(response.data.result);
    console.log(`✅ ABI Fetched Successfully for ${contractAddress}`);
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
  try {
    const poolAddress = await factory.getPool(USDC, CBBTC, 500);
    if (poolAddress === ethers.ZeroAddress) {
      console.error("❌ No Uniswap V3 Pool found for USDC-CBBTC.");
      return null;
    }
    console.log(`✅ Pool Address: ${poolAddress}`);
    return poolAddress;
  } catch (error) {
    console.error("❌ Failed to fetch pool address:", error.message);
    return null;
  }
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

async function checkFeeFreeRoute(amountIn) {
  console.log(`\n🚀 Checking Fee-Free Route for ${amountIn} CBBTC - > USDC`);
  const poolAddress = await getPoolAddress();
  if (!poolAddress) return false;
  const poolData = await checkPoolLiquidity(poolAddress);
  if (!poolData || poolData.liquidity === 0) {
    console.error("❌ Pool has ZERO liquidity. No swap can be quoted.");
    return false;
  }
  const tickLower = Math.floor(Number(poolData.tick) / Number(poolData.tickSpacing)) * Number(poolData.tickSpacing);
  const tickUpper = tickLower + Number(poolData.tickSpacing);
  console.log(`\n🔍 Checking liquidity between ticks: ${tickLower} → ${tickUpper}`);
  return poolData.liquidity > 0;
}

async function checkCBBTCBalance() {
  const proxyCBBTCContract = new ethers.Contract(CBBTC, [
    "function balanceOf(address) view returns (uint256)"
  ], provider);
  const balance = await proxyCBBTCContract.balanceOf(userWallet.address);
  console.log(`💰 CBBTC Balance: ${ethers.formatUnits(balance, 8)} CBBTC`);
  return balance;
}

async function getBalances() {
  const usdcBalance = await USDCContract.balanceOf(userWallet.address);
  const cbbtcBalance = await checkCBBTCBalance();
  return {
    usdc: ethers.formatUnits(usdcBalance, 6),
    cbbtc: ethers.formatUnits(cbbtcBalance, 8)
  };
}

async function approveCBBTC(amountIn) {
  console.log(`🔑 Approving Swap Router to spend ${amountIn} CBBTC...`);
  const balance = await checkCBBTCBalance();
  if (balance < ethers.parseUnits(amountIn.toString(), 8)) {
    console.error(`❌ ERROR: Insufficient CBBTC balance! Available: ${ethers.formatUnits(balance, 8)}, Required: ${amountIn}`);
    return;
  }
  const proxyCBBTCContract = new ethers.Contract(CBBTC, [
    "function approve(address, uint256)",
    "function allowance(address, address) view returns (uint256)"
  ], userWallet);
  const allowance = await proxyCBBTCContract.allowance(userWallet.address, swapRouterAddress);
  console.log(`✅ CBBTC Allowance: ${ethers.formatUnits(allowance, 8)} CBBTC`);
  if (allowance >= ethers.parseUnits(amountIn.toString(), 8)) {
    console.log("✅ Approval already granted.");
    return;
  }
  const feeData = await provider.getFeeData();
  const tx = await proxyCBBTCContract.approve(
    swapRouterAddress,
    ethers.parseUnits(amountIn.toString(), 8),
    { gasLimit: 70000 }
  );
  await tx.wait();
  console.log("✅ Approval Successful!");
}

async function checkETHBalance() {
  const ethBalance = await provider.getBalance(userWallet.address);
  const feeData = await provider.getFeeData();
  const requiredGasETH = feeData.gasPrice * 70000n;
  if (ethBalance < requiredGasETH) {
    console.error(`❌ Not enough ETH for gas fees! Required: ${ethers.formatEther(requiredGasETH)} ETH`);
    return false;
  }
  return true;
}

async function executeSwap(amountIn) {
  console.log(`\n🚀 Executing Swap: ${amountIn} CBBTC → USDC`);
  const balance = await checkCBBTCBalance();
  if (balance < ethers.parseUnits(amountIn.toString(), 8)) {
    console.error(`❌ ERROR: Insufficient CBBTC balance! Available: ${ethers.formatUnits(balance, 8)}, Required: ${amountIn}`);
    return;
  }
  const poolAddress = await getPoolAddress();
  if (!poolAddress) return;
  const poolData = await checkPoolLiquidity(poolAddress);
  if (!poolData || poolData.liquidity === 0) {
    console.error("❌ Pool has ZERO liquidity. No swap can be performed.");
    return;
  }
  const isFeeFree = await checkFeeFreeRoute(amountIn);
  if (!isFeeFree) {
    console.error("❌ No Fee-Free Route Available! Swap will NOT proceed.");
    return;
  }
  const balancesBefore = await getBalances();
  console.log(`\n🔍 Balances BEFORE Swap:`);
  console.log(`   - USDC: ${balancesBefore.usdc}`);
  console.log(`   - CBBTC: ${balancesBefore.cbbtc}`);

  await approveCBBTC(amountIn);
  if (!(await checkETHBalance())) return;

  console.log(`🔍 Fetching SwapRouter ABI for ${swapRouterAddress}...`);
  const swapRouterABI = await fetchABI(swapRouterAddress);
  const iface = new ethers.Interface(swapRouterABI);
  try {
    const exactInputSingleFragment = iface.getFunction("exactInputSingle");
    console.log("✅ exactInputSingle Function Fragment:");
    console.log(exactInputSingleFragment.format(ethers.FormatTypes.full));
  } catch (err) {
    console.error("❌ ERROR: 'exactInputSingle' not found in ABI!", err.message);
  }
  const swapRouter = new ethers.Contract(swapRouterAddress, swapRouterABI, userWallet);

  const sqrtPriceLimitX96 = BigInt(poolData.sqrtPriceX96) * 95n / 100n;
  const params = {
    tokenIn: CBBTC,
    tokenOut: USDC,
    fee: 500,
    recipient: userWallet.address,
    deadline: Math.floor(Date.now() / 1000) + 600,
    amountIn: ethers.parseUnits(amountIn.toString(), 8),
    amountOutMinimum: ethers.parseUnits("0.0001", 6),
    sqrtPriceLimitX96
  };

  try {
    console.log("\n🔍 Simulating swap with callStatic...");
    const estimatedOut = await swapRouter.callStatic.exactInputSingle(params);
    console.log("✅ Estimated Output:", ethers.formatUnits(estimatedOut, 6));
    console.log("\n🚀 Sending transaction...");
    const tx = await swapRouter.exactInputSingle(params);
    const receipt = await tx.wait();
    console.log("✅ Transaction Confirmed! Hash:", receipt.hash);
  } catch (err) {
    console.error("❌ ERROR: Swap Transaction Failed:", err.reason || err.message);
  }
}

const swapRouterAddress = "0x2626664c2603336E57B271c5C0b26F421741e481";

async function main() {
  console.log("\n🔍 Checking for a Fee-Free Quote...");
  const cbbtcAmountToTrade = 0.00006021;
  await executeSwap(cbbtcAmountToTrade);
}

main().catch(console.error);
