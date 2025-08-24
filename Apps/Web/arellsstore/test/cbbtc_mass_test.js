// test/cbbtc_mass_test.js
import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";
import { TickMath } from "@uniswap/v3-sdk";

dotenv.config();

// ──────────────────────────────────────────────────────────────────────────────
// Network & addresses (Base)
// ──────────────────────────────────────────────────────────────────────────────
const STATE_VIEW_ADDRESS  = "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71";
const V4_POOL_MANAGER     = "0x498581fF718922c3f8e6A244956aF099B2652b2b";
const V4_QUOTER_ADDRESS   = "0x0d5e0f971ed27fbff6c2837bf31316121532048d";
const V4_ROUTER_ADDRESS   = "0x6ff5693b99212da76ad316178a184ab56d299b43";
const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

const USDC  = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // 6dp
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf"; // 8dp

const provider   = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);

// Known pool
const POOL = {
  label: "V4 A (0.3%)",
  poolId: "0x64f978ef116d3c2e1231cfd8b80a369dcd8e91b28037c9973b65b59fd2cbbb96",
  hooks:  "0x5cd525c621AFCa515Bf58631D4733fbA7B72Aae4",
  fee:    3000,
};

// ──────────────────────────────────────────────────────────────────────────────
// BaseScan ABI fetch
// ──────────────────────────────────────────────────────────────────────────────
async function fetchABI(addr) {
  const url = `https://api.basescan.org/api?module=contract&action=getabi&address=${addr}&apikey=${process.env.BASESCAN_API_KEY}`;
  const resp = await axios.get(url);
  if (resp.data.status !== "1") throw new Error(`Failed ABI for ${addr}: ${resp.data.message}`);
  return JSON.parse(resp.data.result);
}

