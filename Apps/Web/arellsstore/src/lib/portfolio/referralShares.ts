import type AWS from 'aws-sdk';
import { normalizeEmail, normalizeEmailKey } from '../auth/normalize';
import { listVerifiedWauActiveEmailKeys } from '../metrics/metricsPageMounts';
import { aggregateSignedInUserTraffic } from '../metrics/metricsPageMounts';
import {
  projectedWeeklyRangeIfAddedReferrals,
  referrerShareRatio,
  WAU_ACTIVATION_TARGET,
  weeklyEarningsUsdRangeFromShare,
} from './financialBenefits';
import { listAllUserAuthRecordsFromS3 } from './listUserAuthRecords';
import { obfuscateEmail } from './obfuscateEmail';

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
  wau: number;
  usersUntilActivation: number;
  wauActivationTarget: number;
};

export type LeaderboardRow = {
  email: string;
  obfuscatedEmail: string;
  activeReferralCount: number;
  earningsUsdMin: number;
  earningsUsdMax: number;
};

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
  const share = referrerShareRatio(activeReferralCount, totalActiveReferrals);
  const { min, max } = weeklyEarningsUsdRangeFromShare(share);
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

  return {
    shareUrl,
    referralCode,
    ...economics,
    projectedEarningsUsdMin: projected.min,
    projectedEarningsUsdMax: projected.max,
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
  const referrerEmails = new Set<string>();

  for (const record of records) {
    if (record.referralCode) referrerEmails.add(normalizeEmail(record.email));
    if (record.referredByEmail) referrerEmails.add(normalizeEmail(record.referredByEmail));
  }

  const rows: LeaderboardRow[] = [];
  for (const email of referrerEmails) {
    const economics = economicsForReferrer(email, counts);
    rows.push({
      email,
      obfuscatedEmail: obfuscateEmail(email),
      activeReferralCount: economics.activeReferralCount,
      earningsUsdMin: economics.earningsUsdMin,
      earningsUsdMax: economics.earningsUsdMax,
    });
  }

  rows.sort((a, b) => {
    if (b.activeReferralCount !== a.activeReferralCount) {
      return b.activeReferralCount - a.activeReferralCount;
    }
    return b.earningsUsdMax - a.earningsUsdMax;
  });

  return rows;
}
