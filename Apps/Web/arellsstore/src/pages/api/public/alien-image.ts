import type { NextApiRequest, NextApiResponse } from 'next';
import { resolveReferrerEmailFromCode } from '../../../lib/auth/referral';
import {
  alienPhotoObjectKey,
  isMissingS3Object,
  normalizeAlienPhotoAsset,
  normalizeAlienPhotoKind,
} from '../../../lib/server/alienPhoto';
import { getServerS3 } from '../../../lib/server/awsS3';
import { s3BucketNameOrThrow } from '../../../lib/server/s3Bucket';

const s3 = getServerS3();

/**
 * Public composed alien images for OG / share pages.
 * Query: shareId (referral code), asset, kind=composed|seasonone|portrait
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawShare = Array.isArray(req.query.shareId) ? req.query.shareId[0] : req.query.shareId;
  const shareId = typeof rawShare === 'string' ? rawShare.trim().toLowerCase() : '';
  if (!shareId || shareId.length > 64) {
    return res.status(400).json({ error: 'Missing shareId' });
  }

  const rawAsset = Array.isArray(req.query.asset) ? req.query.asset[0] : req.query.asset;
  const asset = normalizeAlienPhotoAsset(rawAsset) || (rawAsset ? null : 'bitcoin');
  if (!asset) {
    return res.status(400).json({ error: 'Unsupported asset' });
  }

  const rawKind = Array.isArray(req.query.kind) ? req.query.kind[0] : req.query.kind;
  const kind = normalizeAlienPhotoKind(rawKind);
  if (kind === 'selfie') {
    return res.status(400).json({ error: 'Unsupported kind' });
  }

  const email = await resolveReferrerEmailFromCode(shareId);
  if (!email) {
    return res.status(404).json({ error: 'Not found' });
  }

  const key = alienPhotoObjectKey(email, asset, kind);
  try {
    if (req.method === 'HEAD') {
      const head = await s3.headObject({ Bucket: s3BucketNameOrThrow(), Key: key }).promise();
      res.setHeader('Content-Type', head.ContentType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
      return res.status(200).end();
    }
    const obj = await s3.getObject({ Bucket: s3BucketNameOrThrow(), Key: key }).promise();
    res.setHeader('Content-Type', obj.ContentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    return res.status(200).send(obj.Body);
  } catch (err) {
    if (isMissingS3Object(err)) {
      return res.status(404).json({ error: 'Not found' });
    }
    console.error('public alien-image', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
