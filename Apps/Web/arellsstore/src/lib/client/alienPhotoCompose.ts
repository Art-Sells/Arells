import { ALIEN_COMPOSE_DONE_EVENT } from '../assets/assetSharePath';

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

/**
 * Upload selfie → compose stills → generate Season One then metaloop videos.
 * Returns fresh image blobs for the UI.
 */
export async function composeAlienFromPhoto(args: {
  email: string;
  assetId: string;
  file: File;
  shareId?: string | null;
}): Promise<AlienComposeResult> {
  const { email, assetId, file, shareId } = args;
  const data = await fileToUploadDataUrl(file);

  const uploadRes = await fetch('/api/user/alien-photo', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, asset: assetId, data }),
  });
  const uploadJson = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok) {
    throw new Error(uploadJson.error || 'Upload failed');
  }

  const composeRes = await fetch('/api/user/alien-compose', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, asset: assetId, mode: 'full' }),
  });
  const composeJson = await composeRes.json().catch(() => ({}));
  if (!composeRes.ok) {
    throw new Error(composeJson.error || 'Character generation failed');
  }

  let videosJson: {
    metaloop?: boolean;
    seasononeloop?: boolean;
  } = {};
  const runVideos = async (kinds: Array<'seasononeloop' | 'metaloop'>) => {
    const videosRes = await fetch('/api/user/alien-videos', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, asset: assetId, kinds }),
    });
    const json = await videosRes.json().catch(() => ({}));
    if (!videosRes.ok) {
      console.error('alien-videos failed', kinds, json);
    } else if (json.errors?.length) {
      console.error('alien-videos partial', kinds, json.errors);
    }
    return json as typeof videosJson;
  };
  try {
    const seasonJson = await runVideos(['seasononeloop']);
    videosJson.seasononeloop = Boolean(seasonJson.seasononeloop);
    if (!videosJson.seasononeloop) {
      const retry = await runVideos(['seasononeloop']);
      videosJson.seasononeloop = Boolean(retry.seasononeloop);
    }
    const metaJson = await runVideos(['metaloop']);
    videosJson.metaloop = Boolean(metaJson.metaloop);
    if (!videosJson.metaloop) {
      const retryMeta = await runVideos(['metaloop']);
      videosJson.metaloop = Boolean(retryMeta.metaloop);
    }
  } catch (videoErr) {
    console.error('alien-videos request error', videoErr);
  }

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
    window.dispatchEvent(
      new CustomEvent(ALIEN_COMPOSE_DONE_EVENT, {
        detail: {
          assetId,
          shareId,
          at: Date.now(),
          metaloop: Boolean(videosJson.metaloop && loopBlob),
          seasononeloop: Boolean(videosJson.seasononeloop),
        },
      })
    );
  }

  return {
    portraitBlob,
    metaBlob,
    loopBlob,
    metaloop: Boolean(videosJson.metaloop && loopBlob),
    seasononeloop: Boolean(videosJson.seasononeloop),
  };
}
