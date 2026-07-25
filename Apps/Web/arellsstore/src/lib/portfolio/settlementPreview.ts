import type AWS from 'aws-sdk';
import { normalizeEmail } from '../auth/normalize';
import { WEEKLY_USERS_POOL_USD, weeklyEarningsUsdRangeFromEngagementShare } from './financialBenefits';
import { buildPortfolioContext } from './referralShares';
import { emailKeyFromEmail, ENGAGEMENT_ROLLING_DAYS_EXPORT } from './myInvestmentsEngagement';
import { isUserAuthVerified } from '../metrics/listUserS3Touches';
import { maskEmailForLeaderboard } from './maskEmailForLeaderboard';

export type SettlementPreviewRow = {
  email: string;
  maskedLabel: string;
  engagementScore: number;
  share: number;
  payoutUsd: number;
};

export type SettlementPreviewPayload = {
  generatedAt: number;
  dryRun: true;
  weeklyUsersPoolUsd: number;
  engagementRollingDays: number;
  totalEngagementScore: number;
  engagerCount: number;
  totalPayoutUsd: number;
  rows: SettlementPreviewRow[];
};

/**
 * Freeze current rolling engagement scores and compute each engager’s share of the
 * fixed $20 pool. No Stripe — ledger only (future cron will pay from this shape).
 */
export async function buildSettlementPreviewPayload(
  s3: AWS.S3,
  bucket: string,
  nowMs: number = Date.now()
): Promise<SettlementPreviewPayload> {
  const { engagementScores, records } = await buildPortfolioContext(s3, bucket, nowMs);

  let totalEngagementScore = 0;
  for (const score of engagementScores.values()) totalEngagementScore += score;

  const rows: SettlementPreviewRow[] = [];
  for (const record of records) {
    if (!isUserAuthVerified(record)) continue;
    const email = normalizeEmail(record.email);
    const emailKey = emailKeyFromEmail(email);
    const engagementScore = engagementScores.get(emailKey) ?? 0;
    if (engagementScore <= 0) continue;
    const { max: payoutUsd } = weeklyEarningsUsdRangeFromEngagementShare(
      engagementScore,
      totalEngagementScore
    );
    const share = totalEngagementScore > 0 ? engagementScore / totalEngagementScore : 0;
    rows.push({
      email,
      maskedLabel: maskEmailForLeaderboard(email),
      engagementScore,
      share,
      payoutUsd,
    });
  }

  rows.sort((a, b) => {
    if (b.payoutUsd !== a.payoutUsd) return b.payoutUsd - a.payoutUsd;
    if (b.engagementScore !== a.engagementScore) return b.engagementScore - a.engagementScore;
    return a.email.localeCompare(b.email);
  });

  const totalPayoutUsd = rows.reduce((sum, row) => sum + row.payoutUsd, 0);

  return {
    generatedAt: nowMs,
    dryRun: true,
    weeklyUsersPoolUsd: WEEKLY_USERS_POOL_USD,
    engagementRollingDays: ENGAGEMENT_ROLLING_DAYS_EXPORT,
    totalEngagementScore,
    engagerCount: rows.length,
    totalPayoutUsd,
    rows,
  };
}
