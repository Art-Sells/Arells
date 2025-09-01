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












//to test run: yarn hardhat run **insert-file-route-here** --network base