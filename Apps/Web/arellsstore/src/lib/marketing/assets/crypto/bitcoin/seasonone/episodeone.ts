import type { TrailerSources } from '../../../../../videoPlayer';

const EPISODE_ONE_S3_BASE =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/episode1';

export const EPISODE_ONE_POSTER = `${EPISODE_ONE_S3_BASE}/TBARS1E1Preview.jpg`;

export const EPISODE_ONE_SOURCES: TrailerSources = {
  '480': `${EPISODE_ONE_S3_BASE}/TheBitcoinAlienRaceS1E1(480p).mp4`,
  '720': `${EPISODE_ONE_S3_BASE}/TheBitcoinAlienRaceS1E1(720p).mp4`,
  '1080': `${EPISODE_ONE_S3_BASE}/TheBitcoinAlienRaceS1E1(1080p).mp4`,
};
