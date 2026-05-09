import type { NextApiRequest, NextApiResponse } from 'next';
import { logApiRouteError, withOptionalApiDebug } from '../../../../../lib/server/apiErrorDebug';
import { refreshVapa } from '../_vapaService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const result = await refreshVapa({
      id: 'bnb',
      coingeckoId: 'binancecoin',
      s3Key: 'vavity/bnbVAPA.json',
      priceUrl:
        'https://pro-api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd&include_market_cap=true',
      historyUrl: 'https://pro-api.coingecko.com/api/v3/coins/binancecoin/market_chart?vs_currency=usd&days=max',
    });
    return res.status(200).json(result);
  } catch (error: unknown) {
    logApiRouteError('bnbvapa', error);
    const message =
      error instanceof Error && error.message ? error.message : 'Failed to fetch bnb VAPA';
    return res.status(500).json(withOptionalApiDebug({ error: message }, error));
  }
}
