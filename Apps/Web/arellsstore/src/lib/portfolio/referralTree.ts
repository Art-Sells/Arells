import { normalizeEmail, normalizeEmailKey } from '../auth/normalize';
import { isUserAuthVerified } from '../metrics/listUserS3Touches';
import type { UserAuthRecord } from '../auth/s3UserAuth';
import { USERS_POOL_WEEKLY_MIN, USERS_POOL_WEEKLY_MAX, WAU_ACTIVATION_TARGET } from './financialBenefits';

/** Hypothetical example: each referrer signs up this many active weekly users. */
export const REFERRAL_EXAMPLE_BRANCH = 3;

/** Pyramid milestone depths (labels are human copy in the UI, not shown as L1/L6). */
export const REFERRAL_PYRAMID_MID_DEPTH = 6;
export const REFERRAL_PYRAMID_BOTTOM_DEPTH = 12;

/** Example counts for the fixed pyramid (3 → 3^6 → 100k WAU). */
export const REFERRAL_PYRAMID_L1_EXAMPLE_COUNT = REFERRAL_EXAMPLE_BRANCH ** 1;
export const REFERRAL_PYRAMID_MID_EXAMPLE_COUNT = REFERRAL_EXAMPLE_BRANCH ** REFERRAL_PYRAMID_MID_DEPTH;
export const REFERRAL_PYRAMID_BOTTOM_EXAMPLE_COUNT = WAU_ACTIVATION_TARGET;

/** Min-band credit by depth: L1 full, L2 half, L3+ quarter. */
export const REFERRAL_LEVEL_WEIGHTS = [1, 0.5, 0.25] as const;

const MIN_PER_FULL_CREDIT = USERS_POOL_WEEKLY_MIN / WAU_ACTIVATION_TARGET;
const MAX_PER_FULL_CREDIT = USERS_POOL_WEEKLY_MAX / WAU_ACTIVATION_TARGET;

export type ReferralPyramidSnapshot = {
  l1ActiveWeekly: number;
  l1MaxUsd: number;
  midActiveWeekly: number;
  midMaxUsd: number;
  bottomActiveWeekly: number;
  topReferrerMaxUsd: number;
};

export function referralLevelWeight(depth: number): number {
  if (depth <= 0) return 0;
  return REFERRAL_LEVEL_WEIGHTS[Math.min(depth, REFERRAL_LEVEL_WEIGHTS.length) - 1] ?? 0.25;
}

export function exampleMinUsdAtDepth(activeCount: number, depth: number): number {
  return activeCount * MIN_PER_FULL_CREDIT * referralLevelWeight(depth);
}

export function exampleMaxUsdAtDepth(activeCount: number, depth: number): number {
  return activeCount * MAX_PER_FULL_CREDIT * referralLevelWeight(depth);
}

/** Fixed example pyramid (3 → 729 → 100k WAU); never varies with live site data. */
export function buildFixedExamplePyramidSnapshot(
  topReferrerMaxUsd: number = USERS_POOL_WEEKLY_MAX
): ReferralPyramidSnapshot {
  const l1 = REFERRAL_PYRAMID_L1_EXAMPLE_COUNT;
  const mid = REFERRAL_PYRAMID_MID_EXAMPLE_COUNT;
  const bottom = REFERRAL_PYRAMID_BOTTOM_EXAMPLE_COUNT;

  return {
    l1ActiveWeekly: l1,
    l1MaxUsd: exampleMaxUsdAtDepth(l1, 1),
    midActiveWeekly: mid,
    midMaxUsd: exampleMaxUsdAtDepth(mid, REFERRAL_PYRAMID_MID_DEPTH),
    bottomActiveWeekly: bottom,
    topReferrerMaxUsd,
  };
}

export const FIXED_REFERRAL_PYRAMID_SNAPSHOT = buildFixedExamplePyramidSnapshot();

/** Sum of level-weighted credits each referrer earns from WAU-active downline. */
export function buildWeightedCreditsByReferrer(
  records: UserAuthRecord[],
  wauActiveEmailKeys: Set<string>
): Map<string, number> {
  const parent = new Map<string, string>();
  for (const record of records) {
    if (!isUserAuthVerified(record) || !record.referredByEmail) continue;
    const childKey = normalizeEmailKey(normalizeEmail(record.email));
    if (!wauActiveEmailKeys.has(childKey)) continue;
    parent.set(normalizeEmail(record.email), normalizeEmail(record.referredByEmail));
  }

  const credits = new Map<string, number>();
  for (const child of parent.keys()) {
    let node: string | undefined = child;
    let depth = 0;
    const seen = new Set<string>();
    while (node && parent.has(node) && !seen.has(node)) {
      seen.add(node);
      depth += 1;
      const referrer: string = parent.get(node)!;
      const weight = referralLevelWeight(depth);
      credits.set(referrer, (credits.get(referrer) ?? 0) + weight);
      node = referrer;
    }
  }
  return credits;
}

export function buildChildrenMap(
  records: UserAuthRecord[],
  wauActiveEmailKeys: Set<string>
): Map<string, string[]> {
  const children = new Map<string, string[]>();
  for (const record of records) {
    if (!isUserAuthVerified(record) || !record.referredByEmail) continue;
    const childKey = normalizeEmailKey(normalizeEmail(record.email));
    if (!wauActiveEmailKeys.has(childKey)) continue;
    const referrer = normalizeEmail(record.referredByEmail);
    const child = normalizeEmail(record.email);
    const list = children.get(referrer) ?? [];
    list.push(child);
    children.set(referrer, list);
  }
  return children;
}
