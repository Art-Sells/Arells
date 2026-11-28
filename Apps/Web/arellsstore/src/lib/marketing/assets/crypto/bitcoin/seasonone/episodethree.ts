import type { TrailerSources } from '../../../../../videoPlayer';

const EPISODE_THREE_S3_BASE =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/episode3';

export const EPISODE_THREE_POSTER = `${EPISODE_THREE_S3_BASE}/TBARS1E3Preview.jpg`;

export const EPISODE_THREE_SOURCES: TrailerSources = {
  '480': `${EPISODE_THREE_S3_BASE}/TheBitcoinAlienRaceS1E3(480p).mp4`,
  '720': `${EPISODE_THREE_S3_BASE}/TheBitcoinAlienRaceS1E3(720p).mp4`,
  // TEMP: 1080p still uploading — point at 720p. Restore to the 1080p file once it finishes.
  '1080': `${EPISODE_THREE_S3_BASE}/TheBitcoinAlienRaceS1E3(720p).mp4`,
};
