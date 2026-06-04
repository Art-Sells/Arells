/** Site-wide WAU target before benefits copy treats revenue as “activated”. */
export const WAU_ACTIVATION_TARGET = 100_000;

/** Estimated total weekly user ad revenue band at ~100k WAU. */
export const WEEKLY_UAR_MIN = 3_000;
export const WEEKLY_UAR_MAX = 7_000;

/** Arells keeps 35%; 65% is the referrer pool. */
export const USERS_POOL_SHARE = 0.65;

export const USERS_POOL_WEEKLY_MIN = WEEKLY_UAR_MIN * USERS_POOL_SHARE;
export const USERS_POOL_WEEKLY_MAX = WEEKLY_UAR_MAX * USERS_POOL_SHARE;

export function referrerShareRatio(activeReferrals: number, totalActiveReferrals: number): number {
  if (activeReferrals <= 0 || totalActiveReferrals <= 0) return 0;
  return activeReferrals / totalActiveReferrals;
}

/** Low band: each active referral's slice of $3k UAR spread over the 100k WAU target. */
export function referrerLowShareRatio(activeReferrals: number): number {
  if (activeReferrals <= 0) return 0;
  return Math.min(1, activeReferrals / WAU_ACTIVATION_TARGET);
}

export function weeklyEarningsUsdRange(
  activeReferrals: number,
  totalActiveReferrals: number
): { min: number; max: number } {
  const lowShare = referrerLowShareRatio(activeReferrals);
  const highShare = referrerShareRatio(activeReferrals, totalActiveReferrals);
  return {
    min: lowShare * USERS_POOL_WEEKLY_MIN,
    max: Math.min(1, highShare) * USERS_POOL_WEEKLY_MAX,
  };
}

export function projectedWeeklyRangeIfAddedReferrals(
  currentActive: number,
  totalActive: number,
  addMin: number,
  addMax: number
): { min: number; max: number } {
  const lowShare = referrerLowShareRatio(currentActive + addMin);
  const highShare = referrerShareRatio(currentActive + addMax, totalActive + addMax);
  return {
    min: lowShare * USERS_POOL_WEEKLY_MIN,
    max: Math.min(1, highShare) * USERS_POOL_WEEKLY_MAX,
  };
}
