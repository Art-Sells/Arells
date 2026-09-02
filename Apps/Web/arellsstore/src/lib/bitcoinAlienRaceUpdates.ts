export const ALIEN_RACE_UPDATES_PREFIX = 'marketing/assets/crypto/bitcoin/Updates/';
export const ALIEN_RACE_UPDATES_PAGE_SIZE = 6;
export const ALIEN_RACE_DATE_FOLDER_RE = /^(\d{2})\.(\d{2})\.(\d{2})$/;

export type AlienRaceMediaKind = 'image' | 'video';

export type AlienRaceMedia = {
  key: string;
  url: string;
  name: string;
  kind: AlienRaceMediaKind;
  previewUrl?: string;
  sources?: {
    '480': string;
    '720': string;
    '1080': string;
  };
};

export type AlienRaceDay = {
  folder: string;
  label: string;
  images: AlienRaceMedia[];
  media: AlienRaceMedia[];
};

const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const VIDEO_EXT = new Set(['mp4', 'webm', 'mov']);

export function fileKind(name: string): AlienRaceMediaKind | null {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (IMAGE_EXT.has(ext)) return 'image';
  if (VIDEO_EXT.has(ext)) return 'video';
  return null;
}

export function parseAlienRaceFolder(folder: string): { year: number; month: number; day: number } | null {
  const match = folder.match(ALIEN_RACE_DATE_FOLDER_RE);
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = 2000 + Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null;
  }
  return { year, month, day };
}

export function formatAlienRaceDayLabel(folder: string): string | null {
  const parsed = parseAlienRaceFolder(folder);
  if (!parsed) return null;
  const dt = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(dt);
  const mm = String(parsed.month).padStart(2, '0');
  const dd = String(parsed.day).padStart(2, '0');
  const yy = String(parsed.year).slice(-2);
  return `${weekday} ${mm}/${dd}/${yy}`;
}

export function publicS3ObjectUrl(bucket: string, region: string, key: string): string {
  const encoded = key
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `https://${bucket}.s3.${region}.amazonaws.com/${encoded}`;
}

export function visibleAlienRaceDays(days: AlienRaceDay[], visibleCount: number): AlienRaceDay[] {
  let remaining = visibleCount;
  const out: AlienRaceDay[] = [];
  for (const day of days) {
    if (remaining <= 0) break;
    if (day.media.length === 0) continue;
    const slice = day.media.slice(0, remaining);
    remaining -= slice.length;
    out.push({ ...day, media: slice, images: slice.filter((item) => item.kind === 'image') });
  }
  return out;
}

export function alienRaceThumbCount(days: AlienRaceDay[]): number {
  return days.reduce((sum, day) => sum + day.media.length, 0);
}

const VIDEO_QUALITY_PAREN_RE = /^(.+?)\((480|720|1080)p?\)(\.[^.]+)$/i;
const VIDEO_QUALITY_SUFFIX_RE = /^(.+?)(480|720|1080)p?(\.[^.]+)$/i;

export function parseVideoQualityName(
  name: string
): { base: string; quality: '480' | '720' | '1080'; ext: string } | null {
  const file = name.split('/').filter(Boolean).pop() || name;
  const match = file.match(VIDEO_QUALITY_PAREN_RE) || file.match(VIDEO_QUALITY_SUFFIX_RE);
  if (!match) return null;
  const quality = match[2] as '480' | '720' | '1080';
  return { base: `${match[1]}${match[3]}`.toLowerCase(), quality, ext: match[3] };
}

function fillVideoSources(
  parts: Partial<Record<'480' | '720' | '1080', string>>,
  fallback: string
) {
  const mid = parts['720'] || parts['1080'] || parts['480'] || fallback;
  return {
    '480': parts['480'] || mid,
    '720': parts['720'] || mid,
    '1080': parts['1080'] || mid,
  };
}

function isPreviewPath(name: string): boolean {
  const parts = name.split('/').filter(Boolean);
  return parts.length > 1 && parts[0].toLowerCase() === 'previews';
}

function isPreviewAsset(name: string): boolean {
  if (isPreviewPath(name)) return true;
  const file = name.split('/').filter(Boolean).pop() || name;
  return /preview\.(jpe?g|png|webp|gif)$/i.test(file);
}

function normalizePairingKey(key: string): string {
  return key.replace(/peak/g, 'peek');
}

function pairingKey(name: string): string {
  const file = name.split('/').filter(Boolean).pop() || name;
  const stem = file.replace(/\.[^.]+$/, '').toLowerCase();
  return normalizePairingKey(stem.replace(/characterprofile.*$/i, '').replace(/preview$/i, ''));
}

function videoPairingKey(name: string): string | null {
  const parsed = parseVideoQualityName(name);
  if (!parsed) return null;
  return normalizePairingKey(parsed.base.replace(/\.[^.]+$/, ''));
}

/** Collapse 480/720/1080 files of the same video into one player, like the trailer. */
export function groupAlienRaceMedia(files: AlienRaceMedia[]): AlienRaceMedia[] {
  const previewByKey = new Map<string, string>();
  for (const item of files) {
    if (item.kind !== 'image' || !isPreviewAsset(item.name)) continue;
    previewByKey.set(pairingKey(item.name), item.url);
  }

  const images: { item: AlienRaceMedia; order: number }[] = [];
  const ungrouped: { item: AlienRaceMedia; order: number }[] = [];
  const groups = new Map<
    string,
    { parts: Partial<Record<'480' | '720' | '1080', AlienRaceMedia>>; order: number }
  >();

  files.forEach((item, index) => {
    if (isPreviewAsset(item.name)) return;
    if (item.kind !== 'video') {
      const previewUrl = previewByKey.get(pairingKey(item.name));
      images.push({ item: previewUrl ? { ...item, previewUrl } : item, order: index });
      return;
    }
    const parsed = parseVideoQualityName(item.name);
    if (!parsed) {
      ungrouped.push({ item, order: index });
      return;
    }
    const existing = groups.get(parsed.base) || { parts: {}, order: index };
    existing.parts[parsed.quality] = item;
    groups.set(parsed.base, existing);
  });

  const grouped: { item: AlienRaceMedia; order: number }[] = [];
  for (const [, group] of groups) {
    const chosen = group.parts['720'] || group.parts['1080'] || group.parts['480']!;
    const urls: Partial<Record<'480' | '720' | '1080', string>> = {};
    (['480', '720', '1080'] as const).forEach((q) => {
      if (group.parts[q]) urls[q] = group.parts[q]!.url;
    });
    const previewKey = videoPairingKey(chosen.name);
    const previewUrl = previewKey ? previewByKey.get(previewKey) : undefined;
    grouped.push({
      order: group.order,
      item: {
        ...chosen,
        key: Object.values(group.parts)
          .map((part) => part.key)
          .sort()
          .join('|'),
        sources: fillVideoSources(urls, chosen.url),
        ...(previewUrl ? { previewUrl } : {}),
      },
    });
  }

  return [...images, ...ungrouped, ...grouped]
    .sort((a, b) => a.order - b.order)
    .map((entry) => entry.item);
}