// ──────────────────────────────────────────────────────────────────────────────
function computePoolId(poolKey) {
  const abi = ethers.AbiCoder.defaultAbiCoder();
  const enc = abi.encode(
    ["address","address","uint24","int24","address"],
    [poolKey.currency0, poolKey.currency1, poolKey.fee, poolKey.tickSpacing, poolKey.hooks]
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

// ──────────────────────────────────────────────────────────────────────────────
// StateView helpers (no manual ABI)
// ──────────────────────────────────────────────────────────────────────────────
async function getSlot0(poolId) {
  const abi = await fetchABI(STATE_VIEW_ADDRESS);
  const iface = new ethers.Interface(abi);
  const data = iface.encodeFunctionData("getSlot0", [poolId]);
  const raw  = await provider.call({ to: STATE_VIEW_ADDRESS, data });
  const [sqrtPriceX96, tick, protocolFee, lpFee] = iface.decodeFunctionResult("getSlot0", raw);
  return { sqrtPriceX96, tick, protocolFee, lpFee };
}

async function getLiquidity(poolId) {
  const abi = await fetchABI(STATE_VIEW_ADDRESS);
  const iface = new ethers.Interface(abi);
  if (!abi.find(f => f.name === "getLiquidity")) return 0n;
  const data = iface.encodeFunctionData("getLiquidity", [poolId]);
  const raw  = await provider.call({ to: STATE_VIEW_ADDRESS, data });
  const [L]  = iface.decodeFunctionResult("getLiquidity", raw);
  return L;
}

async function fetchRouter() {
  const abi   = await fetchABI(V4_ROUTER_ADDRESS);
  const iface = new ethers.Interface(abi);
  const exec  = abi.find(f => f.type === "function" && f.name === "execute");
  if (!exec) throw new Error("Router has no execute(bytes,bytes[])");
  console.log(`\n🧾 Router ABI fetched. Total entries: ${abi.length}`);
  abi.filter(x => x.type === "function").forEach(f => {
    const ins  = (f.inputs  || []).map(inp => inp.type).join(", ");
    const outs = (f.outputs || []).map(o => o.type).join(", ");
    console.log(`   - ${f.name}(${ins})${outs ? " returns " + outs : ""}`);
  });
  return { abi, iface, exec };
}

// ──────────────────────────────────────────────────────────────────────────────
// Quoter v4 (sanity check)
// ──────────────────────────────────────────────────────────────────────────────
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
  return amountOut; // 6dp USDC
}

// ──────────────────────────────────────────────────────────────────────────────
// Decode sqrtPrice (keep exactly as you asked)
// ──────────────────────────────────────────────────────────────────────────────
function decodeSqrtPriceX96ToFloat(sqrtPriceX96, decimalsToken0 = 6, decimalsToken1 = 8) {
  const Q96 = 2n ** 96n;
  const sqrt = BigInt(sqrtPriceX96);
  const raw  = Number(sqrt * sqrt) / Number(Q96 * Q96);
  return (1 / raw) * 10 ** (decimalsToken1 - decimalsToken0);
}

// ──────────────────────────────────────────────────────────────────────────────
// Approvals & gas checks (pulled from your v3 and wired for v4 PoolManager)
// ──────────────────────────────────────────────────────────────────────────────
async function checkCBBTCBalance() {
  const c = new ethers.Contract(CBBTC, ["function balanceOf(address) view returns (uint256)"], provider);
  const bal = await c.balanceOf(userWallet.address);
  console.log(`💰 CBBTC Balance: ${ethers.formatUnits(bal, 8)} CBBTC`);
  return bal;
}

async function ensureApproval(toAddr, amountBaseUnits) {
  const erc = new ethers.Contract(
    CBBTC,
    ["function approve(address,uint256)","function allowance(address,address) view returns (uint256)"],
    userWallet
  );
  const cur = await erc.allowance(userWallet.address, toAddr);
  if (cur >= amountBaseUnits) return;
  const tx = await erc.approve(toAddr, amountBaseUnits);
  await tx.wait();
}

async function approveCBBTC(amountInFloat) {
  console.log(`🔑 Approving PoolManager to spend ${amountInFloat} CBBTC...`);
  const amountBaseUnits = ethers.parseUnits(amountInFloat.toString(), 8);
  const bal = await checkCBBTCBalance();
  if (bal < amountBaseUnits) {
    console.error("❌ ERROR: Insufficient CBBTC balance!");
    return false;
  }
  await ensureApproval(V4_ROUTER_ADDRESS, amountBaseUnits);
  const c = new ethers.Contract(
    CBBTC,
    ["function approve(address,uint256)","function allowance(address,address) view returns (uint256)"],
    userWallet
  );
  const current = await c.allowance(userWallet.address, V4_POOL_MANAGER);
  console.log(`📎 BEFORE Approval: ${ethers.formatUnits(current, 8)} CBBTC`);
  if (current < amountBaseUnits) {
    const tx = await c.approve(V4_POOL_MANAGER, amountBaseUnits);
    const rc = await tx.wait();
    console.log("✅ Approval Successful!", rc.transactionHash);
  } else {
    console.log("✅ Approval already sufficient.");
  }
  const after = await c.allowance(userWallet.address, V4_POOL_MANAGER);
  console.log(`📎 AFTER Approval: ${ethers.formatUnits(after, 8)} CBBTC`);
  return true;
}

async function checkETHBalance() {
  const ethBalance = await provider.getBalance(userWallet.address);
  const feeData = await provider.getFeeData();
  const required = (feeData.gasPrice ?? ethers.parseUnits("0.1","gwei")) * 900000n;
  if (ethBalance < required) {
    console.error(`❌ Not enough ETH for gas (~${ethers.formatEther(required)} ETH needed).`);
    return false;
  }
  return true;
}

// ──────────────────────────────────────────────────────────────────────────────
// Build poolKey & an in-tick sqrtPriceLimitX96 (cbBTC -> USDC, zeroForOne=false)
// ──────────────────────────────────────────────────────────────────────────────
async function buildLimitAndPoolKey() {
  const token0 = USDC.toLowerCase();
  const token1 = CBBTC.toLowerCase();

  const tickSpacing = inferTickSpacingFromPoolId({
    token0, token1, fee: POOL.fee, hooks: POOL.hooks, poolId: POOL.poolId,
  });

  const poolKey = {
    currency0: token0,
    currency1: token1,
    fee: POOL.fee,
    tickSpacing,
    hooks: POOL.hooks,
  };

  const recomputed = computePoolId(poolKey);
  if (recomputed.toLowerCase() !== POOL.poolId.toLowerCase())
    throw new Error("poolId recompute mismatch");

  const { sqrtPriceX96, tick, protocolFee, lpFee } = await getSlot0(POOL.poolId);
  console.log(`📈 Current sqrtPriceX96: ${sqrtPriceX96}`);
  console.log(`🧾 Fees (ppm): lpFee=${Number(lpFee)} protocolFee=${Number(protocolFee)}`);

  const baseTick = Math.floor(Number(tick) / tickSpacing) * tickSpacing;
  const limitX96 = BigInt(TickMath.getSqrtRatioAtTick(baseTick + (tickSpacing - 1)).toString());
  return { poolKey, sqrtPriceX96, tickSpacing, baseTick, limitX96 };
}

function encodeUR_V4_SwapExactIn(poolKey, { zeroForOne, amountIn, sqrtPriceLimitX96, recipient }) {
  // Router’s v4 swap input packing (per UR v4 spec): 
  // abi.encode(
  //   (address,address,uint24,int24,address) poolKey,
  //   bool zeroForOne,
  //   int256 amountSpecified,        // negative => exact input
  //   uint160 sqrtPriceLimitX96,
  //   address recipient,
  //   bytes hookData
  // )
  const coder = ethers.AbiCoder.defaultAbiCoder();
  const keyTuple = [
    poolKey.currency0,
    poolKey.currency1,
    BigInt(poolKey.fee),
    BigInt(poolKey.tickSpacing),
    poolKey.hooks
  ];
  const amountSpecified = -BigInt(amountIn); // exact input = negative
  const hookData = "0x";

  return coder.encode(
    [
      "tuple(address,address,uint24,int24,address)",
      "bool",
      "int256",
      "uint160",
      "address",
      "bytes"
    ],
    [ keyTuple, Boolean(zeroForOne), amountSpecified, BigInt(sqrtPriceLimitX96), recipient, hookData ]
  );
}

async function discoverV4SwapOpcode({ poolKey, sqrtPriceLimitX96, amountIn, recipient }) {
  const { abi, iface } = await fetchRouter();
  const exec = iface.getFunction("execute(bytes,bytes[])");

  // Build the single-input payload for v4 swap exact-in
  const input = encodeUR_V4_SwapExactIn(poolKey, {
    zeroForOne: false,                // cbBTC -> USDC (token1 -> token0)
    amountIn,
    sqrtPriceLimitX96,
    recipient
  });

  // Try all 256 command bytes via eth_call; collect the ones that "do something" (i.e. a distinct revert or non-zero returndata)
  const good = [];
  for (let op = 0; op < 256; op++) {
    try {
      const commands = "0x" + op.toString(16).padStart(2,"0");
      const data = iface.encodeFunctionData(exec, [commands, [input]]);
      const ret  = await provider.call({ to: V4_ROUTER_ADDRESS, data, from: recipient });
      // If call didn’t revert, we almost certainly hit a valid op (might still revert on-chain without funds).
      good.push({ op, ret });
    } catch (e) {
      // If the revert reason changes for a particular op, it’s often the right one.
      const msg = (e?.reason || e?.shortMessage || e?.message || "").slice(0,120);
      if (msg && !/invalid|unknown|length|selector/i.test(msg)) {
        good.push({ op, err: msg });
      }
    }
  }

  // pick the first candidate; you can refine by checking `err` text if multiple candidates appear
  if (good.length === 0) throw new Error("Could not discover a v4 swap opcode on this Router.");
  const chosen = good[0].op;
  console.log("🔎 Discovered candidate v4 swap opcode:", "0x" + chosen.toString(16).padStart(2,"0"), good[0].err ? `(${good[0].err})` : "");
  return chosen;
}

// V4 tick-anchor checker (mirrors your V3 loop). No PPMs — just “>0” quotes.
async function checkFeeFreeRouteV4(amountInFloat) {
  const token0 = USDC.toLowerCase();
  const token1 = CBBTC.toLowerCase();

  // infer tickSpacing + poolKey + baseTick
  const tickSpacing = inferTickSpacingFromPoolId({
    token0, token1, fee: POOL.fee, hooks: POOL.hooks, poolId: POOL.poolId,
  });
  const poolKey = { currency0: token0, currency1: token1, fee: POOL.fee, tickSpacing, hooks: POOL.hooks };

  const recomputed = computePoolId(poolKey);
  if (recomputed.toLowerCase() !== POOL.poolId.toLowerCase()) return [];

  const { tick } = await getSlot0(POOL.poolId);
  const baseTick = Math.floor(Number(tick) / tickSpacing) * tickSpacing;

  const amountIn = ethers.parseUnits(amountInFloat.toString(), 8); // cbBTC (8dp)
  const candidates = [];

  for (let i = 0; i < 3; i++) {
    const testTick = baseTick + i * tickSpacing;
    const sqrtPriceLimitX96 = BigInt(TickMath.getSqrtRatioAtTick(testTick).toString());
    try {
      const out = await v4Quote({
        poolKey,
        zeroForOne: false,                 // cbBTC -> USDC
        exactAmount: amountIn,
        sqrtPriceLimitX96,
      });
      if (out && out > 0n) {
        candidates.push({ tick: testTick, sqrtPriceLimitX96, amountOut: out, poolKey, tickSpacing, baseTick });
      }
    } catch { /* ignore this anchor */ }
  }
  return candidates;
}

async function executeSupplicationV4(amountInFloat) {
  console.log(`\n🚀 Executing via Universal Router: ${amountInFloat} cbBTC → USDC`);

  // approvals + gas
  const amountIn = ethers.parseUnits(amountInFloat.toString(), 8);
  if (!(await approveCBBTC(amountInFloat))) return;
  if (!(await checkETHBalance())) return;

  // 1) choose a tick-anchored sqrtPriceLimit from your checker (or fallback in-tick)
  let chosen;
  const routes = await checkFeeFreeRouteV4(amountInFloat);  // you already have this
  if (routes.length > 0) {
    chosen = routes[0];
    console.log(`✅ Using checker tick=${chosen.tick} | sqrtLimit=${chosen.sqrtPriceLimitX96.toString()}`);
  } else {
    const { poolKey, limitX96, tickSpacing, baseTick } = await buildLimitAndPoolKey();
    chosen = { poolKey, sqrtPriceLimitX96: limitX96, tickSpacing, baseTick };
    console.log("ℹ️ No checker candidates; using in-tick limit.");
  }

  // ensure poolKey
  const poolKey = chosen.poolKey ?? (() => {
    const token0 = USDC.toLowerCase();
    const token1 = CBBTC.toLowerCase();
    const ts = chosen.tickSpacing ?? inferTickSpacingFromPoolId({
      token0, token1, fee: POOL.fee, hooks: POOL.hooks, poolId: POOL.poolId,
    });
    return { currency0: token0, currency1: token1, fee: POOL.fee, tickSpacing: ts, hooks: POOL.hooks };
  })();
  const sqrtPriceLimitX96 = BigInt(chosen.sqrtPriceLimitX96);

  // (optional) quoter sanity
  try {
    const sanity = await v4Quote({ poolKey, zeroForOne: false, exactAmount: amountIn, sqrtPriceLimitX96 });
    console.log(`🔎 Quoter @ limit: ${ethers.formatUnits(sanity, 6)} USDC`);
  } catch {}

  // 2) Find the router’s v4-swap opcode
  const op = await discoverV4SwapOpcode({
    poolKey, sqrtPriceLimitX96, amountIn, recipient: userWallet.address
  });

  // 3) Build router inputs & send execute
  const urInput = encodeUR_V4_SwapExactIn(poolKey, {
    zeroForOne: false,
    amountIn,
    sqrtPriceLimitX96,
    recipient: userWallet.address
  });

  const { iface } = await fetchRouter();
  const commands = "0x" + op.toString(16).padStart(2,"0");
  const calldata = iface.encodeFunctionData("execute", [commands, [urInput]]);

  const feeData = await provider.getFeeData();
  const tx = await userWallet.sendTransaction({
    to: V4_ROUTER_ADDRESS,
    data: calldata,
    gasLimit: 1_300_000,
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? ethers.parseUnits("1", "gwei"),
  });

  console.log(`⏳ Broadcasting… ${tx.hash}`);
  const rcpt = await tx.wait();
  console.log("✅ Confirmed:", rcpt.hash);
}


// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔎 ${POOL.label}`);
  console.log(`• Using manual poolId: ${POOL.poolId}`);

  const { sqrtPriceX96, tick, protocolFee, lpFee } = await getSlot0(POOL.poolId);
  console.log(`📈 Current sqrtPriceX96: ${sqrtPriceX96}`);
  console.log(`🧾 Fees (ppm): lpFee=${Number(lpFee)} protocolFee=${Number(protocolFee)}`);

  // small live test amount
  const amountToTrade = 0.00005;
  await executeSupplicationV4(amountToTrade);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

// Run: yarn hardhat run test/cbbtc_mass_test.js --network base