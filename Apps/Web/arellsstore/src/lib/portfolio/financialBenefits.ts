/** Site-wide WAU target before benefits copy treats revenue as “activated”. */
export const WAU_ACTIVATION_TARGET = 100_000;

/** Estimated total weekly user ad revenue band at ~100k WAU. */
export const WEEKLY_UAR_MIN = 3_000;
export const WEEKLY_UAR_MAX = 7_000;

/** Arells keeps 35%; 65% is the users pool. */
export const USERS_POOL_SHARE = 0.65;

export const USERS_POOL_WEEKLY_MIN = WEEKLY_UAR_MIN * USERS_POOL_SHARE;
export const USERS_POOL_WEEKLY_MAX = WEEKLY_UAR_MAX * USERS_POOL_SHARE;

/**
 * Personal min/max as a proportional slice of the users pool: your share of the
 * *total* engagement across all verified users this week, not a per-user 100k cap.
 * The sum of every user's max, across everyone with score > 0, is at most
 * USERS_POOL_WEEKLY_MAX (never more, regardless of how many people engage heavily).
 */
export function weeklyEarningsUsdRangeFromEngagementShare(
  engagementScore: number,
  totalEngagementScore: number
): {
  min: number;
  max: number;
} {
  if (engagementScore <= 0 || totalEngagementScore <= 0) {
    return { min: 0, max: 0 };
  }
  const share = Math.min(1, engagementScore / totalEngagementScore);
  return {
    min: share * USERS_POOL_WEEKLY_MIN,
    max: share * USERS_POOL_WEEKLY_MAX,
  };
}

/** Projection: add engagement points (e.g. +10 / +20 typical weekly interactions) to your share of the pool. */
export function projectedWeeklyRangeIfAddedEngagement(
  currentEngagementScore: number,
  totalEngagementScore: number,
  addMin: number,
  addMax: number
): { min: number; max: number } {
  const totalWithMin = Math.max(totalEngagementScore, currentEngagementScore + addMin);
  const totalWithMax = Math.max(totalEngagementScore, currentEngagementScore + addMax);
  return {
    min: weeklyEarningsUsdRangeFromEngagementShare(currentEngagementScore + addMin, totalWithMin).min,
    max: weeklyEarningsUsdRangeFromEngagementShare(currentEngagementScore + addMax, totalWithMax).max,
  };
}
