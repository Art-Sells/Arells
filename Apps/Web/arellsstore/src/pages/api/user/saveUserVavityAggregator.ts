import type { NextApiRequest, NextApiResponse } from 'next';
import { assertUserEmailMatchesSession } from '../../../lib/auth/requireUserApi';
import { getServerS3 } from '../../../lib/server/awsS3';
import {
  loadVapaAssetSnapshot,
  recalculateInvestmentsForAllAssets,
} from '../../../lib/server/loadVapaAssetSnapshot';
import { s3BucketNameOrThrow } from '../../../lib/server/s3Bucket';
import { buildValuationAggregatePayload } from '../../../lib/vavity/portfolioValuation';

const s3 = getServerS3();

const normalizeEmailKey = (raw: string) => encodeURIComponent(raw.trim().toLowerCase());

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, investments, asset: rawAsset } = req.body;
  const asset = typeof rawAsset === 'string' && rawAsset.length ? rawAsset.toLowerCase() : 'bitcoin';

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Missing email' });
  }

  const allowed = await assertUserEmailMatchesSession(req, res, email);
  if (!allowed) return;

  try {
    const key = `users/${normalizeEmailKey(email)}/VavityAggregate.json`;

    let existingData: { investments?: unknown[] } = {};
    try {
      const data = await s3.getObject({ Bucket: s3BucketNameOrThrow(), Key: key }).promise();
      existingData = JSON.parse(data.Body!.toString());
    } catch (err: any) {
      if (err.code === 'NoSuchKey') {
        existingData = { investments: [] };
      } else {
        throw err;
      }
    }

    const existingInvestmentsRaw = Array.isArray(existingData.investments) ? existingData.investments : [];
    const incomingInvestmentsRaw = Array.isArray(investments) ? investments : existingInvestmentsRaw;

    await loadVapaAssetSnapshot(asset);
    const normalizedInvestments = await recalculateInvestmentsForAllAssets(
      incomingInvestmentsRaw as Record<string, unknown>[]
    );

    const newData = buildValuationAggregatePayload(normalizedInvestments);

    await s3
      .putObject({
        Bucket: s3BucketNameOrThrow(),
        Key: key,
        Body: JSON.stringify(newData),
        ContentType: 'application/json',
        ACL: 'private',
      })
      .promise();

    return res.status(200).json({ message: 'User data saved successfully', data: newData });
  } catch (error) {
    console.error('❌ Error during user save processing:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
