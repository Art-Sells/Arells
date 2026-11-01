import { ALIEN_COMPOSE_DONE_EVENT } from '../assets/assetSharePath';
import { clearPaidCreditPending } from './characterGenerationPay';

/** Match server identity prep; keeps JSON upload well under API/body limits. */
const UPLOAD_MAX_EDGE = 1600;
const UPLOAD_JPEG_QUALITY = 0.85;
/** Raw base64 JSON must stay under alien-photo bodyParser (~7mb) + server 5MB decode. */
const UPLOAD_MAX_DATA_URL_CHARS = 6.5 * 1024 * 1024;

/** File picker accept — iPhone HEIC included; everything is re-encoded to JPEG before upload. */
export const ALIEN_PHOTO_ACCEPT =
  'image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.heic,.heif';

function isHeicLike(file: File): boolean {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return (
    type.includes('heic') ||
    type.includes('heif') ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  );
}

/**
 * iPhone camera rolls often store HEIC. Convert to JPEG so canvas / Grok can use it.
 * Safari sometimes already hands us a JPEG — then this is a no-op.
 */
async function heicToJpegFile(file: File): Promise<File> {
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
  const base = (file.name || 'photo').replace(/\.(heic|heif)$/i, '') || 'photo';
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
}

async function ensureDecodableImageFile(file: File): Promise<File> {
  if (!isHeicLike(file)) return file;
  try {
    return await heicToJpegFile(file);
  } catch (err) {
    console.error('HEIC convert failed', err);
    throw new Error('Could not convert iPhone photo. Try exporting as JPEG.');
  }
}

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Could not read photo'));
    };
    reader.onerror = () => reject(new Error('Could not read photo'));
    reader.readAsDataURL(file);
  });
}

function canvasToJpegDataUrl(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  quality: number
): Promise<string> {
  const scale = Math.min(1, UPLOAD_MAX_EDGE / Math.max(srcW, srcH));
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
        void fileToDataUrl(blob).then(resolve, reject);
      },
      'image/jpeg',
      quality
    );
  });
}

/** Fallback when createImageBitmap fails (some social-download / progressive JPEGs). */
function imageElementToJpegDataUrl(file: File, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      void canvasToJpegDataUrl(img, img.naturalWidth, img.naturalHeight, quality).then(resolve, reject);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not decode photo'));
    };
    img.src = url;
  });
}

/**
 * Resize + JPEG-compress before upload. Filename is never sent — only pixels.
 * HEIC/HEIF (iPhone) is converted first; then everything is re-encoded to JPEG.
 * Social / CDN downloads often fail createImageBitmap or are too large as raw
 * base64; we always re-encode and never upload the original file.
 */
async function fileToUploadDataUrl(file: File): Promise<string> {
  const source = await ensureDecodableImageFile(file);
  let dataUrl: string | null = null;
  let quality = UPLOAD_JPEG_QUALITY;

  try {
    const bitmap = await createImageBitmap(source);
    try {
      dataUrl = await canvasToJpegDataUrl(bitmap, bitmap.width, bitmap.height, quality);
    } finally {
      bitmap.close();
    }
  } catch {
    dataUrl = await imageElementToJpegDataUrl(source, quality);
  }

  // Shrink further if still too big for the JSON body limit.
  while (dataUrl.length > UPLOAD_MAX_DATA_URL_CHARS && quality > 0.45) {
    quality = Math.max(0.45, quality - 0.15);
    try {
      const bitmap = await createImageBitmap(source);
      try {
        dataUrl = await canvasToJpegDataUrl(bitmap, bitmap.width, bitmap.height, quality);
      } finally {
        bitmap.close();
      }
    } catch {
      dataUrl = await imageElementToJpegDataUrl(source, quality);
    }
  }

  if (dataUrl.length > UPLOAD_MAX_DATA_URL_CHARS) {
    throw new Error('Photo is too large after compression');
  }
  return dataUrl;
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
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok || res.status === 202, status: res.status, json };
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
  const data = await withTimeout(
    fileToUploadDataUrl(file),
    90_000,
    'Could not process photo — try a smaller JPEG'
  );

  const upload = await postJson('/api/user/alien-photo', { email, asset: assetId, data });
  if (!upload.ok) {
    throw new Error(
      typeof upload.json.error === 'string' ? upload.json.error : 'Upload failed'
    );
  }

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
    await postJson('/api/user/alien-generate', {
      email,
      asset: assetId,
      action: 'phase',
      phase: 'compose',
    });

    const compose = await postJson('/api/user/alien-compose', {
      email,
      asset: assetId,
    });
    if (!compose.ok) {
      throw new Error(
        typeof compose.json.error === 'string' ? compose.json.error : 'Compose failed'
      );
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
