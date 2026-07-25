/**
 * Fixed weekly users pool distributed by engagement share.
 * Floor illustration: pool ÷ PAYOUT_FLOOR_DENOMINATOR (not an unlock gate).
 */
export const WEEKLY_USERS_POOL_USD = 20;

/** Marketing / floor reference: equal split across this many “slots”. */
export const PAYOUT_FLOOR_DENOMINATOR = 100_000;

/** $20 ÷ 100,000 — illustrated minimum if everyone got an equal slot. */
export const WEEKLY_EARNINGS_FLOOR_USD = WEEKLY_USERS_POOL_USD / PAYOUT_FLOOR_DENOMINATOR;

/**
 * @deprecated Use WEEKLY_USERS_POOL_USD. Kept as alias so older imports keep compiling during transition.
 */
export const USERS_POOL_WEEKLY_MAX = WEEKLY_USERS_POOL_USD;

/**
 * @deprecated Pool is now a single fixed amount; min equals max.
 */
export const USERS_POOL_WEEKLY_MIN = WEEKLY_USERS_POOL_USD;

/**
 * Personal weekly earnings as a proportional slice of the fixed $20 pool.
 * Sum of every engager’s payout is at most WEEKLY_USERS_POOL_USD.
 * min === max (fixed pool; no UAR band).
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
  const amount = share * WEEKLY_USERS_POOL_USD;
  return { min: amount, max: amount };
}

/** Projection: add engagement points to your share of the pool (min/max differ by add band). */
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
