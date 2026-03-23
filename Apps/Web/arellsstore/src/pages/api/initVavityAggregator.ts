import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const SESSION_TTL_MS = (() => {
  const raw = process.env.VAPAGG_SESSION_TTL_MS;
  if (raw) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 60_000;
})();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rawSessionId = req.query.sessionId;
  const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;
  const rawSkipExpiry = req.query.skipExpiry;
  const skipExpiryParam = Array.isArray(rawSkipExpiry) ? rawSkipExpiry[0] : rawSkipExpiry;
  const skipExpiry =
    typeof skipExpiryParam === 'string'
      ? ['1', 'true', 'yes', 'on'].includes(skipExpiryParam.toLowerCase())
      : Boolean(skipExpiryParam);

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId query parameter is required' });
  }

  const key = `sessions/${sessionId}/VavityAggregate.json`;
  const now = Date.now();

  try {
    const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
    const existing = data.Body ? JSON.parse(data.Body.toString()) : {};
    const createdAt = typeof existing?.createdAt === 'number' ? existing.createdAt : now;
    const expiresAt = typeof existing?.expiresAt === 'number' ? existing.expiresAt : createdAt + SESSION_TTL_MS;
    const expired =
      typeof expiresAt === 'number' && Number.isFinite(expiresAt) && expiresAt <= now && !skipExpiry;
    if (expired) {
      try {
        await s3.deleteObject({ Bucket: BUCKET_NAME, Key: key }).promise();
      } catch {
        // ignore delete errors
      }
      throw { code: 'NoSuchKey' };
    }
    return res.status(200).json({ exists: true, createdAt, expiresAt });
  } catch (error: any) {
    if (error?.code !== 'NoSuchKey' && error?.statusCode !== 404) {
      const errorMessage = error?.message || 'Could not initialize session';
      console.error('Error initializing session:', errorMessage);
      return res.status(500).json({ error: errorMessage });
    }
  }

  const createdAt = now;
  const expiresAt = now + SESSION_TTL_MS;
  const newData = {
    createdAt,
    expiresAt,
    investments: [],
    totals: { acVatop: 0, acVact: 0, acdVatop: 0, acVactTaa: 0 },
    totalsLiquid: { acVatop: 0, acVact: 0, acdVatop: 0, acVactTaa: 0 },
  };

  try {
    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(newData),
        ContentType: 'application/json',
        ACL: 'private',
      })
      .promise();
  } catch (error: any) {
    const errorMessage = error?.message || 'Could not initialize session';
    console.error('Error initializing session:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }

  return res.status(200).json({ created: true, createdAt, expiresAt });
};

export default handler;
