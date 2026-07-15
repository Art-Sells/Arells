import type AWS from 'aws-sdk';
import { normalizeEmail } from '../auth/normalize';
import {
  PROJECTED_ENGAGEMENT_ADD_MAX,
  PROJECTED_ENGAGEMENT_ADD_MIN,
  buildPortfolioContext,
  type LeaderboardRow,
  type PortfolioMePayload,
} from './referralShares';
import {
  projectedWeeklyRangeIfAddedEngagement,
  USERS_POOL_WEEKLY_MAX,
  WAU_ACTIVATION_TARGET,
  weeklyEarningsUsdRangeFromEngagementShare,
} from './financialBenefits';
import {
  emailKeyFromEmail,
  ENGAGEMENT_ROLLING_DAYS_EXPORT,
  myInvEngagementS3Prefix,
} from './myInvestmentsEngagement';
import { maskEmailForLeaderboard } from './maskEmailForLeaderboard';
import { isUserAuthVerified } from '../metrics/listUserS3Touches';

export const PORTFOLIO_CONTEXT_SNAPSHOT_KEY = 'analytics/portfolio-context-v1/latest.json';

export type PortfolioContextSnapshot = {
  generatedAt: number;
  engagementPrefix: string;
  engagementRollingDays: number;
  wau: number;
  wauActivationTarget: number;
  usersPoolWeeklyMax: number;
  totalEngagementScore: number;
  /** emailKey → score */
  scoresByEmailKey: Record<string, number>;
  leaderboardRows: LeaderboardRow[];
};

let recomputeInFlight: Promise<PortfolioContextSnapshot> | null = null;
let debounceTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

const SNAPSHOT_DEBOUNCE_MS = 15_000;

function totalFromScores(scores: Record<string, number>): number {
  let total = 0;
  for (const score of Object.values(scores)) total += score;
  return total;
}

function isValidSnapshot(value: unknown): value is PortfolioContextSnapshot {
  if (!value || typeof value !== 'object') return false;
  const v = value as PortfolioContextSnapshot;
  return (
    typeof v.generatedAt === 'number' &&
    typeof v.wau === 'number' &&
    typeof v.totalEngagementScore === 'number' &&
    v.scoresByEmailKey != null &&
    typeof v.scoresByEmailKey === 'object' &&
    Array.isArray(v.leaderboardRows)
  );
}

export async function tryReadPortfolioContextSnapshot(
  s3: AWS.S3,
  bucket: string
): Promise<PortfolioContextSnapshot | null> {
  try {
    const obj = await s3.getObject({ Bucket: bucket, Key: PORTFOLIO_CONTEXT_SNAPSHOT_KEY }).promise();
    if (!obj.Body) return null;
    const parsed = JSON.parse(obj.Body.toString()) as unknown;
    return isValidSnapshot(parsed) ? parsed : null;
  } catch (e: unknown) {
    const err = e as { code?: string; statusCode?: number };
    if (err.code === 'NoSuchKey' || err.statusCode === 404) return null;
    console.error('[portfolio-snapshot] get', e);
    return null;
  }
}

export async function writePortfolioContextSnapshot(
  s3: AWS.S3,
  bucket: string,
  snapshot: PortfolioContextSnapshot
): Promise<void> {
  if (process.env.S3_WRITE_DISABLED === '1') return;
  await s3
    .putObject({
      Bucket: bucket,
      Key: PORTFOLIO_CONTEXT_SNAPSHOT_KEY,
      Body: JSON.stringify(snapshot),
      ContentType: 'application/json',
    })
    .promise();
}

