/** Site-wide WAU target before benefits copy treats revenue as “activated”. */
export const WAU_ACTIVATION_TARGET = 100_000;

/** Estimated total weekly user ad revenue band at ~100k WAU. */
export const WEEKLY_UAR_MIN = 3_000;
export const WEEKLY_UAR_MAX = 7_000;

/** Arells keeps 35%; 65% is the referrer pool. */
export const USERS_POOL_SHARE = 0.65;

export const USERS_POOL_WEEKLY_MIN = WEEKLY_UAR_MIN * USERS_POOL_SHARE;
export const USERS_POOL_WEEKLY_MAX = WEEKLY_UAR_MAX * USERS_POOL_SHARE;

/** Personal min/max from sum-weighted downline credits (100k cap, $3k–$7k bands). */
export function weeklyEarningsUsdRangeFromWeightedCredits(weightedCredits: number): {
  min: number;
  max: number;
} {
  if (weightedCredits <= 0) {
    return { min: 0, max: 0 };
  }
  const share = Math.min(1, weightedCredits / WAU_ACTIVATION_TARGET);
  return {
    min: share * USERS_POOL_WEEKLY_MIN,
    max: share * USERS_POOL_WEEKLY_MAX,
  };
}

/** Projection: add full L1-weight credits (e.g. +2 / +3 direct sign-ups). */
export function projectedWeeklyRangeIfAddedReferrals(
  currentWeightedCredits: number,
  addMin: number,
  addMax: number
): { min: number; max: number } {
  return {
    min: weeklyEarningsUsdRangeFromWeightedCredits(currentWeightedCredits + addMin).min,
    max: weeklyEarningsUsdRangeFromWeightedCredits(currentWeightedCredits + addMax).max,
  };
}
