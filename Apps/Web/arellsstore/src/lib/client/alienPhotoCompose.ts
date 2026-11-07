import { ALIEN_COMPOSE_DONE_EVENT } from '../assets/assetSharePath';
import { clearPaidCreditPending } from './characterGenerationPay';

/**
 * Amplify Hosting rejects API bodies around ~1MB. Never POST a full camera-roll
 * photo through /api — use S3 presign or chunked uploads instead.
 */
const UPLOAD_MAX_EDGE = 1280;
const UPLOAD_MIN_EDGE = 640;
const UPLOAD_JPEG_QUALITY = 0.82;
const UPLOAD_HARD_MAX_BYTES = 2_500_000;
/** Stay well under Amplify’s ~1MB API body after JSON wrapping. */
/**
 * arells.com (Amplify Mainnet / CloudFront+WAF) rejects POST bodies ≥ 8KB
 * with HTML 403 "request could not be satisfied". Test Amplify URL allows
 * larger bodies, which is why upload worked on test and failed on main.
 * Keep each JSON request under ~8KB including email/uploadId envelope.
 */
const CHUNK_BASE64_CHARS = 6_000;

/** Broad accept — iOS camera roll is often HEIC; Safari may still hand us a JPEG. */
export const ALIEN_PHOTO_ACCEPT = 'image/*,.heic,.heif,image/heic,image/heif';

/**
 * Last-resort HEIC→JPEG for browsers that cannot decode HEIC natively.
 * Avoid on iOS Safari when possible — heic2any/WASM often fails there instantly
 * even though Safari can draw the same HEIC into a canvas.
 */
async function heicToJpegFile(file: Blob, nameHint?: string): Promise<File> {
  const heic2any = (await import('heic2any')).default;
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: UPLOAD_JPEG_QUALITY,
  });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  if (!(blob instanceof Blob)) {
    throw new Error('Could not convert HEIC photo');
  }
  const base =
    (nameHint || 'photo').replace(/\.(heic|heif)$/i, '') || 'photo';
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
}

function canvasToJpegBlob(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  quality: number,
  maxEdge: number
): Promise<Blob> {
  if (!srcW || !srcH) {
    return Promise.reject(new Error('Could not decode photo'));
  }
  const scale = Math.min(1, maxEdge / Math.max(srcW, srcH));
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Could not process photo'));
  ctx.drawImage(source, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not compress photo'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      quality
    );
  });
}

function imageElementToJpegBlob(
  file: Blob,
  quality: number,
  maxEdge: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (!img.naturalWidth || !img.naturalHeight) {
        reject(new Error('Could not decode photo'));
        return;
      }
      void canvasToJpegBlob(
        img,
        img.naturalWidth,
        img.naturalHeight,
        quality,
        maxEdge
      ).then(resolve, reject);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not decode photo'));
    };
    img.src = url;
  });
}

async function tryNativeJpegBlob(
  source: Blob,
  quality: number,
  maxEdge: number
): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(source);
    try {
      if (!bitmap.width || !bitmap.height) return null;
      return await canvasToJpegBlob(
        bitmap,
        bitmap.width,
        bitmap.height,
        quality,
        maxEdge
      );
    } finally {
      bitmap.close();
    }
  } catch {
    /* try <img> */
  }
  try {
    return await imageElementToJpegBlob(source, quality, maxEdge);
  } catch {
    return null;
  }
}

