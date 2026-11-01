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
const CHUNK_BASE64_CHARS = 450_000;

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
  metaloop: boolean;
  seasononeloop: boolean;
};

const GENERATE_POLL_MS = 2000;
/** Hard cap so a wedged job can't leave the UI spinning for a quarter hour. */
const GENERATE_POLL_MAX_MS = 8 * 60 * 1000;
/**
 * Treat “running” jobs older than this as dead for remote-resume attach.
 * Must cover a full client-driven compose + both loops (Amplify has no background work).
 */
export const ALIEN_GENERATE_STALE_MS = 8 * 60 * 1000;

export type AlienGenerateJobClient = {
  status?: 'running' | 'complete' | 'error';
  phase?: string;
  metaloop?: boolean;
  seasononeloop?: boolean;
  error?: string;
  startedAt?: string;
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

async function loadComposeResultFromJob(
  assetId: string,
  shareId: string | null | undefined,
  job: AlienGenerateJobClient
): Promise<AlienComposeResult> {
  const bust = `&t=${Date.now()}`;
  const [portraitRes, metaRes, loopRes] = await Promise.all([
    fetch(`/api/user/alien-photo?asset=${encodeURIComponent(assetId)}&kind=portrait${bust}`, {
      credentials: 'include',
      cache: 'no-store',
    }),
    fetch(`/api/user/alien-photo?asset=${encodeURIComponent(assetId)}&kind=composed${bust}`, {
      credentials: 'include',
      cache: 'no-store',
    }),
    fetch(`/api/user/alien-photo?asset=${encodeURIComponent(assetId)}&kind=metaloop${bust}`, {
      credentials: 'include',
      cache: 'no-store',
    }),
  ]);
  if (!portraitRes.ok || !metaRes.ok) {
    throw new Error('Could not load generated images');
  }
  const [portraitBlob, metaBlob] = await Promise.all([portraitRes.blob(), metaRes.blob()]);
  const loopBlob = loopRes.ok ? await loopRes.blob() : null;

  if (typeof window !== 'undefined') {
    clearPaidCreditPending(assetId);
    window.dispatchEvent(
      new CustomEvent(ALIEN_COMPOSE_DONE_EVENT, {
        detail: {
          assetId,
          shareId,
          at: Date.now(),
          metaloop: Boolean(job.metaloop && loopBlob),
          seasononeloop: Boolean(job.seasononeloop),
        },
      })
    );
  }

  return {
    portraitBlob,
    metaBlob,
    loopBlob,
    metaloop: Boolean(job.metaloop && loopBlob),
    seasononeloop: Boolean(job.seasononeloop),
  };
}

/** Poll an already-started server job until complete/error (other tab / browser resume). */
export async function awaitAlienGenerateJob(args: {
  email: string;
  assetId: string;
  shareId?: string | null;
  initialJob?: AlienGenerateJobClient | null;
}): Promise<AlienComposeResult> {
  const { email, assetId, shareId } = args;
  const deadline = Date.now() + GENERATE_POLL_MAX_MS;
  let job: AlienGenerateJobClient | null = args.initialJob ?? null;

  while (Date.now() < deadline) {
    if (job?.status === 'complete' || job?.status === 'error') break;
    await sleep(GENERATE_POLL_MS);
    job = await fetchAlienGenerateJob(email, assetId);
  }

  if (!job || job.status === 'running') {
    throw new Error('Character generation timed out — check back in a minute');
  }
  if (job.status === 'error') {
    throw new Error(job.error || 'Character generation failed');
  }
  return loadComposeResultFromJob(assetId, shareId, job);
}

/**
 * iOS Safari can invalidate File blobs when the <input type="file"> is cleared.
 * Copy bytes into a new File before resetting the input / yielding to React.
 */
export async function cloneAlienPhotoFile(file: File): Promise<File> {
  const buf = await file.arrayBuffer();
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
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
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
    else if (res.status >= 500) json.error = 'Upload server error — try again';
  }
  return { ok: res.ok || res.status === 202, status: res.status, json };
}

/**
 * Always chunk through the API — Amplify rejects ~1MB+ bodies, and S3 browser
 * PUT needs bucket CORS (often missing). Each chunk stays well under 1MB.
 */
async function uploadAlienSelfieJpeg(
  email: string,
  assetId: string,
  jpeg: Blob
): Promise<void> {
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

  const b64 = await blobToBase64(jpeg);
  if (!b64) throw new Error('Could not encode photo');
  const parts = Math.max(1, Math.ceil(b64.length / CHUNK_BASE64_CHARS));
  for (let i = 0; i < parts; i++) {
    const data = b64.slice(i * CHUNK_BASE64_CHARS, (i + 1) * CHUNK_BASE64_CHARS);
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
}

/**
 * Upload selfie, then run compose + loops from the browser (Amplify-safe).
 *
 * Amplify kills work after the HTTP response (no Vercel waitUntil), so the old
 * fire-and-forget /api/user/alien-generate pipeline left jobs stuck "running"
 * forever — infinite "Creating character", photo never applied until reload.
 */
export async function composeAlienFromPhoto(args: {
  email: string;
  assetId: string;
  file: File;
  shareId?: string | null;
}): Promise<AlienComposeResult> {
  const { email, assetId, shareId } = args;
  const file = await cloneAlienPhotoFile(args.file);
  const jpeg = await withTimeout(
    fileToUploadJpegBlob(file),
    90_000,
    'Could not process photo — try a smaller JPEG'
  );

  await uploadAlienSelfieJpeg(email, assetId, jpeg);

  /* Arm job for cross-tab status — do NOT start server background work. */
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

  const failJob = async (message: string) => {
    await postJson('/api/user/alien-generate', {
      email,
      asset: assetId,
      action: 'fail',
      error: message,
    }).catch(() => undefined);
  };

  try {
    /* One Grok still per request — Amplify kills API routes around ~30s. */
    await postJson('/api/user/alien-generate', {
      email,
      asset: assetId,
      action: 'phase',
      phase: 'compose',
    });
    for (const mode of ['meta', 'seasonone', 'portrait'] as const) {
      const compose = await postJson('/api/user/alien-compose', {
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

    await postJson('/api/user/alien-generate', {
      email,
      asset: assetId,
      action: 'phase',
      phase: 'seasononeloop',
    });
    const season = await postJson('/api/user/alien-videos', {
      email,
      asset: assetId,
      kinds: ['seasononeloop'],
    });
    const seasonOk = Boolean(season.ok && season.json.seasononeloop);

    await postJson('/api/user/alien-generate', {
      email,
      asset: assetId,
      action: 'phase',
      phase: 'metaloop',
      seasononeloop: seasonOk,
    });
    const metaloop = await postJson('/api/user/alien-videos', {
      email,
      asset: assetId,
      kinds: ['metaloop'],
    });
    const metaloopOk = Boolean(metaloop.ok && metaloop.json.metaloop);

    const finalize = await postJson('/api/user/alien-generate', {
      email,
      asset: assetId,
      action: 'finalize',
      metaloop: metaloopOk,
      seasononeloop: seasonOk,
    });
    const job =
      finalize.json.job && typeof finalize.json.job === 'object'
        ? (finalize.json.job as AlienGenerateJobClient)
        : { status: 'complete' as const, metaloop: metaloopOk, seasononeloop: seasonOk };

    return loadComposeResultFromJob(assetId, shareId, job);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Character generation failed';
    await failJob(message);
    throw err;
  }
}
