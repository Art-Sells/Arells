export const GUEST_TRAILER_POSTER =
  '/images/banners/assets/crypto/Bitcoin/guest-trailer-poster.jpg';

export type TrailerSources = {
  '480': string;
  '720': string;
  '1080': string;
};

const GUEST_TRAILER_S3_BASE =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/GuestLandingPages';

const SIGNED_IN_TRAILER_S3_BASE =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn';

export const GUEST_TRAILER_SOURCES: TrailerSources = {
  '480': `${GUEST_TRAILER_S3_BASE}/TheBitcoinAlienRace(GuestLandingPagesTrailer)480.mp4`,
  '720': `${GUEST_TRAILER_S3_BASE}/TheBitcoinAlienRace(GuestLandingPagesTrailer)720.mp4`,
  '1080': `${GUEST_TRAILER_S3_BASE}/TheBitcoinAlienRace(GuestLandingPagesTrailer)1080.mp4`,
};

export const SIGNED_IN_TRAILER_SOURCES: TrailerSources = {
  '480': `${SIGNED_IN_TRAILER_S3_BASE}/TheBitcoinAlienRace(SignedInTrailer)480.mp4`,
  '720': `${SIGNED_IN_TRAILER_S3_BASE}/TheBitcoinAlienRace(SignedInTrailer)720.mp4`,
  '1080': `${SIGNED_IN_TRAILER_S3_BASE}/TheBitcoinAlienRace(SignedInTrailer)1080.mp4`,
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