/** Resize + JPEG-compress. Native decode first (iOS HEIC); heic2any only as fallback. */
async function fileToUploadJpegBlob(file: File): Promise<Blob> {
  let quality = UPLOAD_JPEG_QUALITY;
  let maxEdge = UPLOAD_MAX_EDGE;
  let source: Blob = file;

  let blob = await tryNativeJpegBlob(source, quality, maxEdge);

  if (!blob) {
    try {
      source = await heicToJpegFile(file, file.name);
      blob = await tryNativeJpegBlob(source, quality, maxEdge);
    } catch (err) {
      console.error('HEIC convert failed', err);
    }
  }

  if (!blob) {
    throw new Error('Could not read this photo. Try another from your camera roll.');
  }

  while (blob.size > UPLOAD_HARD_MAX_BYTES && (quality > 0.4 || maxEdge > UPLOAD_MIN_EDGE)) {
    if (quality > 0.45) quality = Math.max(0.4, quality - 0.1);
    else maxEdge = Math.max(UPLOAD_MIN_EDGE, Math.round(maxEdge * 0.75));
    const next = await tryNativeJpegBlob(source, quality, maxEdge);
    if (!next) break;
    blob = next;
  }

  if (blob.size > UPLOAD_HARD_MAX_BYTES) {
    throw new Error('Photo is too large after compression');
  }
  return blob;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('Could not read photo'));
    reader.readAsDataURL(blob);
  });
}


export type AlienComposeResult = {
  portraitBlob: Blob;
  metaBlob: Blob;
  loopBlob: Blob | null;
  /** Prefer this for <video src> — metaloop GET 302s to S3 and fetch() fails CORS. */
  loopUrl?: string | null;
  metaloop: boolean;
  seasononeloop: boolean;
};

export type AlienCreateProgressFn = (percent: number) => void;

