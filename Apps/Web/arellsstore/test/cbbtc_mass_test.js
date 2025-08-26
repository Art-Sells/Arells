// test/cbbtc_mass_test.js
import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";
import { TickMath } from "@uniswap/v3-sdk";
dotenv.config();

// ── Addresses (Base)
const STATE_VIEW_ADDRESS  = "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71";
const V4_POOL_MANAGER     = "0x498581fF718922c3f8e6A244956aF099B2652b2b";
const V4_QUOTER_ADDRESS   = "0x0d5e0f971ed27fbff6c2837bf31316121532048d";
const V4_ROUTER_ADDRESS   = "0x6ff5693b99212da76ad316178a184ab56d299b43";
const PERMIT2             = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
const USDC  = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // 6dp
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf"; // 8dp

// Universal Router command bytes (the ones that actually worked in your logs)
const CMD_P2_TRANSFER_FROM = "0x05";
const CMD_V4_SWAP_SINGLE_IN = "0x06";

const provider   = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);

// Known pool
const POOL = {
  label: "V4 A (0.3%)",
  poolId: "0x64f978ef116d3c2e1231cfd8b80a369dcd8e91b28037c9973b65b59fd2cbbb96",
  hooks:  "0x5cd525c621AFCa515Bf58631D4733fbA7B72Aae4",
  fee:    3000,
};

// ── Helpers
async function fetchABI(addr) {
  const url = `https://api.basescan.org/api?module=contract&action=getabi&address=${addr}&apikey=${process.env.BASESCAN_API_KEY}`;
  const { data } = await axios.get(url);
  if (data.status !== "1") throw new Error(`Failed ABI for ${addr}: ${data.message}`);
  return JSON.parse(data.result);
}
function computePoolId(k) {
  const enc = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address","address","uint24","int24","address"],
    [k.currency0, k.currency1, k.fee, k.tickSpacing, k.hooks]
  );
  return ethers.keccak256(enc);
}
const TICK_SPACING_CANDIDATES = [1,5,10,20,40,60,100,120,200];
function inferTickSpacingFromPoolId({ token0, token1, fee, hooks, poolId }) {
  for (const ts of TICK_SPACING_CANDIDATES) {
    const id = computePoolId({ currency0: token0, currency1: token1, fee, tickSpacing: ts, hooks });
    if (id.toLowerCase() === poolId.toLowerCase()) return ts;
  }
  throw new Error("Could not infer tickSpacing from poolId.");
}
async function getSlot0(poolId) {
  const abi = await fetchABI(STATE_VIEW_ADDRESS);
  const iface = new ethers.Interface(abi);
  const data = iface.encodeFunctionData("getSlot0", [poolId]);
  const raw  = await provider.call({ to: STATE_VIEW_ADDRESS, data });
  const [sqrtPriceX96, tick, protocolFee, lpFee] = iface.decodeFunctionResult("getSlot0", raw);
  return { sqrtPriceX96, tick, protocolFee, lpFee };
}
async function v4Quote({ poolKey, zeroForOne, exactAmount, sqrtPriceLimitX96 }) {
  const abi = await fetchABI(V4_QUOTER_ADDRESS);
  const iface = new ethers.Interface(abi);
  const data = iface.encodeFunctionData("quoteExactInputSingle", [{
    poolKey: {
      currency0: poolKey.currency0,
      currency1: poolKey.currency1,
      fee: BigInt(poolKey.fee),
      tickSpacing: BigInt(poolKey.tickSpacing),
      hooks: poolKey.hooks,
    },
    zeroForOne,
    exactAmount: BigInt(exactAmount),
    sqrtPriceLimitX96: BigInt(sqrtPriceLimitX96),
    hookData: "0x",
  }]);
  const raw = await provider.call({ to: V4_QUOTER_ADDRESS, data, from: userWallet.address });
  const [amountOut] = iface.decodeFunctionResult("quoteExactInputSingle", raw);
  return amountOut;
}

// ── Approvals (ERC20 -> Permit2; Permit2 -> Router)
async function approveCBBTC(amountIn) {
  console.log("🔑 Approving cbBTC for Permit2 and setting Permit2 allowance to Router…");
  const cb = new ethers.Contract(CBBTC, [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address,address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)"
  ], userWallet);
  const bal = await cb.balanceOf(userWallet.address);
  if (bal < amountIn) throw new Error("Insufficient cbBTC balance");
  const cur = await cb.allowance(userWallet.address, PERMIT2);
  if (cur < amountIn) await (await cb.approve(PERMIT2, ethers.MaxUint256)).wait();

  const p2Abi = await fetchABI(PERMIT2);
  const p2 = new ethers.Contract(PERMIT2, p2Abi, userWallet);
  const curr = await p2.allowance(userWallet.address, CBBTC, V4_ROUTER_ADDRESS); // (uint160, uint48, uint48)
  const want = (1n << 160n) - 1n;
  const exp  = (1n << 48n) - 1n;
  if (curr[0] < want) await (await p2.approve(CBBTC, V4_ROUTER_ADDRESS, want, exp)).wait();
}

// ── Encoders for UR inputs
function encode_P2_transferFrom({ token, from, to, amount }) {
  // (address token, address from, address to, uint160 amount)
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["address","address","address","uint160"],
    [token, from, to, BigInt(amount)]
  );
}
function encode_V4_singleExactIn({ poolKey, zeroForOne, amountIn, sqrtPriceLimitX96, recipient }) {
  // tuple(address,address,uint24,int24,address), bool, int256, uint160, address, bytes
  const key = [
    poolKey.currency0,
    poolKey.currency1,
    BigInt(poolKey.fee),
    BigInt(poolKey.tickSpacing),
    poolKey.hooks
  ];
  return ethers.AbiCoder.defaultAbiCoder().encode(
    [
      "tuple(address,address,uint24,int24,address)",
      "bool",
      "int256",
      "uint160",
      "address",
      "bytes"
    ],
    [ key, Boolean(zeroForOne), -BigInt(amountIn), BigInt(sqrtPriceLimitX96), recipient, "0x" ]
  );
}

