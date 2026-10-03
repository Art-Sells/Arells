import { GUEST_TRAILER_SOURCES } from './marketing/assets/crypto/bitcoin/videos';

export type TrailerSources = {
  '480': string;
  '720': string;
  '1080': string;
};

export type GuestTrailerQuality = 'auto' | '480' | '720' | '1080';

export const GUEST_TRAILER_QUALITY_OPTIONS: { id: GuestTrailerQuality; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: '480', label: '480p' },
  { id: '720', label: '720p' },
  { id: '1080', label: '1080p' },
];

export function trailerSrcForQuality(
  quality: GuestTrailerQuality,
  sources: TrailerSources = GUEST_TRAILER_SOURCES
): string {
  if (quality === 'auto') return sources['720'];
  return sources[quality];
}

export function guestTrailerSrcForQuality(quality: GuestTrailerQuality): string {
  return trailerSrcForQuality(quality, GUEST_TRAILER_SOURCES);
}
