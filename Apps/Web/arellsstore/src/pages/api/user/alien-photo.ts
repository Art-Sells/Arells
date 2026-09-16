import type { NextApiRequest, NextApiResponse } from 'next';
import { assertUserEmailMatchesSession } from '../../../lib/auth/requireUserApi';
import { getSessionFromRequest } from '../../../lib/auth/session';
import {
  ALIEN_PHOTO_MAX_BYTES,
  alienPhotoKey,
  decodeAlienPhotoDataUrl,
  isMissingS3Object,
  normalizeAlienPhotoAsset,
  sniffAlienPhotoMime,
} from '../../../lib/server/alienPhoto';
import { getServerS3 } from '../../../lib/server/awsS3';
import { s3BucketNameOrThrow } from '../../../lib/server/s3Bucket';

const s3 = getServerS3();

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '7mb',
    },
  },
};

async function sessionEmail(req: NextApiRequest, res: NextApiResponse): Promise<string | null> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return session.email;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    const email = await sessionEmail(req, res);
    if (!email) return;
    const rawAsset = Array.isArray(req.query.asset) ? req.query.asset[0] : req.query.asset;
    const asset = normalizeAlienPhotoAsset(rawAsset) || (rawAsset ? null : 'bitcoin');
    if (!asset) {
      return res.status(400).json({ error: 'Unsupported asset' });
    }
    const key = alienPhotoKey(email, asset);
    try {
      if (req.method === 'HEAD') {
        const head = await s3.headObject({ Bucket: s3BucketNameOrThrow(), Key: key }).promise();
        res.setHeader('Content-Type', head.ContentType || 'application/octet-stream');
        res.setHeader('Cache-Control', 'private, no-store');
        return res.status(200).end();
      }
      const obj = await s3.getObject({ Bucket: s3BucketNameOrThrow(), Key: key }).promise();
      res.setHeader('Content-Type', obj.ContentType || 'application/octet-stream');
      res.setHeader('Cache-Control', 'private, no-store');
      return res.status(200).send(obj.Body);
    } catch (err) {
      if (isMissingS3Object(err)) {
        return res.status(404).json({ error: 'Not found' });
      }
      console.error('alien-photo GET', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, asset: rawAsset, data } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Missing email' });
  }
  const allowed = await assertUserEmailMatchesSession(req, res, email);
  if (!allowed) return;

  const asset = normalizeAlienPhotoAsset(rawAsset);
  if (!asset) {
    return res.status(400).json({ error: 'Unsupported asset' });
  }

  const buf = decodeAlienPhotoDataUrl(data);
  if (!buf) {
    return res.status(400).json({ error: 'Missing image' });
  }
  if (buf.length > ALIEN_PHOTO_MAX_BYTES) {
    return res.status(413).json({ error: 'Image too large' });
  }
  const mime = sniffAlienPhotoMime(buf);
  if (!mime) {
    return res.status(400).json({ error: 'Image must be jpeg, png, or webp' });
  }

  try {
    await s3
      .putObject({
        Bucket: s3BucketNameOrThrow(),
        Key: alienPhotoKey(allowed, asset),
        Body: buf,
        ContentType: mime,
        ACL: 'private',
      })
      .promise();
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('alien-photo POST', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
