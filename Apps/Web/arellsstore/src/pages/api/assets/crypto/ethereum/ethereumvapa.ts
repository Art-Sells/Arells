import type { NextApiRequest, NextApiResponse } from 'next';
import { refreshVapa } from '../_vapaService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const result = await refreshVapa({
      id: 'ethereum',
      s3Key: 'vavity/ethereumVAPA.json',
      priceUrl: 'https://pro-api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      historyUrl: 'https://pro-api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=max',
    });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[ethereumvapa] failed', error);
    return res.status(500).json({ error: 'Failed to fetch ethereum VAPA' });
  }
}
