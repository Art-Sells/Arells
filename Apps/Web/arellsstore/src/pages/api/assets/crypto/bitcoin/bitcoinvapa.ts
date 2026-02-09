import type { NextApiRequest, NextApiResponse } from 'next';
import { refreshVapa } from '../_vapaService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const result = await refreshVapa({
      id: 'bitcoin',
      s3Key: 'vavity/bitcoinVAPA.json',
      priceUrl: 'https://pro-api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      historyUrl: 'https://pro-api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=max',
    });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[bitcoinvapa] failed', error);
    return res.status(500).json({ error: 'Failed to fetch bitcoin VAPA' });
  }
}