// ── Core
async function executeV4(amountFloat) {
  console.log(`\n🚀 Executing via Universal Router: ${amountFloat} cbBTC → USDC`);

  // 1) Router ABI + alignment
  const rAbi = await fetchABI(V4_ROUTER_ADDRESS);
  const rIfc = new ethers.Interface(rAbi);
  const pmCall = rIfc.encodeFunctionData("poolManager", []);
  const pmRaw  = await provider.call({ to: V4_ROUTER_ADDRESS, data: pmCall });
  const [routerPM] = rIfc.decodeFunctionResult("poolManager", pmRaw);
  if (routerPM.toLowerCase() !== V4_POOL_MANAGER.toLowerCase()) {
    throw new Error("Router.poolManager != expected PoolManager");
  }
  console.log("\n🧾 Router ABI fetched. Total entries:", rAbi.length);
  rAbi.filter(x=>x.type==="function").slice(0,8).forEach(f=>console.log("   -", f.name+"("+ (f.inputs||[]).map(i=>i.type).join(", ")+")"));

  // 2) Amounts & approvals
  const amountIn = ethers.parseUnits(amountFloat.toString(), 8); // cbBTC 8dp
  await approveCBBTC(amountIn);

  // 3) Build poolKey & a safe in-tick price limit
  const token0 = USDC.toLowerCase();
  const token1 = CBBTC.toLowerCase();
  const tickSpacing = inferTickSpacingFromPoolId({ token0, token1, fee: POOL.fee, hooks: POOL.hooks, poolId: POOL.poolId });
  const poolKey = { currency0: token0, currency1: token1, fee: POOL.fee, tickSpacing, hooks: POOL.hooks };

  const { tick } = await getSlot0(POOL.poolId);
  const baseTick = Math.floor(Number(tick) / tickSpacing) * tickSpacing;
  const sqrtLimit = BigInt(TickMath.getSqrtRatioAtTick(baseTick + (tickSpacing - 1)).toString());
  const zeroForOne = false; // selling token1(cbBTC) for token0(USDC)

  // optional quote
  try {
    const quoted = await v4Quote({ poolKey, zeroForOne, exactAmount: amountIn, sqrtPriceLimitX96: sqrtLimit });
    console.log("🔎 Quoter @ limit:", ethers.formatUnits(quoted, 6), "USDC");
  } catch {}

  // 4) Build UR inputs
  const p2Input   = encode_P2_transferFrom({ token: CBBTC, from: userWallet.address, to: V4_ROUTER_ADDRESS, amount: amountIn });
  const swapInput = encode_V4_singleExactIn({ poolKey, zeroForOne, amountIn, sqrtPriceLimitX96: sqrtLimit, recipient: userWallet.address });

  // 5) Commands (order matters): transferFrom then swap
  const commands = ("0x" + CMD_P2_TRANSFER_FROM.slice(2) + CMD_V4_SWAP_SINGLE_IN.slice(2)).toLowerCase();
  const inputs   = [p2Input, swapInput];

  // 6) Execute
  const hasExec3 = rAbi.some(f => f.type==="function" && f.name==="execute" && f.inputs?.length===3);
  const deadline = BigInt(Math.floor(Date.now()/1000) + 600);
  const calldata = hasExec3
    ? rIfc.encodeFunctionData("execute(bytes,bytes[],uint256)", [commands, inputs, deadline])
    : rIfc.encodeFunctionData("execute(bytes,bytes[])"        , [commands, inputs]);

  // pre/post USDC delta
  const usdc = new ethers.Contract(USDC, ["function balanceOf(address) view returns (uint256)"], provider);
  const pre = await usdc.balanceOf(userWallet.address);

  // (optional) dry-run just to surface a selector if it reverts
  try { await provider.call({ to: V4_ROUTER_ADDRESS, data: calldata, from: userWallet.address }); }
  catch(e){ const sig = (e?.data ?? e?.error?.data ?? "").slice(0,10); if(sig) console.log("🧪 preflight revert (ok):", sig); }

  const fee = await provider.getFeeData();
  const tx = await userWallet.sendTransaction({
    to: V4_ROUTER_ADDRESS,
    data: calldata,
    gasLimit: 1_000_000,
    maxFeePerGas: fee.maxFeePerGas,
    maxPriorityFeePerGas: fee.maxPriorityFeePerGas ?? ethers.parseUnits("1","gwei"),
  });
  console.log("⏳ Broadcasting…", tx.hash);
  await tx.wait();
  console.log("✅ Confirmed:", tx.hash);

  const post  = await usdc.balanceOf(userWallet.address);
  console.log("💵 USDC delta:", ethers.formatUnits(post - pre, 6), "(post:", ethers.formatUnits(post,6)+")");
}

// ── Main
(async function main(){
  console.log(`\n🔎 ${POOL.label}`);
  console.log(`• Using manual poolId: ${POOL.poolId}`);
  const { sqrtPriceX96, lpFee, protocolFee } = await getSlot0(POOL.poolId);
  console.log("📈 Current sqrtPriceX96:", sqrtPriceX96);
  console.log(`🧾 Fees (ppm): lpFee=${Number(lpFee)} protocolFee=${Number(protocolFee)}`);

  await executeV4(0.00005);
})().catch((e)=>{ console.error(e); process.exitCode=1; });

// Run: yarn hardhat run test/cbbtc_mass_test.js --network base