import type { TrailerSources } from '../../../../guestTrailer';

const BITCOIN_MARKETING_S3_BASE =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin';

const GUEST_TRAILER_S3_BASE = `${BITCOIN_MARKETING_S3_BASE}/GuestLandingPages/season1trailer`;

export const GUEST_TRAILER_POSTER = `${GUEST_TRAILER_S3_BASE}/TrailerPreview.jpg`;

export const GUEST_TRAILER_SOURCES: TrailerSources = {
  '480': `${GUEST_TRAILER_S3_BASE}/TheBitcoinAlienRace(SeasonOne)Trailer(480p).mp4`,
  '720': `${GUEST_TRAILER_S3_BASE}/TheBitcoinAlienRace(SeasonOne)Trailer(720p).mp4`,
  '1080': `${GUEST_TRAILER_S3_BASE}/TheBitcoinAlienRace(SeasonOne)Trailer(1080p).mp4`,
};

const SIGNED_IN_TRAILER_S3_BASE = `${BITCOIN_MARKETING_S3_BASE}/SignedIn/season1/trailer`;

export const SIGNED_IN_TRAILER_POSTER = `${SIGNED_IN_TRAILER_S3_BASE}/TrailerPreview.jpg`;

export const SIGNED_IN_TRAILER_SOURCES: TrailerSources = {
  '480': `${SIGNED_IN_TRAILER_S3_BASE}/TheBitcoinAlienRace(SeasonOne)Trailer(480p).mp4`,
  '720': `${SIGNED_IN_TRAILER_S3_BASE}/TheBitcoinAlienRace(SeasonOne)Trailer(720p).mp4`,
  '1080': `${SIGNED_IN_TRAILER_S3_BASE}/TheBitcoinAlienRace(SeasonOne)Trailer(1080p).mp4`,
};
