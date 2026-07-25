import type AWS from 'aws-sdk';
import { normalizeEmail, normalizeEmailKey } from '../auth/normalize';
import { aggregateSignedInUserTraffic } from '../metrics/metricsPageMounts';
import {
  projectedWeeklyRangeIfAddedEngagement,
  WEEKLY_USERS_POOL_USD,
  weeklyEarningsUsdRangeFromEngagementShare,
} from './financialBenefits';
import {
  buildEngagementScoresByEmail,
  emailKeyFromEmail,
  ENGAGEMENT_ROLLING_DAYS_EXPORT,
  getEngagementScoreForEmail,
  myInvEngagementS3Prefix,
} from './myInvestmentsEngagement';
import { listAllUserAuthRecordsFromS3 } from './listUserAuthRecords';
import { maskEmailForLeaderboard } from './maskEmailForLeaderboard';
import { isUserAuthVerified } from '../metrics/listUserS3Touches';
import type { UserAuthRecord } from '../auth/s3UserAuth';

/** Typical extra engagement points for explainer projection copy. */
export const PROJECTED_ENGAGEMENT_ADD_MIN = 10;
export const PROJECTED_ENGAGEMENT_ADD_MAX = 25;

export type PortfolioEconomics = {
  engagementScore: number;
  earningsUsdMin: number;
  earningsUsdMax: number;
};

export type PortfolioMePayload = PortfolioEconomics & {
  projectedEarningsUsdMin: number;
  projectedEarningsUsdMax: number;
  topEngagerMaxUsd: number;
  /** Ops metric only — not used for earnings unlock. */
  wau: number;
  engagementRollingDays: number;
};

export type LeaderboardRow = {
  email: string;
  maskedLabel: string;
  engagementScore: number;
  earningsUsdMin: number;
  earningsUsdMax: number;
};

export type PublicEarningsPayload = {
  topEngagerMaxUsd: number;
  fallbackProjectionMaxUsd: number;
};

export type EarningsPreviewRow = {
  email: string;
  engagementScore: number;
  earningsUsdMin: number;
  earningsUsdMax: number;
};

export type EarningsPreviewPayload = {
  generatedAt: number;
  engagementPrefix: string;
  engagementRollingDays: number;
  wau: number;
  usersPoolWeeklyUsd: number;
  topEngagerMaxUsd: number;
  /** Sum of every verified user's engagement score this rolling window — the proportional split denominator. */
  totalEngagementScore: number;
  rows: EarningsPreviewRow[];
};

function totalEngagementScore(engagementScores: Map<string, number>): number {
  let total = 0;
  for (const score of engagementScores.values()) {
    total += score;
  }
  return total;
}

function economicsForUser(
  email: string,
  engagementScores: Map<string, number>,
  totalScore: number
): PortfolioEconomics {
  const normalized = normalizeEmail(email);
  const emailKey = emailKeyFromEmail(normalized);
  const engagementScore = engagementScores.get(emailKey) ?? 0;
  const { min, max } = weeklyEarningsUsdRangeFromEngagementShare(engagementScore, totalScore);
  return {
    engagementScore,
    earningsUsdMin: min,
    earningsUsdMax: max,
  };
}

function verifiedEmailKeysFromRecords(records: UserAuthRecord[]): string[] {
  return records
    .filter((r) => isUserAuthVerified(r))
    .map((r) => normalizeEmailKey(normalizeEmail(r.email)));
}

export async function buildEngagementScoreMap(
  s3: AWS.S3,
  bucket: string,
  records: UserAuthRecord[],
  nowMs: number = Date.now()
): Promise<Map<string, number>> {
  const keys = verifiedEmailKeysFromRecords(records);
  return buildEngagementScoresByEmail(s3, bucket, keys, nowMs);
}

export async function buildPortfolioContext(
  s3: AWS.S3,
  bucket: string,
  nowMs: number = Date.now()
): Promise<{
  engagementScores: Map<string, number>;
  wau: number;
  records: UserAuthRecord[];
}> {
  const [records, traffic] = await Promise.all([
    listAllUserAuthRecordsFromS3(s3, bucket),
    aggregateSignedInUserTraffic(s3, bucket, nowMs),
  ]);
  const engagementScores = await buildEngagementScoreMap(s3, bucket, records, nowMs);
  return {
    engagementScores,
    wau: traffic.wau,
    records,
  };
}

