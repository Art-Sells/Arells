import { getServerS3 } from '../server/awsS3';
import {
  buildLeaderboardRows,
  buildPortfolioMePayload,
  type LeaderboardRow,
  type PortfolioMePayload,
} from './referralShares';

export async function fetchPortfolioMeServer(
  email: string,
  _origin?: string
): Promise<PortfolioMePayload | null> {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) return null;
  try {
    const s3 = getServerS3();
    return await buildPortfolioMePayload(s3, bucket, email);
  } catch {
    return null;
  }
}

export async function fetchPortfolioLeaderboardServer(): Promise<LeaderboardRow[] | null> {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) return null;
  try {
    const s3 = getServerS3();
    return await buildLeaderboardRows(s3, bucket);
  } catch {
    return null;
  }
}

export type { LeaderboardRow, PortfolioMePayload };
