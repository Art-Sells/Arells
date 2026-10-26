import type { NextApiRequest, NextApiResponse } from 'next';
import { assertUserEmailMatchesSession } from '../../../lib/auth/requireUserApi';
import { getSessionFromRequest } from '../../../lib/auth/session';
import {
  ALIEN_COMPOSE_BASE_REL,
  ALIEN_COMPOSE_IRIS_REL,
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
  alienQuotaKey,
  alienSeasonOneKey,
  isMissingS3Object,
  normalizeAlienPhotoAsset,
  normalizeQuotaRecord,
  sniffAlienPhotoMime,
  toAlienQuotaState,
  type AlienQuotaState,
} from '../../../lib/server/alienPhoto';
import { getServerS3 } from '../../../lib/server/awsS3';
import { s3BucketNameOrThrow } from '../../../lib/server/s3Bucket';

const s3 = getServerS3();

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

async function readQuota(
  bucket: string,
  email: string,
  asset: string
): Promise<{ month: string; count: number }> {
  try {
    const obj = await s3.getObject({ Bucket: bucket, Key: alienQuotaKey(email, asset) }).promise();
    const text = obj.Body ? obj.Body.toString('utf8') : '{}';
    return normalizeQuotaRecord(JSON.parse(text));
  } catch (err) {
    if (isMissingS3Object(err)) {
      return normalizeQuotaRecord(null);
    }
    throw err;
  }
}

async function writeQuota(
  bucket: string,
  email: string,
  asset: string,
  record: { month: string; count: number }
): Promise<AlienQuotaState> {
  await s3
    .putObject({
      Bucket: bucket,
      Key: alienQuotaKey(email, asset),
      Body: JSON.stringify(record),
      ContentType: 'application/json',
      ACL: 'private',
    })
    .promise();
  return toAlienQuotaState(record);
}

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

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const rawAsset = Array.isArray(req.query.asset) ? req.query.asset[0] : req.query.asset;
    const asset = normalizeAlienPhotoAsset(rawAsset) || (rawAsset ? null : 'bitcoin');
    if (!asset) {
      return res.status(400).json({ error: 'Unsupported asset' });
    }
    try {
      const record = await readQuota(s3BucketNameOrThrow(), session.email, asset);
      return res.status(200).json({ quota: toAlienQuotaState(record) });
    } catch (err) {
      console.error('alien-compose GET quota', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

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

  const mode = rawMode === 'portrait' ? 'portrait' : 'full';
  const bucket = s3BucketNameOrThrow();

  try {
    const quotaRecord = await readQuota(bucket, allowed, asset);
    const quotaBefore = toAlienQuotaState(quotaRecord);
    if (quotaBefore.exhausted) {
      return res.status(429).json({
        error: `Wait until ${quotaBefore.nextMonthLabel} to replace photo`,
        quota: quotaBefore,
      });
    }

    const selfieBuf = await loadSelfie(bucket, allowed, asset);
    const iris = await readAlienComposeRef(ALIEN_COMPOSE_IRIS_REL);

    if (mode === 'full') {
      const [metaBase, seasonBase] = await Promise.all([
        readAlienComposeRef(ALIEN_COMPOSE_BASE_REL),
        readAlienComposeRef(ALIEN_SEASONONE_BASE_REL),
      ]);
      const [composed, seasonOne] = await Promise.all([
        composePersonalBitcoinAlien({
          selfie: selfieBuf,
          selfieMime: 'image/jpeg',
          base: metaBase.buffer,
          baseMime: metaBase.mime,
          iris: iris.buffer,
          irisMime: iris.mime,
        }),
        composePersonalBitcoinAlienSeasonOne({
          selfie: selfieBuf,
          base: seasonBase.buffer,
          iris: iris.buffer,
        }),
      ]);
      await Promise.all([
        s3
          .putObject({
            Bucket: bucket,
            Key: alienComposedKey(allowed, asset),
            Body: composed,
            ContentType: 'image/jpeg',
            ACL: 'private',
          })
          .promise(),
        s3
          .putObject({
            Bucket: bucket,
            Key: alienSeasonOneKey(allowed, asset),
            Body: seasonOne,
            ContentType: 'image/jpeg',
            ACL: 'private',
          })
          .promise(),
      ]);
    }

    const portrait = await composePersonalBitcoinAlienPortrait({
      selfie: selfieBuf,
      iris: iris.buffer,
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

    const nextRecord = {
      month: quotaRecord.month,
      count: quotaRecord.count + 1,
    };
    const quota = await writeQuota(bucket, allowed, asset, nextRecord);

    return res.status(200).json({ ok: true, mode, quota });
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
