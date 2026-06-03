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

export function weeklyEarningsUsdRangeFromShare(share: number): { min: number; max: number } {
  const s = Math.max(0, Math.min(1, share));
  return {
    min: s * USERS_POOL_WEEKLY_MIN,
    max: s * USERS_POOL_WEEKLY_MAX,
  };
}

export function projectedWeeklyRangeIfAddedReferrals(
  currentActive: number,
  totalActive: number,
  addMin: number,
  addMax: number
): { min: number; max: number } {
  const lowShare = referrerShareRatio(currentActive + addMin, totalActive + addMin);
  const highShare = referrerShareRatio(currentActive + addMax, totalActive + addMax);
  const low = weeklyEarningsUsdRangeFromShare(lowShare);
  const high = weeklyEarningsUsdRangeFromShare(highShare);
  return { min: low.min, max: high.max };
}
