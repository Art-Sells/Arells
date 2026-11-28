import type { TrailerSources } from '../../../../../videoPlayer';

const EPISODE_THREE_S3_BASE =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/episode3';

export const EPISODE_THREE_POSTER = `${EPISODE_THREE_S3_BASE}/TBARS1E3Preview.jpg`;

export const EPISODE_THREE_SOURCES: TrailerSources = {
  '480': `${EPISODE_THREE_S3_BASE}/TheBitcoinAlienRaceS1E3(480p)c.mp4`,
  '720': `${EPISODE_THREE_S3_BASE}/TheBitcoinAlienRaceS1E3(720p)c.mp4`,
  '1080': `${EPISODE_THREE_S3_BASE}/TheBitcoinAlienRaceS1E3(1080p)c.mp4`,
};
