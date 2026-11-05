import type { NextApiRequest, NextApiResponse } from 'next';
import { assertUserEmailMatchesSession } from '../../../lib/auth/requireUserApi';
import { getSessionFromRequest } from '../../../lib/auth/session';
import {
  ALIEN_PHOTO_MAX_BYTES,
  alienPhotoFallbackKey,
  alienPhotoObjectKey,
  decodeAlienPhotoDataUrl,
  isAlienVideoKind,
  isMissingS3Object,
  normalizeAlienPhotoAsset,
  normalizeAlienPhotoKind,
  sniffAlienPhotoMime,
} from '../../../lib/server/alienPhoto';
import {
  getServerS3,
  getServerS3SignedGetUrl,
  getServerS3SignedPutUrl,
} from '../../../lib/server/awsS3';
import { s3BucketNameOrThrow } from '../../../lib/server/s3Bucket';
import { normalizeEmailKey } from '../../../lib/auth/normalize';

const s3 = getServerS3();

export const config = {
  api: {
    bodyParser: {
      /* Amplify itself still caps ~1MB — keep chunks small; this is for local/dev. */
      sizeLimit: '2mb',
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

function uploadChunkKey(email: string, asset: string, uploadId: string, index: number): string {
  return `users/${normalizeEmailKey(email)}/aliens/${asset}.upload.${uploadId}.${index}`;
}

function isSafeUploadId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const id = raw.trim();
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(id)) return null;
  return id;
}

async function putSelfieBuffer(
  email: string,
  asset: string,
  buf: Buffer
): Promise<{ ok: true } | { error: string; status: number }> {
  if (!buf.length) return { error: 'Missing image', status: 400 };
  if (buf.length > ALIEN_PHOTO_MAX_BYTES) return { error: 'Image too large', status: 413 };
  const mime = sniffAlienPhotoMime(buf);
  if (!mime) return { error: 'Image must be jpeg, png, or webp', status: 400 };
  await s3
    .putObject({
      Bucket: s3BucketNameOrThrow(),
      Key: alienPhotoObjectKey(email, asset, 'selfie'),
      Body: buf,
      ContentType: mime,
      ACL: 'private',
    })
    .promise();
  return { ok: true };
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
    const rawKind = Array.isArray(req.query.kind) ? req.query.kind[0] : req.query.kind;
    const kind = normalizeAlienPhotoKind(rawKind);
    let key = alienPhotoObjectKey(email, asset, kind);
    const fallbackObjectKey = alienPhotoFallbackKey(email, asset, kind);
    const isVideo = isAlienVideoKind(kind);
    const fallbackType = isVideo ? 'video/mp4' : 'application/octet-stream';
    try {
      let head;
      try {
        head = await s3.headObject({ Bucket: s3BucketNameOrThrow(), Key: key }).promise();
      } catch (err) {
        if (!fallbackObjectKey || !isMissingS3Object(err)) throw err;
        key = fallbackObjectKey;
        head = await s3.headObject({ Bucket: s3BucketNameOrThrow(), Key: key }).promise();
      }
      const type =
        head.ContentType && head.ContentType !== 'application/octet-stream'
          ? head.ContentType
          : fallbackType;
      res.setHeader('X-Alien-Photo-Kind', kind);
      if (req.method === 'HEAD') {
        res.setHeader('Content-Type', type);
        res.setHeader('Cache-Control', 'private, no-store');
        if (isVideo) res.setHeader('Accept-Ranges', 'bytes');
        return res.status(200).end();
      }
      // Videos: redirect to S3 — Amplify compute cannot proxy large MP4 bodies.
      if (isVideo) {
        const signed = getServerS3SignedGetUrl({
          key,
          expiresSec: 3600,
          responseContentType: type,
        });
        res.setHeader('Cache-Control', 'private, no-store');
        res.redirect(302, signed);
        return;
      }
      const obj = await s3.getObject({ Bucket: s3BucketNameOrThrow(), Key: key }).promise();
      res.setHeader('Content-Type', type);
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

  const body = req.body || {};
  const { email, asset: rawAsset } = body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Missing email' });
  }
  const allowed = await assertUserEmailMatchesSession(req, res, email);
  if (!allowed) return;

  const asset = normalizeAlienPhotoAsset(rawAsset);
  if (!asset) {
    return res.status(400).json({ error: 'Unsupported asset' });
  }

  const action =
    typeof body.action === 'string' ? body.action.trim().toLowerCase() : 'put';

  try {
    /* Tiny JSON — returns S3 PUT URL so the phone never posts the image through Amplify. */
    if (action === 'presign') {
      const contentType = 'image/jpeg';
      const key = alienPhotoObjectKey(allowed, asset, 'selfie');
      const uploadUrl = getServerS3SignedPutUrl({
        key,
        contentType,
        expiresSec: 600,
      });
      return res.status(200).json({ ok: true, uploadUrl, contentType, key });
    }

    if (action === 'begin') {
      const uploadId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      return res.status(200).json({ ok: true, uploadId });
    }

    if (action === 'chunk') {
      const uploadId = isSafeUploadId(body.uploadId);
      const index = Number(body.index);
      if (!uploadId || !Number.isInteger(index) || index < 0 || index > 40) {
        return res.status(400).json({ error: 'Invalid upload chunk' });
      }
      const raw = typeof body.data === 'string' ? body.data : '';
      if (!raw || raw.length > 700_000) {
        return res.status(400).json({ error: 'Chunk too large' });
      }
      let buf: Buffer;
      try {
        buf = Buffer.from(raw, 'base64');
      } catch {
        return res.status(400).json({ error: 'Invalid chunk' });
      }
      if (!buf.length || buf.length > 550_000) {
        return res.status(400).json({ error: 'Chunk too large' });
      }
      await s3
        .putObject({
          Bucket: s3BucketNameOrThrow(),
          Key: uploadChunkKey(allowed, asset, uploadId, index),
          Body: buf,
          ContentType: 'application/octet-stream',
        })
        .promise();
      return res.status(200).json({ ok: true });
    }

    if (action === 'commit') {
      const uploadId = isSafeUploadId(body.uploadId);
      const parts = Number(body.parts);
      if (!uploadId || !Number.isInteger(parts) || parts < 1 || parts > 40) {
        return res.status(400).json({ error: 'Invalid upload' });
      }
      const bucket = s3BucketNameOrThrow();
      const chunks: Buffer[] = [];
      for (let i = 0; i < parts; i++) {
        try {
          const obj = await s3
            .getObject({ Bucket: bucket, Key: uploadChunkKey(allowed, asset, uploadId, i) })
            .promise();
          const bodyBuf = obj.Body;
          if (!bodyBuf) throw new Error('missing');
          chunks.push(Buffer.isBuffer(bodyBuf) ? bodyBuf : Buffer.from(bodyBuf as ArrayBuffer));
        } catch {
          return res.status(400).json({ error: `Missing upload chunk ${i}` });
        }
      }
      const buf = Buffer.concat(chunks);
      const put = await putSelfieBuffer(allowed, asset, buf);
      for (let i = 0; i < parts; i++) {
        try {
          await s3
            .deleteObject({ Bucket: bucket, Key: uploadChunkKey(allowed, asset, uploadId, i) })
            .promise();
        } catch {
          /* ignore */
        }
      }
      if (!('ok' in put)) {
        return res.status(put.status).json({ error: put.error });
      }
      return res.status(200).json({ ok: true });
    }

    /* Legacy single-shot data URL (must stay under Amplify ~1MB body). */
    const buf = decodeAlienPhotoDataUrl(body.data);
    if (!buf) {
      return res.status(400).json({ error: 'Missing image' });
    }
    const put = await putSelfieBuffer(allowed, asset, buf);
    if (!('ok' in put)) {
      return res.status(put.status).json({ error: put.error });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('alien-photo POST', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({
      error: message.includes('S3') || message.includes('bucket') || message.includes('credentials')
        ? `Photo upload failed — ${message}`
        : `Photo upload failed — ${message.slice(0, 200)}`,
    });
  }
};

export default handler;
