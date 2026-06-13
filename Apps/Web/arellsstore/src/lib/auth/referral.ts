import { randomBytes } from 'crypto';
import type { UserAuthRecord } from './s3UserAuth';
import { getUserAuthByEmail, putUserAuth } from './s3UserAuth';
import { normalizeEmail, normalizeEmailKey } from './normalize';
import { getServerS3 } from '../server/awsS3';

const s3 = getServerS3();

function bucket(): string {
  const b = process.env.S3_BUCKET_NAME;
  if (!b) throw new Error('S3_BUCKET_NAME is not set');
  return b;
}

export const REFERRAL_CODE_COOKIE = 'arells_ref';
export const REFERRAL_CODE_COOKIE_MAX_AGE_SEC = 30 * 24 * 60 * 60;

function referralCodeIndexKey(code: string) {
  return `auth/referral-codes/${code}.json`;
}

function generateReferralCode(): string {
  return randomBytes(6).toString('hex');
}

export async function resolveReferrerEmailFromCode(code: string): Promise<string | null> {
  const trimmed = code.trim().toLowerCase();
  if (!trimmed || trimmed.length > 64) return null;
  try {
    const obj = await s3.getObject({ Bucket: bucket(), Key: referralCodeIndexKey(trimmed) }).promise();
    if (!obj.Body) return null;
    const parsed = JSON.parse(obj.Body.toString()) as { email?: string };
    const email = typeof parsed.email === 'string' ? normalizeEmail(parsed.email) : '';
    return email || null;
  } catch (err: unknown) {
    const e = err as { code?: string; statusCode?: number };
    if (e.code === 'NoSuchKey' || e.statusCode === 404) return null;
    throw err;
  }
}

export async function ensureReferralCodeForUser(email: string): Promise<string> {
  const auth = await getUserAuthByEmail(email);
  if (!auth) throw new Error('Account not found');
  if (auth.referralCode) return auth.referralCode;

  let code = generateReferralCode();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      await s3
        .headObject({ Bucket: bucket(), Key: referralCodeIndexKey(code) })
        .promise();
      code = generateReferralCode();
    } catch (err: unknown) {
      const e = err as { code?: string; statusCode?: number };
      if (e.code === 'NotFound' || e.code === 'NoSuchKey' || e.statusCode === 404) break;
      throw err;
    }
  }

  const normalized = normalizeEmail(email);
  await s3
    .putObject({
      Bucket: bucket(),
      Key: referralCodeIndexKey(code),
      Body: JSON.stringify({ email: normalized }),
      ContentType: 'application/json',
      ACL: 'private',
    })
    .promise();

  await putUserAuth(email, { ...auth, email: normalized, referralCode: code, updatedAt: Date.now() });
  return code;
}

export async function attachReferrerOnRegister(
  newUserEmail: string,
  referralCodeRaw: unknown
): Promise<void> {
  if (typeof referralCodeRaw !== 'string' || !referralCodeRaw.trim()) return;

  const referrerEmail = await resolveReferrerEmailFromCode(referralCodeRaw);
  if (!referrerEmail) return;

  const newEmail = normalizeEmail(newUserEmail);
  if (referrerEmail === newEmail) return;

  const auth = await getUserAuthByEmail(newEmail);
  if (!auth || auth.referredByEmail) return;

  await putUserAuth(newEmail, {
    ...auth,
    email: newEmail,
    referredByEmail: referrerEmail,
    referredAt: Date.now(),
    updatedAt: Date.now(),
  });
}

export function mergeAuthPreservingReferral(
  existing: UserAuthRecord,
  patch: UserAuthRecord
): UserAuthRecord {
  return {
    ...patch,
    referralCode: patch.referralCode ?? existing.referralCode,
    referredByEmail: patch.referredByEmail ?? existing.referredByEmail,
    referredAt: patch.referredAt ?? existing.referredAt,
  };
}

export function buildShareUrl(origin: string, referralCode: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/earn-money-weekly?ref=${encodeURIComponent(referralCode)}`;
}
