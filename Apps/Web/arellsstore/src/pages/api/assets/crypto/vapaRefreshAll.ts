import type { NextApiRequest, NextApiResponse } from 'next';
import { logApiRouteError, withOptionalApiDebug } from '../../../../lib/server/apiErrorDebug';
import { refreshVapa, VapaAssetConfig } from './_vapaService';

const assets: VapaAssetConfig[] = [
  {
    id: 'bitcoin',
    s3Key: 'vavity/bitcoinVAPA.json',
    priceUrl: 'https://pro-api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_market_cap=true',
    historyUrl: 'https://pro-api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=max',
  },
  {
    id: 'ethereum',
    s3Key: 'vavity/ethereumVAPA.json',
    priceUrl: 'https://pro-api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_market_cap=true',
    historyUrl: 'https://pro-api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=max',
  },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const results: Record<string, any> = {};
    for (const asset of assets) {
      results[asset.id] = await refreshVapa(asset);
    }
    return res.status(200).json(results);
  } catch (error: unknown) {
    logApiRouteError('vapaRefreshAll', error);
    return res
      .status(500)
      .json(withOptionalApiDebug({ error: 'Failed to refresh assets' }, error));
  }
}
