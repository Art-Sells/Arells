export const GUEST_TRAILER_POSTER = '/images/guest-trailer-poster.jpg';

const GUEST_TRAILER_S3_BASE =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/GuestLandingPages';

export const GUEST_TRAILER_SOURCES = {
  '480': `${GUEST_TRAILER_S3_BASE}/TheBitcoinAlienRace(GuestLandingPagesTrailer)480.mp4`,
  '720': `${GUEST_TRAILER_S3_BASE}/TheBitcoinAlienRace(GuestLandingPagesTrailer)720.mp4`,
  '1080': `${GUEST_TRAILER_S3_BASE}/TheBitcoinAlienRace(GuestLandingPagesTrailer)1080.mp4`,
} as const;

export type GuestTrailerQuality = 'auto' | '480' | '720' | '1080';

export const GUEST_TRAILER_QUALITY_OPTIONS: { id: GuestTrailerQuality; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: '480', label: '480p' },
  { id: '720', label: '720p' },
  { id: '1080', label: '1080p' },
];

export function guestTrailerSrcForQuality(quality: GuestTrailerQuality): string {
  if (quality === 'auto') return GUEST_TRAILER_SOURCES['720'];
  return GUEST_TRAILER_SOURCES[quality];
}
