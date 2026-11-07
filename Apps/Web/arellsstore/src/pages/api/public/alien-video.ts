import type { NextApiRequest, NextApiResponse } from 'next';
import { resolveReferrerEmailFromCode } from '../../../lib/auth/referral';
import {
  alienPhotoObjectKey,
  isAlienVideoKind,
  isMissingS3Object,
  normalizeAlienPhotoAsset,
  normalizeAlienPhotoKind,
} from '../../../lib/server/alienPhoto';
import { getServerS3, getServerS3SignedGetUrl } from '../../../lib/server/awsS3';
import { s3BucketNameOrThrow } from '../../../lib/server/s3Bucket';

const s3 = getServerS3();

/**
 * Public personalized alien videos for shared /bitcoin/{shareId} guest.
 * Query: shareId, asset, kind=metaloop|seasononeloop|guestloop
 *
 * GET redirects to a short-lived S3 URL — Amplify compute cannot proxy large MP4s.
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
  if (!isAlienVideoKind(kind)) {
    return res.status(400).json({ error: 'Unsupported kind' });
  }

  const email = await resolveReferrerEmailFromCode(shareId);
  if (!email) {
    return res.status(404).json({ error: 'Not found' });
  }

  const key = alienPhotoObjectKey(email, asset, kind);
  try {
    const head = await s3.headObject({ Bucket: s3BucketNameOrThrow(), Key: key }).promise();
    const contentType = head.ContentType || 'video/mp4';
    const etag = (head.ETag || '').replace(/"/g, '');
    const versionId = head.VersionId || null;
    if (etag) res.setHeader('ETag', `"${etag}"`);
    if (versionId) res.setHeader('X-Alien-Video-Version', versionId);
    if (head.LastModified) {
      res.setHeader('Last-Modified', new Date(head.LastModified).toUTCString());
    }
    // Amplify CDN + browsers both stick to old MP4s if these are missing.
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('CDN-Cache-Control', 'no-store');
    if (req.method === 'HEAD') {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      return res.status(200).end();
    }
    const signed = getServerS3SignedGetUrl({
      key,
      expiresSec: 3600,
      responseContentType: contentType,
      versionId,
      responseCacheControl: 'no-store, max-age=0',
    });
    res.redirect(302, signed);
    return;
  } catch (err) {
    if (isMissingS3Object(err)) {
      return res.status(404).json({ error: 'Not found' });
    }
    console.error('public alien-video', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
