import type AWS from 'aws-sdk';
import { normalizeEmail } from '../auth/normalize';
import { isUserAuthVerified } from '../metrics/listUserS3Touches';
import { collectVerifiedWauEmailKeys } from '../metrics/metricsPageMounts';
import { aggregateSignedInUserTraffic } from '../metrics/metricsPageMounts';
import { formatSharePct, usersUntilBenefitsActivation } from './financialBenefits';
import { emailKeyFromAuthRecord, listAllUserAuthRecords } from './listUserAuthRecords';
import type { UserAuthRecord } from '../auth/s3UserAuth';

export type ReferralShareSnapshot = {
  wau: number;
  usersUntilActivation: number;
  totalActiveReferrals: number;
  myActiveReferrals: number;
  mySharePct: number;
  mySharePctLabel: string;
};

export type LeaderboardRow = {
  email: string;
  obfuscatedEmail: string;
  activeReferrals: number;
  sharePct: number;
  sharePctLabel: string;
};

function isVerifiedRecord(rec: UserAuthRecord): boolean {
  return isUserAuthVerified(rec);
}

/** Count active referral slots per referrer email (normalized). */
export function computeActiveReferralCounts(
  records: UserAuthRecord[],
  wauEmailKeys: Set<string>
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const rec of records) {
    if (!isVerifiedRecord(rec)) continue;
    const childKey = emailKeyFromAuthRecord(rec);
    if (!wauEmailKeys.has(childKey)) continue;
    const referrer = rec.referredByEmail ? normalizeEmail(rec.referredByEmail) : '';
    if (!referrer) continue;
    counts.set(referrer, (counts.get(referrer) || 0) + 1);
  }
  return counts;
}

export function sharePctFromCounts(myActive: number, totalActive: number): number {
  if (totalActive <= 0 || myActive <= 0) return 0;
  return (myActive / totalActive) * 100;
}

export function totalActiveReferrals(counts: Map<string, number>): number {
  let n = 0;
  for (const v of counts.values()) n += v;
  return n;
}

export async function buildReferralShareSnapshot(
  s3: AWS.S3,
  bucket: string,
  viewerEmail: string
): Promise<ReferralShareSnapshot> {
  const now = Date.now();
  const [records, wauKeys, traffic] = await Promise.all([
    listAllUserAuthRecords(s3, bucket),
    collectVerifiedWauEmailKeys(s3, bucket, now),
    aggregateSignedInUserTraffic(s3, bucket, now),
  ]);

  const counts = computeActiveReferralCounts(records, wauKeys);
  const totalActive = totalActiveReferrals(counts);
  const viewer = normalizeEmail(viewerEmail);
  const myActive = counts.get(viewer) || 0;
  const mySharePct = sharePctFromCounts(myActive, totalActive);

  return {
    wau: traffic.wau,
    usersUntilActivation: usersUntilBenefitsActivation(traffic.wau),
    totalActiveReferrals: totalActive,
    myActiveReferrals: myActive,
    mySharePct,
    mySharePctLabel: formatSharePct(mySharePct),
  };
}

export async function buildReferralLeaderboard(
  s3: AWS.S3,
  bucket: string
): Promise<{ rows: LeaderboardRow[]; totalActiveReferrals: number }> {
  const { obfuscateEmailForLeaderboard } = await import('./obfuscateEmail');
  const now = Date.now();
  const [records, wauKeys] = await Promise.all([
    listAllUserAuthRecords(s3, bucket),
    collectVerifiedWauEmailKeys(s3, bucket, now),
  ]);

  const counts = computeActiveReferralCounts(records, wauKeys);
  const totalActive = totalActiveReferrals(counts);

  const referrerEmails = new Set<string>();
  for (const rec of records) {
    if (rec.referredByEmail) referrerEmails.add(normalizeEmail(rec.referredByEmail));
  }
  for (const email of counts.keys()) referrerEmails.add(email);

  const rows: LeaderboardRow[] = [];
  for (const email of referrerEmails) {
    const activeReferrals = counts.get(email) || 0;
    const sharePct = sharePctFromCounts(activeReferrals, totalActive);
    rows.push({
      email,
      obfuscatedEmail: obfuscateEmailForLeaderboard(email),
      activeReferrals,
      sharePct,
      sharePctLabel: formatSharePct(sharePct),
    });
  }

  rows.sort((a, b) => b.activeReferrals - a.activeReferrals || a.email.localeCompare(b.email));

  return { rows, totalActiveReferrals: totalActive };
}