function clampProgress(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export type AlienCreateFailureStage = 'upload' | 'generate';

/** Thrown so the create host can show upload-specific modal copy. */
export class AlienCreateStageError extends Error {
  stage: AlienCreateFailureStage;

  constructor(message: string, stage: AlienCreateFailureStage) {
    super(message);
    this.name = 'AlienCreateStageError';
    this.stage = stage;
  }
}

export function alienCreateFailureStage(err: unknown): AlienCreateFailureStage {
  if (err instanceof AlienCreateStageError) return err.stage;
  return 'generate';
}

const GENERATE_POLL_MS = 2000;
/**
 * Fresh “running” window for remote-resume attach.
 * Full stills + videos can exceed this — after that, resume must re-drive only if abandoned.
 */
/** Absolute wait for worker Grok stills + two videos (~Lambda sync cap). */
export const ALIEN_GENERATE_STALE_MS = 15 * 60 * 1000;
/**
 * No phase/finalize update within this window ⇒ the driving tab died.
 * Only then may another tab start a second client pipeline (never for worker jobs).
 */
export const ALIEN_GENERATE_PROGRESS_STALE_MS = 90 * 1000;

export type AlienGenerateJobClient = {
  status?: 'running' | 'complete' | 'error';
  phase?: string;
  progress?: number;
  driver?: 'worker' | 'client';
  metaloop?: boolean;
  seasononeloop?: boolean;
  error?: string;
  startedAt?: string;
  updatedAt?: string;
  finishedAt?: string;
  /** ISO — user closed the success modal for this completed job. */
  successDismissedAt?: string;
  /** ISO — user closed the create-failed modal for this job. */
  errorDismissedAt?: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchAlienGenerateJob(
  email: string,
  assetId: string
): Promise<AlienGenerateJobClient | null> {
  const statusRes = await fetch(
    `/api/user/alien-generate?email=${encodeURIComponent(email)}&asset=${encodeURIComponent(assetId)}`,
    { credentials: 'include', cache: 'no-store' }
  );
  const statusJson = await statusRes.json().catch(() => ({}));
  if (!statusRes.ok) {
    throw new Error(statusJson.error || 'Could not check generation status');
  }
  return statusJson.job && typeof statusJson.job === 'object'
    ? (statusJson.job as AlienGenerateJobClient)
    : null;
}

export function isAlienGenerateJobFreshRunning(job: AlienGenerateJobClient | null | undefined): boolean {
  if (!job || job.status !== 'running') return false;
  const startedMs = Date.parse(job.startedAt || '') || 0;
  if (!startedMs) return true;
  const ageMs = Date.now() - startedMs;
  return ageMs >= 0 && ageMs < ALIEN_GENERATE_STALE_MS;
}

/** Complete job whose success modal was never closed — reopen on any signed-in visit. */
export function isAlienGenerateJobPendingSuccess(
  job: AlienGenerateJobClient | null | undefined
): boolean {
  if (!job || job.status !== 'complete') return false;
  if (job.successDismissedAt) return false;
  const finishedMs = Date.parse(job.finishedAt || job.updatedAt || job.startedAt || '') || 0;
  if (!finishedMs) return true;
  /* Drop ancient completes so an undismissed job from months ago never loops forever. */
  const ageMs = Date.now() - finishedMs;
  return ageMs >= 0 && ageMs < 7 * 24 * 60 * 60 * 1000;
}

/** Failed job whose error modal was never closed — reopen on any signed-in visit. */
export function isAlienGenerateJobPendingError(
  job: AlienGenerateJobClient | null | undefined
): boolean {
  if (!job || job.status !== 'error') return false;
  if (job.errorDismissedAt) return false;
  const finishedMs = Date.parse(job.finishedAt || job.updatedAt || job.startedAt || '') || 0;
  if (!finishedMs) return true;
  const ageMs = Date.now() - finishedMs;
  return ageMs >= 0 && ageMs < 7 * 24 * 60 * 60 * 1000;
}

/** Running longer than the hard create window — treat as failed for UI + job JSON. */
export function isAlienGenerateJobTimedOut(
  job: AlienGenerateJobClient | null | undefined
): boolean {
  if (!job || job.status !== 'running') return false;
  const startedMs = Date.parse(job.startedAt || '') || 0;
  if (!startedMs) return false;
  const ageMs = Date.now() - startedMs;
  return ageMs >= ALIEN_GENERATE_STALE_MS;
}

/** Worker armed but never wrote progress — Lambda likely crashed (e.g. bad S3 keys). */
export function isAlienGenerateWorkerNeverStarted(
  job: AlienGenerateJobClient | null | undefined,
  graceMs = 90_000
): boolean {
  if (!job || job.status !== 'running' || job.driver !== 'worker') return false;
  const progress = typeof job.progress === 'number' ? job.progress : 0;
  if (progress > 5) return false;
  const startedMs = Date.parse(job.startedAt || '') || 0;
  if (!startedMs) return false;
  const ageMs = Date.now() - startedMs;
  return ageMs >= graceMs;
}

export async function ackAlienGenerateSuccess(args: {
  email: string;
  assetId: string;
  startedAt?: string | null;
}): Promise<void> {
  await postJson('/api/user/alien-generate', {
    email: args.email,
    asset: args.assetId,
    action: 'ack-success',
    ...(args.startedAt ? { startedAt: args.startedAt } : {}),
  });
}

export async function ackAlienGenerateError(args: {
  email: string;
  assetId: string;
  startedAt?: string | null;
}): Promise<void> {
  await postJson('/api/user/alien-generate', {
    email: args.email,
    asset: args.assetId,
    action: 'ack-error',
    ...(args.startedAt ? { startedAt: args.startedAt } : {}),
  });
}

export async function failAlienGenerateJob(args: {
  email: string;
  assetId: string;
  error: string;
  startedAt?: string | null;
}): Promise<void> {
  await postJson('/api/user/alien-generate', {
    email: args.email,
    asset: args.assetId,
    action: 'fail',
    error: args.error,
    ...(args.startedAt ? { startedAt: args.startedAt } : {}),
  });
}

/** True when a running job has stopped receiving phase updates (driver abandoned). */
export function isAlienGenerateJobAbandoned(job: AlienGenerateJobClient | null | undefined): boolean {
  if (!job || job.status !== 'running') return false;
  /* Worker jobs heartbeat slowly during Grok video — never steal the pipeline. */
  if (job.driver === 'worker') return false;
  const updatedMs =
    Date.parse(job.updatedAt || '') || Date.parse(job.startedAt || '') || 0;
  if (!updatedMs) return true;
  const idleMs = Date.now() - updatedMs;
  return idleMs < 0 || idleMs >= ALIEN_GENERATE_PROGRESS_STALE_MS;
}

async function loadComposeResultFromJob(
  assetId: string,
  shareId: string | null | undefined,
  job: AlienGenerateJobClient
): Promise<AlienComposeResult> {
  const bust = `&t=${Date.now()}`;
  const loopApi = `/api/user/alien-photo?asset=${encodeURIComponent(assetId)}&kind=metaloop${bust}`;
  let portraitRes: Response;
  let metaRes: Response;
  let loopHead: Response;
  try {
    [portraitRes, metaRes, loopHead] = await Promise.all([
      fetch(`/api/user/alien-photo?asset=${encodeURIComponent(assetId)}&kind=portrait${bust}`, {
        credentials: 'include',
        cache: 'no-store',
      }),
      fetch(`/api/user/alien-photo?asset=${encodeURIComponent(assetId)}&kind=composedsquare${bust}`, {
        credentials: 'include',
        cache: 'no-store',
      }),
      /* HEAD only — GET 302s to S3 and fetch() fails CORS (“Load failed” on Safari). */
      fetch(loopApi, {
        method: 'HEAD',
        credentials: 'include',
        cache: 'no-store',
      }),
    ]);
  } catch (err) {
    const why = err instanceof Error ? err.message : 'network error';
    throw new Error(`Could not load generated images — ${why}`);
  }
  if (!portraitRes.ok || !metaRes.ok) {
    throw new Error(
      `Could not load generated images (${!portraitRes.ok ? 'portrait' : 'poster'} ${
        !portraitRes.ok ? portraitRes.status : metaRes.status
      })`
    );
  }
  const [portraitBlob, metaBlob] = await Promise.all([portraitRes.blob(), metaRes.blob()]);
  const hasLoop = loopHead.ok;
  const loopVersion =
    (loopHead.headers.get('x-alien-video-version') || '').trim() ||
    (loopHead.headers.get('etag') || '').replace(/"/g, '').trim() ||
    String(Date.now());
  const loopUrl = hasLoop
    ? `/api/user/alien-photo?asset=${encodeURIComponent(assetId)}&kind=metaloop&t=${encodeURIComponent(loopVersion)}`
    : null;

  if (typeof window !== 'undefined') {
    clearPaidCreditPending(assetId);
    window.dispatchEvent(
      new CustomEvent(ALIEN_COMPOSE_DONE_EVENT, {
        detail: {
          assetId,
          shareId,
          at: Date.now(),
          metaloop: Boolean(job.metaloop && hasLoop),
          seasononeloop: Boolean(job.seasononeloop),
        },
      })
    );
  }

  return {
    portraitBlob,
    metaBlob,
    loopBlob: null,
    loopUrl,
    metaloop: Boolean(job.metaloop && hasLoop),
    seasononeloop: Boolean(job.seasononeloop),
  };
}

/**
 * Other tab / reload: poll while another client is driving; only re-drive compose
 * when the job looks abandoned. Starting a second pipeline while the first is
 * still writing staging caused early finalize (new stills live) + stuck creating UI.
 */
export function progressForRemotePhase(job: AlienGenerateJobClient | null | undefined): number {
  if (typeof job?.progress === 'number' && Number.isFinite(job.progress)) {
    return clampProgress(job.progress);
  }
  const phase = job?.phase || 'compose';
  if (phase === 'compose') return 35;
  if (phase === 'seasononeloop') return 72;
  if (phase === 'metaloop') return 88;
  if (phase === 'done') return 98;
  return 30;
}

/** Push % to the job JSON so other browsers can poll the same number. */
/** UI + job % only move forward within one create (arm/worker re-entry used to yank 39% → 1%). */
export function createMonotonicProgress(
  onProgress?: AlienCreateProgressFn
): AlienCreateProgressFn {
  let last = 0;
  return (percent: number) => {
    const pct = Math.max(last, clampProgress(percent));
    last = pct;
    onProgress?.(pct);
  };
}

function createProgressPublisher(args: {
  email: string;
  assetId: string;
  startedAt?: string | null;
  onProgress?: AlienCreateProgressFn;
}): AlienCreateProgressFn {
  let lastPosted = -1;
  let lastPostAt = 0;
  const reportUi = createMonotonicProgress(args.onProgress);
  return (percent: number) => {
    const pct = clampProgress(percent);
    reportUi(pct);
    const now = Date.now();
    if (pct < 100 && pct - lastPosted < 3 && now - lastPostAt < 1200) return;
    /* Never POST a lower % than the last one we already published for this run. */
    if (pct < lastPosted) return;
    lastPosted = pct;
    lastPostAt = now;
    void postJson('/api/user/alien-generate', {
      email: args.email,
      asset: args.assetId,
      action: 'phase',
      progress: pct,
      ...(args.startedAt ? { startedAt: args.startedAt } : {}),
    }).catch(() => undefined);
  };
}

export async function awaitAlienGenerateJob(args: {
  email: string;
  assetId: string;
  shareId?: string | null;
  initialJob?: AlienGenerateJobClient | null;
  onProgress?: AlienCreateProgressFn;
}): Promise<AlienComposeResult> {
  const { email, assetId, shareId } = args;
  const onProgress = createMonotonicProgress(args.onProgress);
  const hardDeadline = Date.now() + ALIEN_GENERATE_STALE_MS;
  let job: AlienGenerateJobClient | null = args.initialJob ?? null;
  let workerRequeued = false;
  onProgress(progressForRemotePhase(job));

  while (Date.now() < hardDeadline) {
    if (job?.status === 'complete') {
      onProgress(100);
      return loadComposeResultFromJob(assetId, shareId, job);
    }
    if (job?.status === 'error') {
      throw new Error(job.error || 'Character generation failed');
    }
    if (job?.status === 'running' && isAlienGenerateJobAbandoned(job)) {
      const startedAt =
        typeof job.startedAt === 'string' && job.startedAt.trim() ? job.startedAt.trim() : null;
      return runAlienGeneratePipeline({ email, assetId, shareId, startedAt, onProgress });
    }
    /*
     * Worker armed but never left 1% — Lambda never wrote. Re-enqueue once; if still
     * stuck, fail so reopen doesn't spin forever (YouTube-style needs a live worker).
     */
    if (isAlienGenerateWorkerNeverStarted(job, 90_000)) {
      if (!workerRequeued) {
        workerRequeued = true;
        await postJson('/api/user/alien-generate', {
          email,
          asset: assetId,
          action: 'arm',
          force: false,
        }).catch(() => undefined);
      } else if (isAlienGenerateWorkerNeverStarted(job, 180_000)) {
        const message =
          'Character worker failed to start — check Lambda execution role / remove dead AWS keys from the worker env';
        await postJson('/api/user/alien-generate', {
          email,
          asset: assetId,
          action: 'fail',
          error: message,
          ...(job?.startedAt ? { startedAt: job.startedAt } : {}),
        }).catch(() => undefined);
        throw new Error(message);
      }
    }
    onProgress(progressForRemotePhase(job));
    await sleep(GENERATE_POLL_MS);
    job = await fetchAlienGenerateJob(email, assetId);
  }

  if (job?.status === 'complete') {
    onProgress(100);
    return loadComposeResultFromJob(assetId, shareId, job);
  }
  if (job?.status === 'error') {
    throw new Error(job.error || 'Character generation failed');
  }

  const startedAt =
    typeof job?.startedAt === 'string' && job.startedAt.trim() ? job.startedAt.trim() : null;

  if (job?.driver === 'worker') {
    const message =
      'Character creation timed out after 15 minutes — try again';
    await postJson('/api/user/alien-generate', {
      email,
      asset: assetId,
      action: 'fail',
      error: message,
      ...(startedAt ? { startedAt } : {}),
    }).catch(() => undefined);
    throw new Error(message);
  }

  /* Absolute age exceeded — last chance to finish from the selfie on S3 (client driver). */
  return runAlienGeneratePipeline({ email, assetId, shareId, startedAt, onProgress });
}

/** Portrait → Season One → launch meta; videos follow in pipeline. One Grok edit each. */
const COMPOSE_STEPS = ['portrait', 'seasonone', 'meta'] as const;

/** Compose stills + loops after selfie upload / arm (one Grok call per Amplify request). */
export async function runAlienGeneratePipeline(args: {
  email: string;
  assetId: string;
  shareId?: string | null;
  /** From arm response — stale pipelines must not finalize over a newer force-arm. */
  startedAt?: string | null;
  onProgress?: AlienCreateProgressFn;
}): Promise<AlienComposeResult> {
  const { email, assetId, shareId, startedAt, onProgress } = args;
  const report = createProgressPublisher({ email, assetId, startedAt, onProgress });

  const failJob = async (message: string) => {
    await postJson('/api/user/alien-generate', {
      email,
      asset: assetId,
      action: 'fail',
      error: message,
      ...(startedAt ? { startedAt } : {}),
    }).catch(() => undefined);
  };

  try {
    report(22);
    await postJson('/api/user/alien-generate', {
      email,
      asset: assetId,
      action: 'phase',
      phase: 'compose',
      progress: 22,
      ...(startedAt ? { startedAt } : {}),
    });

    for (let i = 0; i < COMPOSE_STEPS.length; i++) {
      const mode = COMPOSE_STEPS[i];
      report(24 + ((i + 1) / COMPOSE_STEPS.length) * 46);
      const compose = await postJsonRetry('/api/user/alien-compose', {
        email,
        asset: assetId,
        mode,
      });
      if (!compose.ok) {
        throw new Error(
          typeof compose.json.error === 'string'
            ? compose.json.error
            : `Character create failed (${mode})`
        );
      }
    }

    report(72);
    await postJson('/api/user/alien-generate', {
      email,
      asset: assetId,
      action: 'phase',
      phase: 'seasononeloop',
      progress: 72,
      ...(startedAt ? { startedAt } : {}),
    });
    const season = await postJsonRetry('/api/user/alien-videos', {
      email,
      asset: assetId,
      kinds: ['seasononeloop'],
    });
    const seasonOk = Boolean(season.ok && season.json.seasononeloop);

    report(85);
    await postJson('/api/user/alien-generate', {
      email,
      asset: assetId,
      action: 'phase',
      phase: 'metaloop',
      progress: 85,
      seasononeloop: seasonOk,
      ...(startedAt ? { startedAt } : {}),
    });
    const metaloop = await postJsonRetry('/api/user/alien-videos', {
      email,
      asset: assetId,
      kinds: ['metaloop'],
    });
    const metaloopOk = Boolean(metaloop.ok && metaloop.json.metaloop);

    /*
     * Do not promote stills to live until both loops exist — otherwise Season One /
     * launch posters update while Creating Character is still running (or old loops linger).
     */
    if (!seasonOk || !metaloopOk) {
      const detail =
        typeof season.json.error === 'string'
          ? season.json.error
          : typeof metaloop.json.error === 'string'
            ? metaloop.json.error
            : 'Character video generation failed — try again';
      throw new Error(detail);
    }

    report(96);
    const finalize = await postJson('/api/user/alien-generate', {
      email,
      asset: assetId,
      action: 'finalize',
      metaloop: true,
      seasononeloop: true,
      ...(startedAt ? { startedAt } : {}),
    });
    if (!finalize.ok) {
      const code = typeof finalize.json.code === 'string' ? finalize.json.code : '';
      if (code === 'stale_job') {
        /* Newer create won — stop quietly; the winning pipeline publishes. */
        throw new Error('Character create superseded by a newer attempt');
      }
      throw new Error(
        typeof finalize.json.error === 'string'
          ? finalize.json.error
          : 'Character generation failed to publish'
      );
    }
    const job =
      finalize.json.job && typeof finalize.json.job === 'object'
        ? (finalize.json.job as AlienGenerateJobClient)
        : { status: 'complete' as const, metaloop: metaloopOk, seasononeloop: seasonOk };

    report(100);
    return loadComposeResultFromJob(assetId, shareId, job);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Character generation failed';
    if (!/superseded by a newer attempt/i.test(message)) {
      await failJob(message);
    }
    throw err;
  }
}

/**
 * iOS Safari can invalidate File blobs when the <input type="file"> is cleared.
 * Copy bytes into a new File before resetting the input / yielding to React.
 */
export async function cloneAlienPhotoFile(file: File): Promise<File> {
  let buf: ArrayBuffer;
  try {
    buf = await file.arrayBuffer();
  } catch (err) {
    const why = err instanceof Error ? err.message : 'could not read file';
    throw new Error(`Could not read photo — ${why}`);
  }
  if (!buf.byteLength) throw new Error('Photo file is empty');
  const name = file.name || 'photo.jpg';
  const type = file.type || 'application/octet-stream';
  return new File([buf], name, { type, lastModified: file.lastModified || Date.now() });
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function postJson(
  url: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const why = err instanceof Error ? err.message : 'network error';
    /* Safari often reports gateway kills as bare "Load failed". */
    const tip =
      /load failed|failed to fetch|networkerror/i.test(why)
        ? ' (server timed out or dropped — retrying helps)'
        : '';
    return {
      ok: false,
      status: 0,
      json: { error: `Connection failed — ${why}${tip}` },
    };
  }
  const text = await res.text();
  let json: Record<string, unknown> = {};
  if (text) {
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      /* Amplify/gateway HTML or plain text on 413/502 */
    }
  }
  if (!res.ok && res.status !== 202 && typeof json.error !== 'string') {
    if (res.status === 413) json.error = 'Photo too large for upload';
    else if (res.status === 402) json.error = 'Character generation payment required';
    else if (
      res.status === 403 &&
      /could not be satisfied|request blocked/i.test(text)
    ) {
      json.error = 'Upload blocked by CDN (request too large)';
    } else if (res.status >= 500) {
      json.error =
        text && text.length < 280 && !text.trim().startsWith('<')
          ? text.trim()
          : `Server error (${res.status}) — try again`;
    } else if (text && text.length < 280 && !text.trim().startsWith('<')) {
      json.error = text.trim();
    } else json.error = `Request failed (${res.status})`;
  }
  if (
    !res.ok &&
    res.status !== 202 &&
    json.code === 'payment_required' &&
    typeof json.error === 'string'
  ) {
    json.error = `${json.error} (payment_required)`;
  }
  return { ok: res.ok || res.status === 202, status: res.status, json };
}

function isTransientPostFailure(result: {
  ok: boolean;
  status: number;
  json: Record<string, unknown>;
}): boolean {
  if (result.ok) return false;
  if (result.status === 0) return true;
  if (result.status === 502 || result.status === 503 || result.status === 504) return true;
  const err = typeof result.json.error === 'string' ? result.json.error : '';
  return /connection failed|load failed|failed to fetch|timed out|gateway/i.test(err);
}

/** Compose / video can die on Amplify ~30s gateway kills — retry a few times. */
async function postJsonRetry(
  url: string,
  body: Record<string, unknown>,
  attempts = 3
): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
  let last = await postJson(url, body);
  for (let i = 1; i < attempts && isTransientPostFailure(last); i++) {
    await new Promise((r) => setTimeout(r, 800 * i));
    last = await postJson(url, body);
  }
  return last;
}

/**
 * Chunk through the API. arells.com WAF caps bodies at 8KB; Amplify also
 * rejects ~1MB+. S3 browser PUT needs bucket CORS (often missing).
 */
async function uploadAlienSelfieJpeg(
  email: string,
  assetId: string,
  jpeg: Blob,
  onProgress?: AlienCreateProgressFn
): Promise<void> {
  const report = (n: number) => onProgress?.(clampProgress(n));
  const begin = await postJson('/api/user/alien-photo', {
    email,
    asset: assetId,
    action: 'begin',
  });
  const uploadId =
    typeof begin.json.uploadId === 'string' ? begin.json.uploadId : '';
  if (!begin.ok || !uploadId) {
    throw new Error(
      typeof begin.json.error === 'string' ? begin.json.error : 'Upload failed to start'
    );
  }

  /* First visible % — only after upload has actually started. */
  report(8);
  const b64 = await blobToBase64(jpeg);
  if (!b64) throw new Error('Could not encode photo');
  const parts = Math.max(1, Math.ceil(b64.length / CHUNK_BASE64_CHARS));
  for (let i = 0; i < parts; i++) {
    const data = b64.slice(i * CHUNK_BASE64_CHARS, (i + 1) * CHUNK_BASE64_CHARS);
    report(8 + ((i + 1) / parts) * 10);
    const chunk = await postJson('/api/user/alien-photo', {
      email,
      asset: assetId,
      action: 'chunk',
      uploadId,
      index: i,
      data,
    });
    if (!chunk.ok) {
      throw new Error(
        typeof chunk.json.error === 'string'
          ? chunk.json.error
          : `Upload failed (chunk ${i + 1}/${parts})`
      );
    }
  }

  report(19);
  const commit = await postJson('/api/user/alien-photo', {
    email,
    asset: assetId,
    action: 'commit',
    uploadId,
    parts,
  });
  if (!commit.ok) {
    throw new Error(
      typeof commit.json.error === 'string' ? commit.json.error : 'Upload failed to finish'
    );
  }
  report(20);
}

/**
 * Upload selfie, arm job, then either:
 * - worker driver: poll until complete (Grok runs on a long-timeout Lambda)
 * - client driver: browser calls compose/videos (local / no worker configured)
 */
export async function composeAlienFromPhoto(args: {
  email: string;
  assetId: string;
  file: File;
  shareId?: string | null;
  onProgress?: AlienCreateProgressFn;
}): Promise<AlienComposeResult> {
  const { email, assetId, shareId, onProgress } = args;

  try {
    /* No % yet — only show after upload begin succeeds. */
    const file = await cloneAlienPhotoFile(args.file);
    const jpeg = await withTimeout(
      fileToUploadJpegBlob(file),
      90_000,
      'Could not process photo — try a smaller JPEG'
    );
    await uploadAlienSelfieJpeg(email, assetId, jpeg, onProgress);
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Failed to Upload Photo';
    const message =
      !raw || raw === 'Load failed' || raw === 'Failed to fetch'
        ? `Photo upload failed — ${raw || 'unknown error'}`
        : raw;
    throw new AlienCreateStageError(message, 'upload');
  }

  onProgress?.(20);
  const arm = await postJson('/api/user/alien-generate', {
    email,
    asset: assetId,
    force: true,
    action: 'arm',
  });
  if (!arm.ok) {
    throw new Error(
      typeof arm.json.error === 'string'
        ? arm.json.error
        : 'Character generation failed to start'
    );
  }
  const armJob =
    arm.json.job && typeof arm.json.job === 'object'
      ? (arm.json.job as AlienGenerateJobClient)
      : null;
  const startedAt =
    typeof armJob?.startedAt === 'string' && armJob.startedAt.trim()
      ? armJob.startedAt.trim()
      : null;
  const useWorker = Boolean(arm.json.worker) || armJob?.driver === 'worker';

  if (useWorker) {
    return awaitAlienGenerateJob({
      email,
      assetId,
      shareId,
      initialJob: armJob,
      onProgress,
    });
  }

  return runAlienGeneratePipeline({ email, assetId, shareId, startedAt, onProgress });
}
