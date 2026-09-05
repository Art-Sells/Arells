export const GUEST_TRAILER_POSTER =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/GuestLandingPages/PremierTrailerPreview.jpg';

export const SIGNED_IN_TRAILER_POSTER =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/PremierTrailerPreview.jpg';

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
  '480': `${GUEST_TRAILER_S3_BASE}/TheBitcoinAlienRace(PremierTrailer)(Guest)480p.mp4`,
  '720': `${GUEST_TRAILER_S3_BASE}/TheBitcoinAlienRace(PremierTrailer)(Guest)720p.mp4`,
  '1080': `${GUEST_TRAILER_S3_BASE}/TheBitcoinAlienRace(PremierTrailer)(Guest)1080p.mp4`,
};

export const SIGNED_IN_TRAILER_SOURCES: TrailerSources = {
  '480': `${SIGNED_IN_TRAILER_S3_BASE}/TheBitcoinAlienRace(PremierTrailer)480p.mp4`,
  '720': `${SIGNED_IN_TRAILER_S3_BASE}/TheBitcoinAlienRace(PremierTrailer)720p.mp4`,
  '1080': `${SIGNED_IN_TRAILER_S3_BASE}/TheBitcoinAlienRace(PremierTrailer)1080p.mp4`,
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
