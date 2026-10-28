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

/** Personalized launch / share metaposter after compose. */
export function alienComposedKey(email: string, asset: string): string {
  return `users/${normalizeEmailKey(email)}/aliens/${asset}-composed`;
}

/** Personalized SEASON ONE banner after compose. */
export function alienSeasonOneKey(email: string, asset: string): string {
  return `users/${normalizeEmailKey(email)}/aliens/${asset}-seasonone`;
}

/** Wide 2:1 Personal Bitcoin Alien portrait. */
export function alienPortraitKey(email: string, asset: string): string {
  return `users/${normalizeEmailKey(email)}/aliens/${asset}-portrait`;
}

/** Personalized metaposter / guest loop (image-to-video). */
export function alienMetaloopKey(email: string, asset: string): string {
  return `users/${normalizeEmailKey(email)}/aliens/${asset}-metaloop.mp4`;
}

/** Personalized Season One banner loop (image-to-video). */
export function alienSeasonOneLoopKey(email: string, asset: string): string {
  return `users/${normalizeEmailKey(email)}/aliens/${asset}-seasonone-loop.mp4`;
}

export type AlienPhotoKind =
  | 'selfie'
  | 'composed'
  | 'portrait'
  | 'seasonone'
  | 'metaloop'
  | 'seasononeloop';

export function normalizeAlienPhotoKind(raw: unknown): AlienPhotoKind {
  if (typeof raw !== 'string') return 'selfie';
  const kind = raw.trim().toLowerCase();
  if (kind === 'composed' || kind === 'metaposter' || kind === 'guestposter') return 'composed';
  if (kind === 'portrait') return 'portrait';
  if (kind === 'seasonone' || kind === 'season-one') return 'seasonone';
  if (kind === 'metaloop' || kind === 'guestloop') return 'metaloop';
  if (kind === 'seasononeloop' || kind === 'seasonone-loop' || kind === 'season-one-loop') {
    return 'seasononeloop';
  }
  return 'selfie';
}

export function isAlienVideoKind(kind: AlienPhotoKind): boolean {
  return kind === 'metaloop' || kind === 'seasononeloop';
}

export function alienPhotoObjectKey(email: string, asset: string, kind: AlienPhotoKind = 'selfie'): string {
  if (kind === 'composed') return alienComposedKey(email, asset);
  if (kind === 'portrait') return alienPortraitKey(email, asset);
  if (kind === 'seasonone') return alienSeasonOneKey(email, asset);
  if (kind === 'metaloop') return alienMetaloopKey(email, asset);
  if (kind === 'seasononeloop') return alienSeasonOneLoopKey(email, asset);
  return alienPhotoKey(email, asset);
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