export async function buildPortfolioContextSnapshot(
  s3: AWS.S3,
  bucket: string,
  nowMs: number = Date.now()
): Promise<PortfolioContextSnapshot> {
  const { engagementScores, wau, records } = await buildPortfolioContext(s3, bucket, nowMs);
  const scoresByEmailKey: Record<string, number> = {};
  for (const [key, score] of engagementScores.entries()) {
    scoresByEmailKey[key] = score;
  }
  const totalEngagementScore = totalFromScores(scoresByEmailKey);

  const leaderboardRows: LeaderboardRow[] = [];
  for (const record of records) {
    if (!isUserAuthVerified(record)) continue;
    const email = normalizeEmail(record.email);
    const emailKey = emailKeyFromEmail(email);
    const engagementScore = scoresByEmailKey[emailKey] ?? 0;
    const { min, max } = weeklyEarningsUsdRangeFromEngagementShare(engagementScore, totalEngagementScore);
    leaderboardRows.push({
      email,
      maskedLabel: maskEmailForLeaderboard(email),
      engagementScore,
      earningsUsdMin: min,
      earningsUsdMax: max,
    });
  }

  leaderboardRows.sort((a, b) => {
    if (b.engagementScore !== a.engagementScore) return b.engagementScore - a.engagementScore;
    if (b.earningsUsdMin !== a.earningsUsdMin) return b.earningsUsdMin - a.earningsUsdMin;
    if (b.earningsUsdMax !== a.earningsUsdMax) return b.earningsUsdMax - a.earningsUsdMax;
    return a.email.localeCompare(b.email);
  });

  return {
    generatedAt: nowMs,
    engagementPrefix: myInvEngagementS3Prefix(),
    engagementRollingDays: ENGAGEMENT_ROLLING_DAYS_EXPORT,
    wau,
    wauActivationTarget: WAU_ACTIVATION_TARGET,
    usersPoolWeeklyMax: USERS_POOL_WEEKLY_MAX,
    totalEngagementScore,
    scoresByEmailKey,
    leaderboardRows,
  };
}

/** Single-flight recompute + write. Used by cron and cold-start bootstrap. */
export async function recomputePortfolioContextSnapshot(
  s3: AWS.S3,
  bucket: string,
  nowMs: number = Date.now()
): Promise<PortfolioContextSnapshot> {
  if (recomputeInFlight) return recomputeInFlight;
  recomputeInFlight = (async () => {
    const snapshot = await buildPortfolioContextSnapshot(s3, bucket, nowMs);
    try {
      await writePortfolioContextSnapshot(s3, bucket, snapshot);
    } catch (e) {
      console.error('[portfolio-snapshot] put', e);
    }
    return snapshot;
  })();
  try {
    return await recomputeInFlight;
  } finally {
    recomputeInFlight = null;
  }
}

/**
 * Hot-path read. If missing, bootstraps once (same as metrics first miss).
 * Prefer cron so cold start is rare.
 */
export async function getPortfolioContextSnapshot(
  s3: AWS.S3,
  bucket: string,
  opts?: { force?: boolean }
): Promise<PortfolioContextSnapshot> {
  if (!opts?.force) {
    const existing = await tryReadPortfolioContextSnapshot(s3, bucket);
    if (existing) return existing;
  }
  return recomputePortfolioContextSnapshot(s3, bucket);
}

export function portfolioMeFromSnapshot(email: string, snapshot: PortfolioContextSnapshot): PortfolioMePayload {
  const emailKey = emailKeyFromEmail(normalizeEmail(email));
  const engagementScore = snapshot.scoresByEmailKey[emailKey] ?? 0;
  const totalScore = snapshot.totalEngagementScore;
  const { min, max } = weeklyEarningsUsdRangeFromEngagementShare(engagementScore, totalScore);
  const projected = projectedWeeklyRangeIfAddedEngagement(
    engagementScore,
    totalScore,
    PROJECTED_ENGAGEMENT_ADD_MIN,
    PROJECTED_ENGAGEMENT_ADD_MAX
  );
  return {
    engagementScore,
    earningsUsdMin: min,
    earningsUsdMax: max,
    projectedEarningsUsdMin: projected.min,
    projectedEarningsUsdMax: projected.max,
    topEngagerMaxUsd: snapshot.usersPoolWeeklyMax,
    wau: snapshot.wau,
    usersUntilActivation: Math.max(0, snapshot.wauActivationTarget - snapshot.wau),
    wauActivationTarget: snapshot.wauActivationTarget,
    engagementRollingDays: snapshot.engagementRollingDays,
  };
}

export function leaderboardFromSnapshot(snapshot: PortfolioContextSnapshot): LeaderboardRow[] {
  return snapshot.leaderboardRows;
}

/** Debounced background refresh after engagement writes (does not block the event API). */
export function schedulePortfolioContextSnapshotRefresh(s3: AWS.S3, bucket: string): void {
  if (process.env.S3_WRITE_DISABLED === '1') return;
  if (debounceTimer) globalThis.clearTimeout(debounceTimer);
  debounceTimer = globalThis.setTimeout(() => {
    debounceTimer = null;
    void recomputePortfolioContextSnapshot(s3, bucket).catch((e) => {
      console.error('[portfolio-snapshot] debounced refresh', e);
    });
  }, SNAPSHOT_DEBOUNCE_MS);
}
