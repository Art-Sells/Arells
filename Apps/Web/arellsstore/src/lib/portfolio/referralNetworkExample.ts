import { USERS_POOL_WEEKLY_MIN } from './financialBenefits';

/** Hypothetical example: each referrer signs up this many active weekly users. */
export const REFERRAL_EXAMPLE_BRANCH = 3;

/** Depth below you (L1, L2, L3). */
export const REFERRAL_EXAMPLE_DEPTH = 3;

/** Min-band credit by level: direct, then 50%, then 25%. */
export const REFERRAL_LEVEL_WEIGHTS = [1, 0.5, 0.25] as const;

const MIN_PER_FULL_CREDIT = USERS_POOL_WEEKLY_MIN / 100_000;

export type ReferralNetworkExampleTier = {
  level: number;
  label: string;
  activeCount: number;
  minUsd: number;
};

export function referralNetworkExampleTiers(
  branch: number = REFERRAL_EXAMPLE_BRANCH,
  depth: number = REFERRAL_EXAMPLE_DEPTH
): ReferralNetworkExampleTier[] {
  const tiers: ReferralNetworkExampleTier[] = [];
  for (let level = 1; level <= depth; level += 1) {
    const activeCount = branch ** level;
    const weight = REFERRAL_LEVEL_WEIGHTS[level - 1] ?? 0;
    tiers.push({
      level,
      label: level === 1 ? 'Level 1 — you refer' : level === 2 ? 'Level 2 — they refer' : 'Level 3 — they refer',
      activeCount,
      minUsd: activeCount * MIN_PER_FULL_CREDIT * weight,
    });
  }
  return tiers;
}

export function referralNetworkExampleTotalMinUsd(
  branch: number = REFERRAL_EXAMPLE_BRANCH,
  depth: number = REFERRAL_EXAMPLE_DEPTH
): number {
  return referralNetworkExampleTiers(branch, depth).reduce((sum, tier) => sum + tier.minUsd, 0);
}
