import type AWS from 'aws-sdk';
import { normalizeEmail, normalizeEmailKey } from '../auth/normalize';
import { listVerifiedWauActiveEmailKeys } from '../metrics/metricsPageMounts';
import { aggregateSignedInUserTraffic } from '../metrics/metricsPageMounts';
import {
  projectedWeeklyRangeIfAddedReferrals,
  USERS_POOL_WEEKLY_MAX,
  WAU_ACTIVATION_TARGET,
  weeklyEarningsUsdRangeFromWeightedCredits,
} from './financialBenefits';
import { listAllUserAuthRecordsFromS3 } from './listUserAuthRecords';
import { maskEmailForLeaderboard } from './maskEmailForLeaderboard';
import {
  buildSiteWidePyramidSnapshot,
  buildWeightedCreditsByReferrer,
  type ReferralPyramidSnapshot,
} from './referralTree';
import { isUserAuthVerified } from '../metrics/listUserS3Touches';
import type { UserAuthRecord } from '../auth/s3UserAuth';

export type { ReferralPyramidSnapshot };

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
  referralPyramid: ReferralPyramidSnapshot;
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

export function buildReferralPyramidSnapshot(
  records: UserAuthRecord[],
  wauActiveEmailKeys: Set<string>,
  topReferrerMaxUsd: number
): ReferralPyramidSnapshot {
  return buildSiteWidePyramidSnapshot(records, wauActiveEmailKeys, topReferrerMaxUsd);
}

function countActiveReferralsByReferrer(
  records: Awaited<ReturnType<typeof listAllUserAuthRecordsFromS3>>,
  wauActiveEmailKeys: Set<string>
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const record of records) {
    if (!isUserAuthVerified(record) || !record.referredByEmail) continue;
    const childKey = normalizeEmailKey(normalizeEmail(record.email));
    if (!wauActiveEmailKeys.has(childKey)) continue;
    const referrer = normalizeEmail(record.referredByEmail);
    counts.set(referrer, (counts.get(referrer) ?? 0) + 1);
  }
  return counts;
}

function economicsForReferrer(
  referrerEmail: string,
  counts: Map<string, number>,
  weightedCredits: Map<string, number>
): ReferralEconomics {
  const normalized = normalizeEmail(referrerEmail);
  const activeReferralCount = counts.get(normalized) ?? 0;
  let totalActiveReferrals = 0;
  for (const n of counts.values()) totalActiveReferrals += n;
  const credits = weightedCredits.get(normalized) ?? 0;
  const { min, max } = weeklyEarningsUsdRangeFromWeightedCredits(credits);
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
): Promise<{
  counts: Map<string, number>;
  weightedCredits: Map<string, number>;
  wau: number;
  records: UserAuthRecord[];
  wauActiveEmailKeys: Set<string>;
}> {
  const [records, wauActiveEmailKeys, traffic] = await Promise.all([
    listAllUserAuthRecordsFromS3(s3, bucket),
    listVerifiedWauActiveEmailKeys(s3, bucket, nowMs),
    aggregateSignedInUserTraffic(s3, bucket, nowMs),
  ]);
  const counts = countActiveReferralsByReferrer(records, wauActiveEmailKeys);
  const weightedCredits = buildWeightedCreditsByReferrer(records, wauActiveEmailKeys);
  return {
    counts,
    weightedCredits,
    wau: traffic.wau,
    records,
    wauActiveEmailKeys,
  };
}

export async function buildPublicEarningsPayload(
  _s3: AWS.S3,
  _bucket: string,
  _nowMs: number = Date.now()
): Promise<PublicEarningsPayload> {
  return {
    topReferrerMaxUsd: 0,
    fallbackProjectionMaxUsd: USERS_POOL_WEEKLY_MAX,
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
  const { counts, weightedCredits, wau, records, wauActiveEmailKeys } =
    await buildActiveReferralCounts(s3, bucket, nowMs);
  const economics = economicsForReferrer(email, counts, weightedCredits);
  const personalCredits = weightedCredits.get(normalizeEmail(email)) ?? 0;
  const projected = projectedWeeklyRangeIfAddedReferrals(personalCredits, 2, 3);
  const referralPyramid = buildReferralPyramidSnapshot(
    records,
    wauActiveEmailKeys,
    USERS_POOL_WEEKLY_MAX
  );

  return {
    shareUrl,
    referralCode,
    ...economics,
    projectedEarningsUsdMin: projected.min,
    projectedEarningsUsdMax: projected.max,
    topReferrerMaxUsd: USERS_POOL_WEEKLY_MAX,
    wau,
    usersUntilActivation: Math.max(0, WAU_ACTIVATION_TARGET - wau),
    wauActivationTarget: WAU_ACTIVATION_TARGET,
    referralPyramid,
  };
}

export async function buildLeaderboardRows(
  s3: AWS.S3,
  bucket: string,
  nowMs: number = Date.now()
): Promise<LeaderboardRow[]> {
  const { counts, weightedCredits, records } = await buildActiveReferralCounts(s3, bucket, nowMs);

  const rows: LeaderboardRow[] = [];
  for (const record of records) {
    if (!record.verified) continue;
    const email = normalizeEmail(record.email);
    const economics = economicsForReferrer(email, counts, weightedCredits);
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
