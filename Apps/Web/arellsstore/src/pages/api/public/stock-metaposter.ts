import type { NextApiRequest, NextApiResponse } from 'next';
import { METAPOSTER_CACHE_CONTROL } from '../../../lib/assets/assetSharePath';
import { isMissingS3Object } from '../../../lib/server/alienPhoto';
import { getServerS3 } from '../../../lib/server/awsS3';
import { s3BucketNameOrThrow } from '../../../lib/server/s3Bucket';

const STOCK_KEYS = {
  guest: 'marketing/assets/crypto/bitcoin/SignedIn/season1/posters/LaunchPoster(guest).jpg',
  metaposter: 'marketing/assets/crypto/bitcoin/SignedIn/season1/posters/LaunchPoster(metaposter).jpg',
} as const;

const s3 = getServerS3();

/** Stock launch metaposters. Same 5-second cache as personal composed posters. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const raw = Array.isArray(req.query.file) ? req.query.file[0] : req.query.file;
  const file = raw === 'guest' || raw === 'metaposter' ? raw : null;
  if (!file) {
    return res.status(400).json({ error: 'Unsupported file' });
  }

  try {
    if (req.method === 'HEAD') {
      const head = await s3
        .headObject({ Bucket: s3BucketNameOrThrow(), Key: STOCK_KEYS[file] })
        .promise();
      res.setHeader('Content-Type', head.ContentType || 'image/jpeg');
      res.setHeader('Cache-Control', METAPOSTER_CACHE_CONTROL);
      return res.status(200).end();
    }
    const obj = await s3
      .getObject({ Bucket: s3BucketNameOrThrow(), Key: STOCK_KEYS[file] })
      .promise();
    res.setHeader('Content-Type', obj.ContentType || 'image/jpeg');
    res.setHeader('Cache-Control', METAPOSTER_CACHE_CONTROL);
    return res.status(200).send(obj.Body);
  } catch (err) {
    if (isMissingS3Object(err)) {
      return res.status(404).json({ error: 'Not found' });
    }
    console.error('stock-metaposter', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
