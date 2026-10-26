import { normalizeEmailKey } from '../auth/normalize';

export const ALIEN_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const ALIEN_PHOTO_ASSETS = new Set(['bitcoin']);
export const ALIEN_REPLACE_LIMIT_PER_MONTH = 4;

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

/** Monthly replace quota: { month: "YYYY-MM", count: number }. */
export function alienQuotaKey(email: string, asset: string): string {
  return `users/${normalizeEmailKey(email)}/aliens/${asset}-quota.json`;
}

export type AlienPhotoKind = 'selfie' | 'composed' | 'portrait' | 'seasonone';

export function normalizeAlienPhotoKind(raw: unknown): AlienPhotoKind {
  if (typeof raw !== 'string') return 'selfie';
  const kind = raw.trim().toLowerCase();
  if (kind === 'composed' || kind === 'metaposter') return 'composed';
  if (kind === 'portrait') return 'portrait';
  if (kind === 'seasonone' || kind === 'season-one') return 'seasonone';
  return 'selfie';
}

export function alienPhotoObjectKey(email: string, asset: string, kind: AlienPhotoKind = 'selfie'): string {
  if (kind === 'composed') return alienComposedKey(email, asset);
  if (kind === 'portrait') return alienPortraitKey(email, asset);
  if (kind === 'seasonone') return alienSeasonOneKey(email, asset);
  return alienPhotoKey(email, asset);
}

export type AlienQuotaState = {
  month: string;
  count: number;
  limit: number;
  remaining: number;
  exhausted: boolean;
  /** e.g. "October" — the next calendar month name when exhausted */
  nextMonthLabel: string;
};

export function currentQuotaMonthKey(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function nextCalendarMonthLabel(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return d.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
}

export function normalizeQuotaRecord(
  raw: unknown,
  now = new Date()
): { month: string; count: number } {
  const month = currentQuotaMonthKey(now);
  if (!raw || typeof raw !== 'object') {
    return { month, count: 0 };
  }
  const rec = raw as { month?: unknown; count?: unknown };
  const storedMonth = typeof rec.month === 'string' ? rec.month : '';
  const storedCount = typeof rec.count === 'number' && Number.isFinite(rec.count) ? rec.count : 0;
  if (storedMonth !== month) {
    return { month, count: 0 };
  }
  return { month, count: Math.max(0, Math.floor(storedCount)) };
}

export function toAlienQuotaState(
  record: { month: string; count: number },
  now = new Date()
): AlienQuotaState {
  const limit = ALIEN_REPLACE_LIMIT_PER_MONTH;
  const count = record.count;
  const remaining = Math.max(0, limit - count);
  return {
    month: record.month,
    count,
    limit,
    remaining,
    exhausted: remaining <= 0,
    nextMonthLabel: nextCalendarMonthLabel(now),
  };
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
