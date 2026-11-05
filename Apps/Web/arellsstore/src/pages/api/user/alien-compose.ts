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
import { saveCharacterMetaposter } from '../../../lib/server/characterMetaposterCrop';
import {
  alienPhotoKey,
  alienPortraitKey,
  alienSeasonOneKey,
  isMissingS3Object,
  normalizeAlienPhotoAsset,
  sniffAlienPhotoMime,
} from '../../../lib/server/alienPhoto';
import { getServerS3 } from '../../../lib/server/awsS3';
import { CHARACTER_GENERATION_PAYMENT_DISABLED } from '../../../lib/characterGenerationPaymentGate';
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

async function loadJpegKey(bucket: string, key: string): Promise<Buffer> {
  const obj = await s3.getObject({ Bucket: bucket, Key: key }).promise();
  const body = obj.Body;
  if (!body) throw Object.assign(new Error('Missing image'), { code: 'NoSuchKey' });
  return Buffer.isBuffer(body) ? body : Buffer.from(body as ArrayBuffer);
}

/** Staged portrait — iris source for Season One + launch meta. */
async function loadPortrait(bucket: string, email: string, asset: string): Promise<Buffer> {
  return loadJpegKey(bucket, alienPortraitKey(email, asset, true));
}

type ComposeMode = 'meta' | 'seasonone' | 'portrait' | 'full';

function normalizeMode(raw: unknown): ComposeMode {
  if (raw === 'meta' || raw === 'seasonone' || raw === 'portrait' || raw === 'full') {
    return raw;
  }
  return 'full';
}

/**
 * Amplify API routes die around ~30s — one Grok edit per request.
 * Client drives: portrait → seasonone → meta → videos.
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
    if (!CHARACTER_GENERATION_PAYMENT_DISABLED) {
      const credit = await findPaidUnusedCredit(allowed, asset);
      if (!credit) {
        return res.status(402).json({
          error: 'Character generation payment required',
          code: 'payment_required',
        });
      }
    }

    const selfieBuf = await loadSelfie(bucket, allowed, asset);

    if (mode === 'portrait') {
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
          Key: alienPortraitKey(allowed, asset, true),
          Body: portrait,
          ContentType: 'image/jpeg',
          ACL: 'private',
        })
        .promise();
      return res.status(200).json({ ok: true, mode });
    }

    if (mode === 'seasonone') {
      const [portrait, seasonBase] = await Promise.all([
        loadPortrait(bucket, allowed, asset),
        readAlienComposeRef(ALIEN_SEASONONE_BASE_REL),
      ]);
      const seasonOne = await composePersonalBitcoinAlienSeasonOne({
        selfie: selfieBuf,
        base: seasonBase.buffer,
        iris: portrait,
      });
      await s3
        .putObject({
          Bucket: bucket,
          Key: alienSeasonOneKey(allowed, asset, true),
          Body: seasonOne,
          ContentType: 'image/jpeg',
          ACL: 'private',
        })
        .promise();
      return res.status(200).json({ ok: true, mode });
    }

    if (mode === 'meta') {
      const [portrait, metaBase] = await Promise.all([
        loadPortrait(bucket, allowed, asset),
        readAlienComposeRef(ALIEN_COMPOSE_BASE_REL),
      ]);
      const composed = await composePersonalBitcoinAlien({
        selfie: selfieBuf,
        selfieMime: 'image/jpeg',
        base: metaBase.buffer,
        baseMime: metaBase.mime,
        portrait,
      });
      await saveCharacterMetaposter({
        s3,
        bucket,
        email: allowed,
        asset,
        staging: true,
        squareJpeg: composed,
      });
      if (!CHARACTER_GENERATION_PAYMENT_DISABLED) {
        await consumePaidCredit(allowed, asset);
      }
      return res.status(200).json({ ok: true, mode });
    }

    if (mode === 'full') {
      /* Dev/local one-shot: portrait → seasonone → meta. */
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
          Key: alienPortraitKey(allowed, asset, true),
          Body: portrait,
          ContentType: 'image/jpeg',
          ACL: 'private',
        })
        .promise();

      const seasonBase = await readAlienComposeRef(ALIEN_SEASONONE_BASE_REL);
      const seasonOne = await composePersonalBitcoinAlienSeasonOne({
        selfie: selfieBuf,
        base: seasonBase.buffer,
        iris: portrait,
      });
      await s3
        .putObject({
          Bucket: bucket,
          Key: alienSeasonOneKey(allowed, asset, true),
          Body: seasonOne,
          ContentType: 'image/jpeg',
          ACL: 'private',
        })
        .promise();

      const metaBase = await readAlienComposeRef(ALIEN_COMPOSE_BASE_REL);
      const composed = await composePersonalBitcoinAlien({
        selfie: selfieBuf,
        selfieMime: 'image/jpeg',
        base: metaBase.buffer,
        baseMime: metaBase.mime,
        portrait,
      });
      await saveCharacterMetaposter({
        s3,
        bucket,
        email: allowed,
        asset,
        staging: true,
        squareJpeg: composed,
      });
      if (!CHARACTER_GENERATION_PAYMENT_DISABLED) {
        await consumePaidCredit(allowed, asset);
      }
      return res.status(200).json({ ok: true, mode });
    }

    return res.status(400).json({ error: 'Unsupported compose mode' });
  } catch (err) {
    if (isMissingS3Object(err)) {
      return res.status(404).json({
        error:
          mode === 'meta' || mode === 'seasonone'
            ? 'Generate portrait first'
            : 'Upload a face photo first',
      });
    }
    const message = err instanceof Error ? err.message : 'Compose failed';
    console.error('alien-compose POST', err);
    return res.status(500).json({ error: message });
  }
};

export default handler;
