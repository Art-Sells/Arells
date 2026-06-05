import type AWS from 'aws-sdk';
import { normalizeEmail, normalizeEmailKey } from '../auth/normalize';
import { listVerifiedWauActiveEmailKeys } from '../metrics/metricsPageMounts';
import { aggregateSignedInUserTraffic } from '../metrics/metricsPageMounts';
import {
  projectedWeeklyRangeIfAddedReferrals,
  weeklyEarningsUsdRange,
  WAU_ACTIVATION_TARGET,
} from './financialBenefits';
import { listAllUserAuthRecordsFromS3 } from './listUserAuthRecords';
import { maskEmailForLeaderboard } from './maskEmailForLeaderboard';

export type ReferralEconomics = {
  activeReferralCount: number;
  totalActiveReferrals: number;
  earningsUsdMin: number;
  earningsUsdMax: number;
};

export type PortfolioMePayload = ReferralEconomics & {
  shareUrl: string;
  referralCode: string;
  projectedEarningsUsdMin: number;
  projectedEarningsUsdMax: number;
  topReferrerMaxUsd: number;
  wau: number;
  usersUntilActivation: number;
  wauActivationTarget: number;
};

export type LeaderboardRow = {
  email: string;
  maskedLabel: string;
  activeReferralCount: number;
  earningsUsdMin: number;
  earningsUsdMax: number;
};

export type PublicEarningsPayload = {
  topReferrerMaxUsd: number;
  fallbackProjectionMaxUsd: number;
};

/** Highest weekly max among referrers on the leaderboard (0 if none have active referrals). */
export function topReferrerWeeklyMaxUsd(rows: LeaderboardRow[]): number {
  let top = 0;
  for (const row of rows) {
    if (row.earningsUsdMax > top) top = row.earningsUsdMax;
  }
  return top;
}

function topReferrerMaxFromCounts(counts: Map<string, number>): number {
  let totalActiveReferrals = 0;
  for (const n of counts.values()) totalActiveReferrals += n;
  let top = 0;
  for (const n of counts.values()) {
    const { max } = weeklyEarningsUsdRange(n, totalActiveReferrals);
    if (max > top) top = max;
  }
  return top;
}

/** UI max: top referrer when one exists, otherwise share-projection max. */
export function groupDisplayMaxUsd(topReferrerMax: number, shareProjectionMax: number): number {
  if (topReferrerMax > 0) return topReferrerMax;
  return shareProjectionMax;
}

function countActiveReferralsByReferrer(
  records: Awaited<ReturnType<typeof listAllUserAuthRecordsFromS3>>,
  wauActiveEmailKeys: Set<string>
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const record of records) {
    if (!record.verified || !record.referredByEmail) continue;
    const childKey = normalizeEmailKey(record.email);
    if (!wauActiveEmailKeys.has(childKey)) continue;
    const referrer = normalizeEmail(record.referredByEmail);
    counts.set(referrer, (counts.get(referrer) ?? 0) + 1);
  }
  return counts;
}

function economicsForReferrer(
  referrerEmail: string,
  counts: Map<string, number>
): ReferralEconomics {
  const normalized = normalizeEmail(referrerEmail);
  const activeReferralCount = counts.get(normalized) ?? 0;
  let totalActiveReferrals = 0;
  for (const n of counts.values()) totalActiveReferrals += n;
  const { min, max } = weeklyEarningsUsdRange(activeReferralCount, totalActiveReferrals);
  return {
    activeReferralCount,
    totalActiveReferrals,
    earningsUsdMin: min,
    earningsUsdMax: max,
  };
}

export async function buildActiveReferralCounts(
  s3: AWS.S3,
  bucket: string,
  nowMs: number = Date.now()
): Promise<{ counts: Map<string, number>; wau: number }> {
  const [records, wauActiveEmailKeys, traffic] = await Promise.all([
    listAllUserAuthRecordsFromS3(s3, bucket),
    listVerifiedWauActiveEmailKeys(s3, bucket, nowMs),
    aggregateSignedInUserTraffic(s3, bucket, nowMs),
  ]);
  return {
    counts: countActiveReferralsByReferrer(records, wauActiveEmailKeys),
    wau: traffic.wau,
  };
}

export async function buildPublicEarningsPayload(
  s3: AWS.S3,
  bucket: string,
  nowMs: number = Date.now()
): Promise<PublicEarningsPayload> {
  const { counts } = await buildActiveReferralCounts(s3, bucket, nowMs);
  const topReferrerMaxUsd = topReferrerMaxFromCounts(counts);
  let totalActiveReferrals = 0;
  for (const n of counts.values()) totalActiveReferrals += n;
  const fallback = projectedWeeklyRangeIfAddedReferrals(0, totalActiveReferrals, 2, 3);
  return {
    topReferrerMaxUsd,
    fallbackProjectionMaxUsd: fallback.max,
  };
}

export async function buildPortfolioMePayload(
  s3: AWS.S3,
  bucket: string,
  email: string,
  shareUrl: string,
  referralCode: string,
  nowMs: number = Date.now()
): Promise<PortfolioMePayload> {
  const { counts, wau } = await buildActiveReferralCounts(s3, bucket, nowMs);
  const economics = economicsForReferrer(email, counts);
  const projected = projectedWeeklyRangeIfAddedReferrals(
    economics.activeReferralCount,
    economics.totalActiveReferrals,
    2,
    3
  );
  const topReferrerMaxUsd = topReferrerMaxFromCounts(counts);

  return {
    shareUrl,
    referralCode,
    ...economics,
    projectedEarningsUsdMin: projected.min,
    projectedEarningsUsdMax: projected.max,
    topReferrerMaxUsd,
    wau,
    usersUntilActivation: Math.max(0, WAU_ACTIVATION_TARGET - wau),
    wauActivationTarget: WAU_ACTIVATION_TARGET,
  };
}

export async function buildLeaderboardRows(
  s3: AWS.S3,
  bucket: string,
  nowMs: number = Date.now()
): Promise<LeaderboardRow[]> {
  const { counts } = await buildActiveReferralCounts(s3, bucket, nowMs);
  const records = await listAllUserAuthRecordsFromS3(s3, bucket);

  const rows: LeaderboardRow[] = [];
  for (const record of records) {
    if (!record.verified) continue;
    const email = normalizeEmail(record.email);
    const economics = economicsForReferrer(email, counts);
    rows.push({
      email,
      maskedLabel: maskEmailForLeaderboard(email),
      activeReferralCount: economics.activeReferralCount,
      earningsUsdMin: economics.earningsUsdMin,
      earningsUsdMax: economics.earningsUsdMax,
    });
  }

  rows.sort((a, b) => {
    if (b.activeReferralCount !== a.activeReferralCount) {
      return b.activeReferralCount - a.activeReferralCount;
    }
    if (b.earningsUsdMax !== a.earningsUsdMax) {
      return b.earningsUsdMax - a.earningsUsdMax;
    }
    return a.email.localeCompare(b.email);
  });

  return rows;
}
