import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchMassivePrevClose } from '../../../../../lib/server/massiveStockQuotes';
import { STOCK_ASSET_BY_ID } from '../../../../../lib/assets/stockAssetRegistry';

const ASSET = STOCK_ASSET_BY_ID.nvidia;
let cachedPrice: number | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 60000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const currentTime = Date.now();

  if (cachedPrice != null && cacheTimestamp && currentTime - cacheTimestamp < CACHE_DURATION) {
    res.status(200).json({ nvidia: { usd: cachedPrice } });
    return;
  }

  try {
    const { price } = await fetchMassivePrevClose(ASSET.massiveTicker);
    cachedPrice = price;
    cacheTimestamp = currentTime;
    res.status(200).json({ nvidia: { usd: price } });
  } catch (error) {
    console.error('Error fetching NVIDIA price:', error);
    if (cachedPrice != null) {
      res.status(200).json({ nvidia: { usd: cachedPrice } });
      return;
    }
    res.status(500).json({ error: 'Error fetching NVIDIA price' });
  }
}
