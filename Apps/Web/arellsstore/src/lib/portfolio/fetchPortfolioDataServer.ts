import { getMetricsPageActivity } from '../metrics/pageActivityCache';
import { getServerS3 } from '../server/awsS3';
import {
  getPortfolioContextSnapshot,
  leaderboardFromSnapshot,
  portfolioMeFromSnapshot,
} from './portfolioContextSnapshot';
import type { LeaderboardRow, PortfolioMePayload } from './referralShares';

export async function fetchPortfolioMeServer(
  email: string,
  _origin?: string
): Promise<PortfolioMePayload | null> {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) return null;
  try {
    const s3 = getServerS3();
    const [snapshot, activity] = await Promise.all([
      getPortfolioContextSnapshot(s3, bucket),
      getMetricsPageActivity(s3, bucket),
    ]);
    return portfolioMeFromSnapshot(email, snapshot, activity.wau);
  } catch {
    return null;
  }
}

export async function fetchPortfolioLeaderboardServer(): Promise<LeaderboardRow[] | null> {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) return null;
  try {
    const s3 = getServerS3();
    const snapshot = await getPortfolioContextSnapshot(s3, bucket);
    return leaderboardFromSnapshot(snapshot);
  } catch {
    return null;
  }
}

/** One snapshot read for SSR — avoids duplicate single-flight cold starts on the same request. */
export async function fetchPortfolioPageServer(email: string): Promise<{
  me: PortfolioMePayload | null;
  leaderboard: LeaderboardRow[];
}> {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) return { me: null, leaderboard: [] };
  try {
    const s3 = getServerS3();
    const [snapshot, activity] = await Promise.all([
      getPortfolioContextSnapshot(s3, bucket),
      getMetricsPageActivity(s3, bucket),
    ]);
    return {
      me: portfolioMeFromSnapshot(email, snapshot, activity.wau),
      leaderboard: leaderboardFromSnapshot(snapshot),
    };
  } catch {
    return { me: null, leaderboard: [] };
  }
}

export type { LeaderboardRow, PortfolioMePayload };
