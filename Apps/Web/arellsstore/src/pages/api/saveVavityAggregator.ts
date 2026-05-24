import type { NextApiRequest, NextApiResponse } from 'next';
import { logApiRouteError, withOptionalApiDebug } from '../../lib/server/apiErrorDebug';
import { getServerS3 } from '../../lib/server/awsS3';
import { recalculateInvestmentsForAllAssets } from '../../lib/server/loadVapaAssetSnapshot';
import { s3BucketNameOrThrow } from '../../lib/server/s3Bucket';
import { buildValuationAggregatePayload } from '../../lib/vavity/portfolioValuation';

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

  const { sessionId, investments, asset: rawAsset, skipExpiry: rawSkipExpiry } = req.body;
  const asset = typeof rawAsset === 'string' && rawAsset.length ? rawAsset.toLowerCase() : 'bitcoin';
  const skipExpiry =
    typeof rawSkipExpiry === 'string'
      ? ['1', 'true', 'yes', 'on'].includes(rawSkipExpiry.toLowerCase())
      : Boolean(rawSkipExpiry);

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
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
        console.warn("⚠️ No existing data found for session:", sessionId);
        existingData = { investments: [] };
      } else {
        throw err;
      }
    }

    const existingInvestmentsRaw = Array.isArray(existingData.investments) ? existingData.investments : [];
    const incomingInvestmentsRaw = Array.isArray(investments) ? investments : existingInvestmentsRaw;
    const filteredExistingInvestments = existingInvestmentsRaw.filter((inv: any) => {
      const invAsset =
        typeof inv?.asset === 'string' && inv.asset.length ? inv.asset.toLowerCase() : 'bitcoin';
      return invAsset !== asset;
    });

    // Session TTL meta: start countdown when the session JSON is first created.
    // If the existing session is expired, rotate meta and treat this save as a fresh session.
    const now = Date.now();
    const existingCreatedAt = typeof existingData?.createdAt === 'number' ? existingData.createdAt : null;
    const existingExpiresAt = typeof existingData?.expiresAt === 'number' ? existingData.expiresAt : null;
    const expired = !skipExpiry && typeof existingExpiresAt === 'number' && Number.isFinite(existingExpiresAt) && now >= existingExpiresAt;
    const createdAt = expired ? now : existingCreatedAt ?? now;
    // Reset session TTL on every save (session-only behavior).
    const expiresAt = now + SESSION_TTL_MS;

    const mergedInvestments = [...filteredExistingInvestments, ...incomingInvestmentsRaw];
    const normalizedInvestments = await recalculateInvestmentsForAllAssets(
      mergedInvestments as Record<string, unknown>[]
    );
    const newData = {
      createdAt,
      expiresAt,
      ...buildValuationAggregatePayload(normalizedInvestments),
    };

    // Save the updated data back to S3
    await s3
      .putObject({
        Bucket: s3BucketNameOrThrow(),
        Key: key,
        Body: JSON.stringify(newData),
        ContentType: 'application/json',
        ACL: 'private',
      })
      .promise();

    return res.status(200).json({ message: 'Data saved successfully', data: newData });
  } catch (error: unknown) {
    logApiRouteError('saveVavityAggregator', error);
    return res.status(500).json(withOptionalApiDebug({ error: 'Internal Server Error' }, error));
  }
};

export default handler;
