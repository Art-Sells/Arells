import {
  ALIEN_COMPOSE_BASE_REL,
  ALIEN_COMPOSE_IRIS_REL,
  ALIEN_PORTRAIT_COLOR_REL,
  ALIEN_SEASONONE_BASE_REL,
  composePersonalBitcoinAlien,
  composePersonalBitcoinAlienPortrait,
  composePersonalBitcoinAlienSeasonOne,
  generateAlienMetaloopVideo,
  generateAlienSeasonOneLoopVideo,
  readAlienComposeRef,
} from './alienCompose';
import {
  alienComposedKey,
  alienMetaloopKey,
  alienPhotoKey,
  alienPortraitKey,
  alienSeasonOneKey,
  alienSeasonOneLoopKey,
  isMissingS3Object,
  sniffAlienPhotoMime,
} from './alienPhoto';
import { getServerS3 } from './awsS3';
import {
  consumePaidCredit,
  findPaidUnusedCredit,
} from './characterGenerationCredit';
import { normalizeEmailKey } from '../auth/normalize';
import { s3BucketNameOrThrow } from './s3Bucket';

export type AlienGenerateJobStatus = 'running' | 'complete' | 'error';

export type AlienGenerateJob = {
  email: string;
  assetId: string;
  status: AlienGenerateJobStatus;
  phase?: 'compose' | 'seasononeloop' | 'metaloop' | 'done';
  metaloop?: boolean;
  seasononeloop?: boolean;
  error?: string;
  startedAt: string;
  updatedAt: string;
  finishedAt?: string;
};

const s3 = getServerS3();

export function alienGenerateJobKey(email: string, assetId: string): string {
  return `users/${normalizeEmailKey(email)}/aliens/${assetId}-generate-job.json`;
}

export async function readAlienGenerateJob(
  email: string,
  assetId: string
): Promise<AlienGenerateJob | null> {
  const bucket = s3BucketNameOrThrow();
  try {
    const obj = await s3
      .getObject({ Bucket: bucket, Key: alienGenerateJobKey(email, assetId) })
      .promise();
    const body = obj.Body;
    if (!body) return null;
    const text = Buffer.isBuffer(body) ? body.toString('utf8') : String(body);
    return JSON.parse(text) as AlienGenerateJob;
  } catch (err) {
    if (isMissingS3Object(err)) return null;
    throw err;
  }
}

export async function writeAlienGenerateJob(job: AlienGenerateJob): Promise<void> {
  const bucket = s3BucketNameOrThrow();
  await s3
    .putObject({
      Bucket: bucket,
      Key: alienGenerateJobKey(job.email, job.assetId),
      Body: JSON.stringify(job),
      ContentType: 'application/json',
      ACL: 'private',
    })
    .promise();
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

async function patchJob(
  email: string,
  assetId: string,
  patch: Partial<AlienGenerateJob>
): Promise<void> {
  const prev =
    (await readAlienGenerateJob(email, assetId)) ||
    ({
      email,
      assetId,
      status: 'running',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as AlienGenerateJob);
  await writeAlienGenerateJob({
    ...prev,
    ...patch,
    email,
    assetId,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Full character pipeline (compose stills → Season One loop → metaloop).
 * Safe to run after the HTTP response — does not need the browser.
 */
export async function runAlienGeneratePipeline(email: string, assetId: string): Promise<AlienGenerateJob> {
  const bucket = s3BucketNameOrThrow();
  const startedAt = new Date().toISOString();

  await writeAlienGenerateJob({
    email,
    assetId,
    status: 'running',
    phase: 'compose',
    startedAt,
    updatedAt: startedAt,
  });

  try {
    const credit = await findPaidUnusedCredit(email, assetId);
    if (!credit) {
      throw Object.assign(new Error('Character generation payment required'), {
        code: 'payment_required',
      });
    }

    const selfieBuf = await loadSelfie(bucket, email, assetId);
    const [iris, portraitColor, metaBase, seasonBase] = await Promise.all([
      readAlienComposeRef(ALIEN_COMPOSE_IRIS_REL),
      readAlienComposeRef(ALIEN_PORTRAIT_COLOR_REL),
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
          Key: alienComposedKey(email, assetId),
          Body: composed,
          ContentType: 'image/jpeg',
          ACL: 'private',
        })
        .promise(),
      s3
        .putObject({
          Bucket: bucket,
          Key: alienSeasonOneKey(email, assetId),
          Body: seasonOne,
          ContentType: 'image/jpeg',
          ACL: 'private',
        })
        .promise(),
    ]);

    const portrait = await composePersonalBitcoinAlienPortrait({
      selfie: selfieBuf,
      iris: iris.buffer,
      colorRef: portraitColor.buffer,
    });
    await s3
      .putObject({
        Bucket: bucket,
        Key: alienPortraitKey(email, assetId),
        Body: portrait,
        ContentType: 'image/jpeg',
        ACL: 'private',
      })
      .promise();

    await consumePaidCredit(email, assetId);

    let seasonOk = false;
    let metaloopOk = false;
    const errors: string[] = [];

    await patchJob(email, assetId, { phase: 'seasononeloop' });
    {
      const key = alienSeasonOneLoopKey(email, assetId);
      await deleteQuiet(bucket, key);
      try {
        const seasonOneJpeg = await loadJpeg(bucket, alienSeasonOneKey(email, assetId));
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
        console.error('alien-generate seasononeloop', err);
        errors.push(message);
        try {
          const seasonOneJpeg = await loadJpeg(bucket, alienSeasonOneKey(email, assetId));
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
        } catch (retryErr) {
          console.error('alien-generate seasononeloop retry', retryErr);
        }
      }
    }

    await patchJob(email, assetId, { phase: 'metaloop', seasononeloop: seasonOk });
    {
      const key = alienMetaloopKey(email, assetId);
      await deleteQuiet(bucket, key);
      try {
        const composedJpeg = await loadJpeg(bucket, alienComposedKey(email, assetId));
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
        console.error('alien-generate metaloop', err);
        errors.push(message);
        try {
          const composedJpeg = await loadJpeg(bucket, alienComposedKey(email, assetId));
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
        } catch (retryErr) {
          console.error('alien-generate metaloop retry', retryErr);
        }
      }
    }

    const finishedAt = new Date().toISOString();
    const done: AlienGenerateJob = {
      email,
      assetId,
      status: 'complete',
      phase: 'done',
      metaloop: metaloopOk,
      seasononeloop: seasonOk,
      error: errors.length ? errors.join('; ') : undefined,
      startedAt,
      updatedAt: finishedAt,
      finishedAt,
    };
    await writeAlienGenerateJob(done);
    return done;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Character generation failed';
    const finishedAt = new Date().toISOString();
    const failed: AlienGenerateJob = {
      email,
      assetId,
      status: 'error',
      error: message,
      startedAt,
      updatedAt: finishedAt,
      finishedAt,
    };
    await writeAlienGenerateJob(failed).catch(() => undefined);
    throw err;
  }
}

/** Keep work alive after the HTTP response (Vercel waitUntil; void fallback locally). */
export function continueAfterResponse(work: Promise<unknown>): void {
  try {
    // Dynamic import-style require so local builds don't hard-fail if unresolved.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { waitUntil } = require('@vercel/functions') as {
      waitUntil?: (p: Promise<unknown>) => void;
    };
    if (typeof waitUntil === 'function') {
      waitUntil(work);
      return;
    }
  } catch {
    /* local / non-Vercel */
  }
  void work;
}
