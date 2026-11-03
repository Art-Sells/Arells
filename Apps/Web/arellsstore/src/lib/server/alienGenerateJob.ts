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
import { CHARACTER_GENERATION_PAYMENT_DISABLED } from '../characterGenerationPaymentGate';
import {
  consumePaidCredit,
  findPaidUnusedCredit,
} from './characterGenerationCredit';
import { normalizeEmailKey } from '../auth/normalize';
import { s3BucketNameOrThrow } from './s3Bucket';
import { promoteAlienStagedMedia } from './alienStaging';

export type AlienGenerateJobStatus = 'running' | 'complete' | 'error';

export type AlienGenerateJob = {
  email: string;
  assetId: string;
  status: AlienGenerateJobStatus;
  phase?: 'compose' | 'seasononeloop' | 'metaloop' | 'done';
  /** 0–100 — browser or worker updates this for the creating %. */
  progress?: number;
  /** Who runs Grok: worker Lambda (Amplify-safe) vs browser-driven API calls. */
  driver?: 'worker' | 'client';
  metaloop?: boolean;
  seasononeloop?: boolean;
  error?: string;
  startedAt: string;
  updatedAt: string;
  finishedAt?: string;
  /**
   * Set when the user closes “Character Creation Successful”.
   * Until then, any signed-in session should reopen that success modal for this job.
   */
  successDismissedAt?: string;
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
  const nextProgress =
    typeof patch.progress === 'number' && Number.isFinite(patch.progress)
      ? typeof prev.progress === 'number' && Number.isFinite(prev.progress)
        ? Math.max(prev.progress, patch.progress)
        : patch.progress
      : prev.progress;
  await writeAlienGenerateJob({
    ...prev,
    ...patch,
    email,
    assetId,
    ...(nextProgress != null ? { progress: nextProgress } : {}),
    updatedAt: new Date().toISOString(),
  });
}

async function assertJobStillCurrent(
  email: string,
  assetId: string,
  startedAt: string
): Promise<void> {
  const cur = await readAlienGenerateJob(email, assetId);
  if (cur?.startedAt && cur.startedAt !== startedAt) {
    throw Object.assign(new Error('Stale generate job — a newer create is in progress'), {
      code: 'stale_job',
    });
  }
}

/**
 * Full character pipeline (compose stills → loops → promote).
 * Runs on the alien-generate worker Lambda (long timeout) — not Amplify SSR.
 */
