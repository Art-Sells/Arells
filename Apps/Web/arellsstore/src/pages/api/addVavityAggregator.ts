import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerS3 } from '../../lib/server/awsS3';
import { loadCurrentAssetSpotPrice } from '../../lib/server/assetSpotPrice';
import {
  loadVapaAssetSnapshot,
  recalculateInvestmentsForAllAssets,
} from '../../lib/server/loadVapaAssetSnapshot';
import { s3BucketNameOrThrow } from '../../lib/server/s3Bucket';
import {
  applyRecalculatedFields,
  buildValuationAggregatePayload,
} from '../../lib/vavity/portfolioValuation';

const s3 = getServerS3();
const SESSION_TTL_MS = (() => {
  const raw = process.env.VAPAGG_SESSION_TTL_MS;
  if (raw) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  // Default to 1 minute unless explicitly overridden.
  return 60_000;
})();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, newInvestments, asset: rawAsset, skipExpiry: rawSkipExpiry } = req.body;
  const asset = typeof rawAsset === 'string' && rawAsset.length ? rawAsset.toLowerCase() : 'bitcoin';
  const skipExpiry =
    typeof rawSkipExpiry === 'string'
      ? ['1', 'true', 'yes', 'on'].includes(rawSkipExpiry.toLowerCase())
      : Boolean(rawSkipExpiry);

  if (!sessionId || !Array.isArray(newInvestments) || newInvestments.length === 0) {
    console.error("Invalid request data:", { sessionId, newInvestments });
    return res.status(400).json({ error: 'Invalid request: Missing sessionId or newInvestments' });
  }

  try {
    const key = `sessions/${sessionId}/VavityAggregate.json`;

    // Fetch existing data from S3
    let existingData: any = {};
    try {
      const data = await s3.getObject({ Bucket: s3BucketNameOrThrow(), Key: key }).promise();
      existingData = JSON.parse(data.Body!.toString());
    } catch (err: any) {
      if (err.code === 'NoSuchKey') {
        console.warn("No existing data found for session:", sessionId);
      } else {
        throw err;
      }
    }

    const existingInvestmentsRaw = Array.isArray(existingData.investments) ? existingData.investments : [];

    // Session TTL meta: start countdown when the session JSON is first created.
    // If the existing session is expired, rotate meta and treat this add as a fresh session (old session investments are dropped).
    const now = Date.now();
    const existingCreatedAt = typeof existingData?.createdAt === 'number' ? existingData.createdAt : null;
    const existingExpiresAt = typeof existingData?.expiresAt === 'number' ? existingData.expiresAt : null;
    const expired = !skipExpiry && typeof existingExpiresAt === 'number' && Number.isFinite(existingExpiresAt) && now >= existingExpiresAt;
    const createdAt = expired ? now : existingCreatedAt ?? now;
    // Reset session TTL on every add (session-only behavior).
    const expiresAt = now + SESSION_TTL_MS;

    const [snapshot, currentLiquid] = await Promise.all([
      loadVapaAssetSnapshot(asset),
      loadCurrentAssetSpotPrice(asset),
    ]);
    const existingInvestments = expired ? [] : existingInvestmentsRaw;
    const normalizedNewInvestments = newInvestments.map((inv: Record<string, unknown>) =>
      applyRecalculatedFields(inv, snapshot, asset, currentLiquid)
    );
    const merged = [...existingInvestments, ...normalizedNewInvestments];
    const updatedInvestments = await recalculateInvestmentsForAllAssets(merged as Record<string, unknown>[]);
    const newData = {
      createdAt,
      expiresAt,
      ...buildValuationAggregatePayload(updatedInvestments),
    };

    await s3
      .putObject({
        Bucket: s3BucketNameOrThrow(),
        Key: key,
        Body: JSON.stringify(newData),
        ContentType: 'application/json',
        ACL: 'private',
      })
      .promise();

    return res.status(200).json({ 
      message: 'New groups added successfully', 
      data: newData 
    });
  } catch (error) {
    console.error('Error during processing:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;

