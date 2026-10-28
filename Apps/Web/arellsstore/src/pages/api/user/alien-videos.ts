import type { NextApiRequest, NextApiResponse } from 'next';
import { assertUserEmailMatchesSession } from '../../../lib/auth/requireUserApi';
import {
  generateAlienMetaloopVideo,
  generateAlienSeasonOneLoopVideo,
} from '../../../lib/server/alienCompose';
import {
  alienComposedKey,
  alienMetaloopKey,
  alienSeasonOneKey,
  alienSeasonOneLoopKey,
  isMissingS3Object,
  normalizeAlienPhotoAsset,
} from '../../../lib/server/alienPhoto';
import { getServerS3 } from '../../../lib/server/awsS3';
import { s3BucketNameOrThrow } from '../../../lib/server/s3Bucket';

const s3 = getServerS3();

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: false,
  },
  // Vercel / Next — allow long Grok video polls (up to ~10 min).
  maxDuration: 800,
};

async function loadJpeg(bucket: string, key: string): Promise<Buffer> {
  const obj = await s3.getObject({ Bucket: bucket, Key: key }).promise();
  const body = obj.Body;
  if (!body) throw Object.assign(new Error('Missing image'), { code: 'NoSuchKey' });
  return Buffer.isBuffer(body) ? body : Buffer.from(body as ArrayBuffer);
}

async function deleteQuiet(bucket: string, key: string): Promise<void> {
  try {
    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
  } catch {
    /* missing is fine */
  }
}

function wantKind(raw: unknown, kind: 'metaloop' | 'seasononeloop'): boolean {
  if (raw == null) return true;
  if (!Array.isArray(raw)) return true;
  if (raw.length === 0) return true;
  return raw.map(String).map((s) => s.toLowerCase()).includes(kind);
}

/**
 * After image compose: delete old loop(s), generate 480p replacements, put to S3.
 * Prefer calling with kinds: ['seasononeloop'] then ['metaloop'] so Season One
 * is not starved by the longer metaloop job in one request.
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, asset: rawAsset, kinds: rawKinds } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Missing email' });
  }
  const allowed = await assertUserEmailMatchesSession(req, res, email);
  if (!allowed) return;

  const asset = normalizeAlienPhotoAsset(rawAsset);
  if (!asset) {
    return res.status(400).json({ error: 'Unsupported asset' });
  }

  const doMetaloop = wantKind(rawKinds, 'metaloop');
  const doSeason = wantKind(rawKinds, 'seasononeloop');
  const bucket = s3BucketNameOrThrow();

  try {
    let metaloopOk = false;
    let seasonOk = false;
    const errors: string[] = [];

    if (doSeason) {
      const key = alienSeasonOneLoopKey(allowed, asset);
      // Delete first so a failed regen cannot leave a stale face loop.
      await deleteQuiet(bucket, key);
      try {
        const seasonOneJpeg = await loadJpeg(bucket, alienSeasonOneKey(allowed, asset));
        const seasonLoop = await generateAlienSeasonOneLoopVideo(seasonOneJpeg);
        await s3
          .putObject({
            Bucket: bucket,
            Key: key,
            Body: seasonLoop,
            ContentType: 'video/mp4',
            ACL: 'private',
            Metadata: { replacedAt: String(Date.now()) },
          })
          .promise();
        seasonOk = true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'seasonone loop failed';
        console.error('alien-videos seasononeloop', err);
        errors.push(message);
      }
    }

    if (doMetaloop) {
      const key = alienMetaloopKey(allowed, asset);
      await deleteQuiet(bucket, key);
      try {
        const composedJpeg = await loadJpeg(bucket, alienComposedKey(allowed, asset));
        const metaloop = await generateAlienMetaloopVideo(composedJpeg);
        await s3
          .putObject({
            Bucket: bucket,
            Key: key,
            Body: metaloop,
            ContentType: 'video/mp4',
            ACL: 'private',
            Metadata: { replacedAt: String(Date.now()) },
          })
          .promise();
        metaloopOk = true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'metaloop failed';
        console.error('alien-videos metaloop', err);
        errors.push(message);
      }
    }

    if ((doMetaloop || doSeason) && !metaloopOk && !seasonOk) {
      return res.status(500).json({
        error: errors[0] || 'Video generation failed',
        metaloop: false,
        seasononeloop: false,
        errors,
      });
    }

    return res.status(200).json({
      ok: true,
      metaloop: doMetaloop ? metaloopOk : undefined,
      seasononeloop: doSeason ? seasonOk : undefined,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    if (isMissingS3Object(err)) {
      return res.status(404).json({ error: 'Compose images first' });
    }
    const message = err instanceof Error ? err.message : 'Video generation failed';
    console.error('alien-videos POST', err);
    return res.status(500).json({ error: message });
  }
};

export default handler;