export async function runAlienGeneratePipeline(
  email: string,
  assetId: string,
  opts?: { startedAt?: string; driver?: 'worker' | 'client' }
): Promise<AlienGenerateJob> {
  const bucket = s3BucketNameOrThrow();
  const prev = await readAlienGenerateJob(email, assetId);
  const startedAt = opts?.startedAt || prev?.startedAt || new Date().toISOString();
  const driver = opts?.driver || prev?.driver || 'worker';

  const resumeProgress =
    typeof prev?.progress === 'number' && Number.isFinite(prev.progress)
      ? Math.max(5, prev.progress)
      : 5;
  await writeAlienGenerateJob({
    email,
    assetId,
    status: 'running',
    phase: prev?.phase === 'seasononeloop' || prev?.phase === 'metaloop' || prev?.phase === 'done'
      ? prev.phase
      : 'compose',
    progress: resumeProgress,
    driver,
    startedAt,
    updatedAt: new Date().toISOString(),
  });

  try {
    if (!CHARACTER_GENERATION_PAYMENT_DISABLED) {
      const credit = await findPaidUnusedCredit(email, assetId);
      if (!credit) {
        throw Object.assign(new Error('Character generation payment required'), {
          code: 'payment_required',
        });
      }
    }

    await assertJobStillCurrent(email, assetId, startedAt);
    const selfieBuf = await loadSelfie(bucket, email, assetId);
    const [iris, portraitColor, metaBase, seasonBase] = await Promise.all([
      readAlienComposeRef(ALIEN_COMPOSE_IRIS_REL),
      readAlienComposeRef(ALIEN_PORTRAIT_COLOR_REL),
      readAlienComposeRef(ALIEN_COMPOSE_BASE_REL),
      readAlienComposeRef(ALIEN_SEASONONE_BASE_REL),
    ]);

    await patchJob(email, assetId, { phase: 'compose', progress: 20, driver });
    const portrait = await composePersonalBitcoinAlienPortrait({
      selfie: selfieBuf,
      iris: iris.buffer,
      colorRef: portraitColor.buffer,
    });
    await assertJobStillCurrent(email, assetId, startedAt);
    await s3
      .putObject({
        Bucket: bucket,
        Key: alienPortraitKey(email, assetId, true),
        Body: portrait,
        ContentType: 'image/jpeg',
        ACL: 'private',
      })
      .promise();

    await patchJob(email, assetId, { phase: 'compose', progress: 40, driver });
    const seasonOne = await composePersonalBitcoinAlienSeasonOne({
      selfie: selfieBuf,
      base: seasonBase.buffer,
      iris: portrait,
    });
    await assertJobStillCurrent(email, assetId, startedAt);
    await s3
      .putObject({
        Bucket: bucket,
        Key: alienSeasonOneKey(email, assetId, true),
        Body: seasonOne,
        ContentType: 'image/jpeg',
        ACL: 'private',
      })
      .promise();

    await patchJob(email, assetId, { phase: 'compose', progress: 55, driver });
    const composed = await composePersonalBitcoinAlien({
      selfie: selfieBuf,
      selfieMime: 'image/jpeg',
      base: metaBase.buffer,
      baseMime: metaBase.mime,
      portrait,
    });
    await assertJobStillCurrent(email, assetId, startedAt);
    await s3
      .putObject({
        Bucket: bucket,
        Key: alienComposedKey(email, assetId, true),
        Body: composed,
        ContentType: 'image/jpeg',
        ACL: 'private',
      })
      .promise();

    if (!CHARACTER_GENERATION_PAYMENT_DISABLED) {
      await consumePaidCredit(email, assetId);
    }

    let seasonOk = false;
    let metaloopOk = false;
    const errors: string[] = [];

    await patchJob(email, assetId, { phase: 'seasononeloop', progress: 70, driver });
    {
      const key = alienSeasonOneLoopKey(email, assetId, true);
      await deleteQuiet(bucket, key);
      try {
        const seasonLoop = await generateAlienSeasonOneLoopVideo(seasonOne);
        await assertJobStillCurrent(email, assetId, startedAt);
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
          const seasonLoop = await generateAlienSeasonOneLoopVideo(seasonOne);
          await assertJobStillCurrent(email, assetId, startedAt);
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

    await patchJob(email, assetId, {
      phase: 'metaloop',
      progress: 85,
      seasononeloop: seasonOk,
      driver,
    });
    {
      const key = alienMetaloopKey(email, assetId, true);
      await deleteQuiet(bucket, key);
      try {
        const metaloop = await generateAlienMetaloopVideo(composed);
        await assertJobStillCurrent(email, assetId, startedAt);
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
          const metaloop = await generateAlienMetaloopVideo(composed);
          await assertJobStillCurrent(email, assetId, startedAt);
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

    if (!seasonOk || !metaloopOk) {
      throw new Error(errors[0] || 'Character video generation failed — try again');
    }

    await assertJobStillCurrent(email, assetId, startedAt);
    await promoteAlienStagedMedia(email, assetId, {
      require: ['composed', 'portrait', 'seasonone', 'metaloop', 'seasononeloop'],
      clearMissingLoops: false,
    });

    const finishedAt = new Date().toISOString();
    const done: AlienGenerateJob = {
      email,
      assetId,
      status: 'complete',
      phase: 'done',
      progress: 100,
      driver,
      metaloop: true,
      seasononeloop: true,
      startedAt,
      updatedAt: finishedAt,
      finishedAt,
    };
    await writeAlienGenerateJob(done);
    return done;
  } catch (err) {
    if ((err as { code?: string })?.code === 'stale_job') {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Character generation failed';
    const finishedAt = new Date().toISOString();
    const cur = await readAlienGenerateJob(email, assetId);
    if (cur?.startedAt && cur.startedAt !== startedAt) {
      throw err;
    }
    const failed: AlienGenerateJob = {
      email,
      assetId,
      status: 'error',
      driver,
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
