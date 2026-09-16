import { normalizeEmailKey } from '../auth/normalize';

export const ALIEN_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const ALIEN_PHOTO_ASSETS = new Set(['bitcoin']);

export type AlienPhotoMime = 'image/jpeg' | 'image/png' | 'image/webp';

export function normalizeAlienPhotoAsset(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const asset = raw.trim().toLowerCase();
  return ALIEN_PHOTO_ASSETS.has(asset) ? asset : null;
}

export function alienPhotoKey(email: string, asset: string): string {
  return `users/${normalizeEmailKey(email)}/aliens/${asset}`;
}

export function sniffAlienPhotoMime(buf: Buffer): AlienPhotoMime | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

export function decodeAlienPhotoDataUrl(raw: unknown): Buffer | null {
  if (typeof raw !== 'string' || !raw.length) return null;
  const comma = raw.indexOf(',');
  const payload = comma >= 0 ? raw.slice(comma + 1) : raw;
  try {
    const buf = Buffer.from(payload, 'base64');
    return buf.length ? buf : null;
  } catch {
    return null;
  }
}

export function isMissingS3Object(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = 'code' in err ? String((err as { code?: unknown }).code) : '';
  const status = 'statusCode' in err ? Number((err as { statusCode?: unknown }).statusCode) : 0;
  return code === 'NoSuchKey' || code === 'NotFound' || status === 404;
}
