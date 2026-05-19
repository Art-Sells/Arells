import type { NextApiRequest, NextApiResponse } from 'next';
import { logApiRouteError, withOptionalApiDebug } from '../../../../lib/server/apiErrorDebug';
import { getVapaRefreshConfigs } from '../../../../lib/assets/cryptoAssetRegistry';
import { refreshVapa } from './_vapaService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const results: Record<string, any> = {};
    for (const asset of getVapaRefreshConfigs()) {
      results[asset.id] = await refreshVapa(asset);
    }
    return res.status(200).json(results);
  } catch (error: unknown) {
    logApiRouteError('vapaRefreshAll', error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Failed to refresh assets';
    return res.status(500).json(withOptionalApiDebug({ error: message }, error));
  }
}
