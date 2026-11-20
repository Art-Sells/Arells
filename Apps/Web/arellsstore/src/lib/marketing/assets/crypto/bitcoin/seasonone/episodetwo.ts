import type { TrailerSources } from '../../../../../videoPlayer';

const EPISODE_TWO_S3_BASE =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/episode2';

export const EPISODE_TWO_POSTER = `${EPISODE_TWO_S3_BASE}/TBARS1E2Preview.jpg`;

export const EPISODE_TWO_SOURCES: TrailerSources = {
  '480': `${EPISODE_TWO_S3_BASE}/TheBitcoinAlienRaceS1E2(480p)c.mp4`,
  '720': `${EPISODE_TWO_S3_BASE}/TheBitcoinAlienRaceS1E2(720p)c.mp4`,
  '1080': `${EPISODE_TWO_S3_BASE}/TheBitcoinAlienRaceS1E2(1080p)c.mp4`,
};
