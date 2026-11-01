import type { NextApiRequest, NextApiResponse } from 'next';
import { assertUserEmailMatchesSession } from '../../../lib/auth/requireUserApi';
import {
  ALIEN_COMPOSE_BASE_REL,
  ALIEN_COMPOSE_IRIS_REL,
  ALIEN_PORTRAIT_COLOR_REL,
  ALIEN_SEASONONE_BASE_REL,
  composePersonalBitcoinAlien,
  composePersonalBitcoinAlienPortrait,
  composePersonalBitcoinAlienSeasonOne,
  readAlienComposeRef,
} from '../../../lib/server/alienCompose';
import {
  alienComposedKey,
  alienPhotoKey,
  alienPortraitKey,
  alienSeasonOneKey,
  isMissingS3Object,
  normalizeAlienPhotoAsset,
  sniffAlienPhotoMime,
} from '../../../lib/server/alienPhoto';
import { getServerS3 } from '../../../lib/server/awsS3';
import {
  consumePaidCredit,
  findPaidUnusedCredit,
} from '../../../lib/server/characterGenerationCredit';
import { s3BucketNameOrThrow } from '../../../lib/server/s3Bucket';

const s3 = getServerS3();

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

async function loadSelfie(bucket: string, email: string, asset: string): Promise<Buffer> {
  const selfieObj = await s3.getObject({ Bucket: bucket, Key: alienPhotoKey(email, asset) }).promise();
  const selfieBody = selfieObj.Body;
  if (!selfieBody) {
    throw Object.assign(new Error('Upload a face photo first'), { code: 'NoSuchKey' });
  }
  const selfieBuf = Buffer.isBuffer(selfieBody)
    ? selfieBody
    : Buffer.from(selfieBody as ArrayBuffer);
  if (!sniffAlienPhotoMime(selfieBuf)) {
    throw new Error('Stored selfie must be jpeg, png, or webp');
  }
  return selfieBuf;
}

type ComposeMode = 'meta' | 'seasonone' | 'portrait' | 'full';

function normalizeMode(raw: unknown): ComposeMode {
  if (raw === 'meta' || raw === 'seasonone' || raw === 'portrait' || raw === 'full') {
    return raw;
  }
  return 'full';
}

/**
 * Amplify API routes die around ~30s. Run one Grok still per request:
 *   mode: 'meta' | 'seasonone' | 'portrait'
 * Legacy mode: 'full' still does all three (local/dev only — too slow for Amplify).
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, asset: rawAsset, mode: rawMode } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Missing email' });
  }
  const allowed = await assertUserEmailMatchesSession(req, res, email);
  if (!allowed) return;

  const asset = normalizeAlienPhotoAsset(rawAsset);
  if (!asset) {
    return res.status(400).json({ error: 'Unsupported asset' });
  }

  const mode = normalizeMode(rawMode);
  const bucket = s3BucketNameOrThrow();

  try {
    const credit = await findPaidUnusedCredit(allowed, asset);
    if (!credit) {
      return res.status(402).json({
        error: 'Character generation payment required',
        code: 'payment_required',
      });
    }

    const selfieBuf = await loadSelfie(bucket, allowed, asset);

    if (mode === 'meta' || mode === 'full') {
      const [iris, metaBase] = await Promise.all([
        readAlienComposeRef(ALIEN_COMPOSE_IRIS_REL),
        readAlienComposeRef(ALIEN_COMPOSE_BASE_REL),
      ]);
      const composed = await composePersonalBitcoinAlien({
        selfie: selfieBuf,
        selfieMime: 'image/jpeg',
        base: metaBase.buffer,
        baseMime: metaBase.mime,
        iris: iris.buffer,
        irisMime: iris.mime,
      });
      await s3
        .putObject({
          Bucket: bucket,
          Key: alienComposedKey(allowed, asset),
          Body: composed,
          ContentType: 'image/jpeg',
          ACL: 'private',
        })
        .promise();
      if (mode === 'meta') {
        return res.status(200).json({ ok: true, mode });
      }
    }

    if (mode === 'seasonone' || mode === 'full') {
      const [iris, seasonBase] = await Promise.all([
        readAlienComposeRef(ALIEN_COMPOSE_IRIS_REL),
        readAlienComposeRef(ALIEN_SEASONONE_BASE_REL),
      ]);
      const seasonOne = await composePersonalBitcoinAlienSeasonOne({
        selfie: selfieBuf,
        base: seasonBase.buffer,
        iris: iris.buffer,
      });
      await s3
        .putObject({
          Bucket: bucket,
          Key: alienSeasonOneKey(allowed, asset),
          Body: seasonOne,
          ContentType: 'image/jpeg',
          ACL: 'private',
        })
        .promise();
      if (mode === 'seasonone') {
        return res.status(200).json({ ok: true, mode });
      }
    }

    if (mode === 'portrait' || mode === 'full') {
      const [iris, portraitColor] = await Promise.all([
        readAlienComposeRef(ALIEN_COMPOSE_IRIS_REL),
        readAlienComposeRef(ALIEN_PORTRAIT_COLOR_REL),
      ]);
      const portrait = await composePersonalBitcoinAlienPortrait({
        selfie: selfieBuf,
        iris: iris.buffer,
        colorRef: portraitColor.buffer,
      });
      await s3
        .putObject({
          Bucket: bucket,
          Key: alienPortraitKey(allowed, asset),
          Body: portrait,
          ContentType: 'image/jpeg',
          ACL: 'private',
        })
        .promise();
      await consumePaidCredit(allowed, asset);
      return res.status(200).json({ ok: true, mode });
    }

    return res.status(400).json({ error: 'Unsupported compose mode' });
  } catch (err) {
    if (isMissingS3Object(err)) {
      return res.status(404).json({ error: 'Upload a face photo first' });
    }
    const message = err instanceof Error ? err.message : 'Compose failed';
    console.error('alien-compose POST', err);
    return res.status(500).json({ error: message });
  }
};

export default handler;