export async function buildPublicEarningsPayload(
  _s3: AWS.S3,
  _bucket: string,
  _nowMs: number = Date.now()
): Promise<PublicEarningsPayload> {
  return {
    topEngagerMaxUsd: WEEKLY_USERS_POOL_USD,
    fallbackProjectionMaxUsd: WEEKLY_USERS_POOL_USD,
  };
}

export async function buildPortfolioMePayload(
  s3: AWS.S3,
  bucket: string,
  email: string,
  nowMs: number = Date.now()
): Promise<PortfolioMePayload> {
  const { engagementScores, wau } = await buildPortfolioContext(s3, bucket, nowMs);
  const totalScore = totalEngagementScore(engagementScores);
  const economics = economicsForUser(email, engagementScores, totalScore);
  const projected = projectedWeeklyRangeIfAddedEngagement(
    economics.engagementScore,
    totalScore,
    PROJECTED_ENGAGEMENT_ADD_MIN,
    PROJECTED_ENGAGEMENT_ADD_MAX
  );

  return {
    ...economics,
    projectedEarningsUsdMin: projected.min,
    projectedEarningsUsdMax: projected.max,
    topEngagerMaxUsd: WEEKLY_USERS_POOL_USD,
    wau,
    engagementRollingDays: ENGAGEMENT_ROLLING_DAYS_EXPORT,
  };
}

export async function buildLeaderboardRows(
  s3: AWS.S3,
  bucket: string,
  nowMs: number = Date.now()
): Promise<LeaderboardRow[]> {
  const { engagementScores, records } = await buildPortfolioContext(s3, bucket, nowMs);
  const totalScore = totalEngagementScore(engagementScores);

  const rows: LeaderboardRow[] = [];
  for (const record of records) {
    if (!record.verified) continue;
    const email = normalizeEmail(record.email);
    const economics = economicsForUser(email, engagementScores, totalScore);
    rows.push({
      email,
      maskedLabel: maskEmailForLeaderboard(email),
      engagementScore: economics.engagementScore,
      earningsUsdMin: economics.earningsUsdMin,
      earningsUsdMax: economics.earningsUsdMax,
    });
  }

  rows.sort((a, b) => {
    if (b.engagementScore !== a.engagementScore) {
      return b.engagementScore - a.engagementScore;
    }
    if (b.earningsUsdMin !== a.earningsUsdMin) {
      return b.earningsUsdMin - a.earningsUsdMin;
    }
    if (b.earningsUsdMax !== a.earningsUsdMax) {
      return b.earningsUsdMax - a.earningsUsdMax;
    }
    return a.email.localeCompare(b.email);
  });

  return rows;
}

export async function buildEarningsPreviewPayload(
  s3: AWS.S3,
  bucket: string,
  nowMs: number = Date.now()
): Promise<EarningsPreviewPayload> {
  const { engagementScores, wau, records } = await buildPortfolioContext(s3, bucket, nowMs);
  const totalScore = totalEngagementScore(engagementScores);
  const rows: EarningsPreviewRow[] = [];

  for (const record of records) {
    if (!record.verified) continue;
    const email = normalizeEmail(record.email);
    const economics = economicsForUser(email, engagementScores, totalScore);
    rows.push({
      email,
      engagementScore: economics.engagementScore,
      earningsUsdMin: economics.earningsUsdMin,
      earningsUsdMax: economics.earningsUsdMax,
    });
  }

  rows.sort((a, b) => b.engagementScore - a.engagementScore);

  return {
    generatedAt: nowMs,
    engagementPrefix: myInvEngagementS3Prefix(),
    engagementRollingDays: ENGAGEMENT_ROLLING_DAYS_EXPORT,
    wau,
    usersPoolWeeklyUsd: WEEKLY_USERS_POOL_USD,
    topEngagerMaxUsd: WEEKLY_USERS_POOL_USD,
    totalEngagementScore: totalScore,
    rows,
  };
}

export async function getEngagementScoreForUserEmail(
  s3: AWS.S3,
  bucket: string,
  email: string,
  nowMs: number = Date.now()
): Promise<number> {
  return getEngagementScoreForEmail(s3, bucket, emailKeyFromEmail(normalizeEmail(email)), nowMs);
}
