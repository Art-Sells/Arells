/** Site-wide activation gate for financial-benefits copy (not applied to live %). */
export const FINANCIAL_BENEFITS_WAU_TARGET = 100_000;

/** Static estimated weekly user ad revenue band at ~100k WAU (display copy only). */
export const WEEKLY_UAR_DISPLAY_MIN = 3_000;
export const WEEKLY_UAR_DISPLAY_MAX = 7_000;

export const USERS_UAR_POOL_FRACTION = 0.65;
export const ARELLS_UAR_POOL_FRACTION = 0.35;

export function usersUntilBenefitsActivation(wau: number): number {
  return Math.max(0, FINANCIAL_BENEFITS_WAU_TARGET - wau);
}

export function formatSharePct(pct: number): string {
  if (!Number.isFinite(pct) || pct <= 0) return '0%';
  if (pct >= 99.95) return '100%';
  const rounded = Math.round(pct * 100) / 100;
  const str = rounded % 1 === 0 ? String(Math.round(rounded)) : rounded.toFixed(2).replace(/\.?0+$/, '');
  return `${str}%`;
}
