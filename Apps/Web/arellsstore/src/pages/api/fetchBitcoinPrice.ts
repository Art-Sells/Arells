import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Constants
const FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";
const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";
const BASE_RPC_URL = process.env.BASE_RPC_URL!;
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY!;

const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);

// 🧠 Cache Variables
let cachedPrice: number | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 60000; // 1 minute

async function fetchABI(address: string) {
  const response = await axios.get(`https://api.basescan.org/api?module=contract&action=getabi&address=${address}&apikey=${BASESCAN_API_KEY}`);
  if (response.data.status !== "1") throw new Error(`BaseScan API Error: ${response.data.message}`);
  return JSON.parse(response.data.result);
}

async function getPoolAddress() {
  const factoryABI = await fetchABI(FACTORY_ADDRESS);
  const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);
  const fee = 500; // 0.05% fee tier

  const poolAddress = await factory.getPool(USDC, CBBTC, fee);
  if (poolAddress === ethers.ZeroAddress) throw new Error('No pool found.');
  return poolAddress;
}

async function getCurrentPoolPrice(poolAddress: string): Promise<number> {
  const poolABI = await fetchABI(poolAddress);
  const pool = new ethers.Contract(poolAddress, poolABI, provider);
  const slot0 = await pool.slot0();
  const sqrtPriceX96 = BigInt(slot0[0]);

  const numerator = sqrtPriceX96 * sqrtPriceX96;
  const denominator = BigInt(2) ** BigInt(192);

  const rawPrice = Number(numerator) / Number(denominator);

  const usdcDecimals = 6;
  const cbbtcDecimals = 8;

  const adjustedPrice = (1 / rawPrice) * (10 ** (cbbtcDecimals - usdcDecimals)); // ✅ FINAL

  return adjustedPrice;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const currentTime = Date.now();

  if (cachedPrice && cacheTimestamp && (currentTime - cacheTimestamp < CACHE_DURATION)) {
    console.log(`🧠 Serving cached Bitcoin price: ${cachedPrice}`);
    return res.status(200).json({ 'coinbase-wrapped-btc': { usd: cachedPrice } });
  }

  try {
    const poolAddress = await getPoolAddress();
    const price = await getCurrentPoolPrice(poolAddress);

    cachedPrice = price;
    cacheTimestamp = currentTime;

    console.log(`📡 Fetched new Bitcoin price from Uniswap: ${price}`);

    res.status(200).json({ 'coinbase-wrapped-btc': { usd: price } });

  } catch (error: any) {
    console.error('Error fetching Uniswap Bitcoin price:', error.message);
    res.status(500).json({ error: 'Error fetching Uniswap Bitcoin price' });
  }
}