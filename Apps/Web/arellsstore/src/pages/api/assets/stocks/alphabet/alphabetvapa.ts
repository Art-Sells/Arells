import type { NextApiRequest, NextApiResponse } from 'next';
import { logApiRouteError, withOptionalApiDebug } from '../../../../../lib/server/apiErrorDebug';
import { STOCK_ASSET_BY_ID } from '../../../../../lib/assets/stockAssetRegistry';
import { refreshStockVapa } from '../../../../../lib/server/stockVapaService';

const ASSET = STOCK_ASSET_BY_ID.alphabet;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const result = await refreshStockVapa({
      id: ASSET.id,
      massiveTicker: ASSET.massiveTicker,
      s3Key: ASSET.s3VapaKey,
      listDate: ASSET.listDate ?? null,
    });
    return res.status(200).json(result);
  } catch (error: unknown) {
    logApiRouteError('alphabetvapa', error);
    const message =
      error instanceof Error && error.message ? error.message : 'Failed to fetch alphabet VAPA';
    return res.status(500).json(withOptionalApiDebug({ error: message }, error));
  }
}
