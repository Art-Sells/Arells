import { randomBytes } from 'crypto';
import { normalizeEmail, normalizeEmailKey } from './normalize';
import { getUserAuthByEmail, putUserAuth, type UserAuthRecord } from './s3UserAuth';
import { getServerS3 } from '../server/awsS3';

const s3 = getServerS3();

const REFERRAL_CODE_BYTES = 6;
const REFERRAL_CODE_RE = /^[a-z0-9]{8,12}$/;

function bucket(): string {
  const b = process.env.S3_BUCKET_NAME;
  if (!b) throw new Error('S3_BUCKET_NAME is not set');
  return b;
}

export function referralCodeIndexKey(code: string): string {
  return `auth/referral-codes/${code.toLowerCase()}.json`;
}

export function normalizeReferralCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toLowerCase();
  if (!REFERRAL_CODE_RE.test(code)) return null;
  return code;
}

function generateReferralCode(): string {
  return randomBytes(REFERRAL_CODE_BYTES).toString('hex');
}

async function putReferralCodeIndex(code: string, email: string): Promise<void> {
  await s3
    .putObject({
      Bucket: bucket(),
      Key: referralCodeIndexKey(code),
      Body: JSON.stringify({ email: normalizeEmail(email) }),
      ContentType: 'application/json',
      ACL: 'private',
    })
    .promise();
}

export async function resolveReferrerEmailFromCode(code: string): Promise<string | null> {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return null;
  try {
    const obj = await s3.getObject({ Bucket: bucket(), Key: referralCodeIndexKey(normalized) }).promise();
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

/** Assign referralCode on Auth.json + index file if missing. */
export async function ensureUserReferralCode(email: string): Promise<string> {
  const normalized = normalizeEmail(email);
  const auth = await getUserAuthByEmail(normalized);
  if (!auth) throw new Error('Account not found');

  if (auth.referralCode) {
    const existing = normalizeReferralCode(auth.referralCode);
    if (existing) return existing;
  }

  let code = '';
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateReferralCode();
    const taken = await resolveReferrerEmailFromCode(candidate);
    if (!taken) {
      code = candidate;
      break;
    }
  }
  if (!code) code = generateReferralCode() + randomBytes(2).toString('hex').slice(0, 2);

  await putReferralCodeIndex(code, normalized);
  await putUserAuth(normalized, {
    ...auth,
    email: normalized,
    referralCode: code,
    updatedAt: Date.now(),
  });
  return code;
}

export function buildReferralShareUrl(appOrigin: string, code: string): string {
  const base = appOrigin.replace(/\/$/, '');
  return `${base}/?ref=${encodeURIComponent(code)}`;
}

export async function attachReferrerOnRegister(
  newEmail: string,
  referralCodeRaw: unknown
): Promise<void> {
  const code = normalizeReferralCode(
    typeof referralCodeRaw === 'string' ? referralCodeRaw : ''
  );
  if (!code) return;

  const referrerEmail = await resolveReferrerEmailFromCode(code);
  if (!referrerEmail) return;

  const normalizedNew = normalizeEmail(newEmail);
  if (referrerEmail === normalizedNew) return;

  const auth = await getUserAuthByEmail(normalizedNew);
  if (!auth || auth.referredByEmail) return;

  await putUserAuth(normalizedNew, {
    ...auth,
    email: normalizedNew,
    referredByEmail: referrerEmail,
    referredAt: Date.now(),
    updatedAt: Date.now(),
  });
}

export function mergeAuthPreservingReferral(
  auth: UserAuthRecord,
  patch: Partial<UserAuthRecord>
): UserAuthRecord {
  return {
    ...auth,
    ...patch,
    email: normalizeEmail(patch.email ?? auth.email),
    referralCode: patch.referralCode ?? auth.referralCode,
    referredByEmail: patch.referredByEmail ?? auth.referredByEmail,
    referredAt: patch.referredAt ?? auth.referredAt,
  };
}
