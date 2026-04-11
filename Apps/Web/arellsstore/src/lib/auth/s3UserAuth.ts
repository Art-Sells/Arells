import AWS from 'aws-sdk';
import { normalizeEmail, normalizeEmailKey } from './normalize';

const s3 = new AWS.S3({
  region: process.env.WS_REGION,
  accessKeyId: process.env.WS_ACCESS_KEY_ID,
  secretAccessKey: process.env.WS_SECRET_ACCESS_KEY,
});

function bucket(): string {
  const b = process.env.S3_BUCKET_NAME;
  if (!b) throw new Error('S3_BUCKET_NAME is not set');
  return b;
}

export type UserAuthRecord = {
  email: string;
  passwordHash: string;
  verified: boolean;
  verificationToken?: string;
  verificationExpiresAt?: number;
  resetToken?: string;
  resetExpiresAt?: number;
  updatedAt: number;
};

export type PendingVerification = {
  email: string;
  expiresAt: number;
};

export function userAuthKey(emailKey: string) {
  return `users/${emailKey}/Auth.json`;
}

export function pendingVerificationKey(token: string) {
  return `auth/pending/${token}.json`;
}

export async function getUserAuthByEmail(email: string): Promise<UserAuthRecord | null> {
  const key = userAuthKey(normalizeEmailKey(email));
  try {
    const data = await s3.getObject({ Bucket: bucket(), Key: key }).promise();
    const parsed = JSON.parse(data.Body!.toString()) as UserAuthRecord;
    return parsed;
  } catch (err: any) {
    if (err.code === 'NoSuchKey' || err.statusCode === 404) return null;
    throw err;
  }
}

export async function putUserAuth(email: string, record: UserAuthRecord): Promise<void> {
  const key = userAuthKey(normalizeEmailKey(email));
  await s3
    .putObject({
      Bucket: bucket(),
      Key: key,
      Body: JSON.stringify({ ...record, email: normalizeEmail(email) }),
      ContentType: 'application/json',
      ACL: 'private',
    })
    .promise();
}

export async function getPendingVerification(token: string): Promise<PendingVerification | null> {
  const key = pendingVerificationKey(token);
  try {
    const data = await s3.getObject({ Bucket: bucket(), Key: key }).promise();
    return JSON.parse(data.Body!.toString()) as PendingVerification;
  } catch (err: any) {
    if (err.code === 'NoSuchKey' || err.statusCode === 404) return null;
    throw err;
  }
}

export async function putPendingVerification(token: string, body: PendingVerification): Promise<void> {
  await s3
    .putObject({
      Bucket: bucket(),
      Key: pendingVerificationKey(token),
      Body: JSON.stringify(body),
      ContentType: 'application/json',
      ACL: 'private',
    })
    .promise();
}

export async function deletePendingVerification(token: string): Promise<void> {
  try {
    await s3.deleteObject({ Bucket: bucket(), Key: pendingVerificationKey(token) }).promise();
  } catch {
    // ignore
  }
}

export function pendingResetKey(token: string) {
  return `auth/reset/${token}.json`;
}

export type PendingReset = {
  email: string;
  expiresAt: number;
};

export async function getPendingReset(token: string): Promise<PendingReset | null> {
  const key = pendingResetKey(token);
  try {
    const data = await s3.getObject({ Bucket: bucket(), Key: key }).promise();
    return JSON.parse(data.Body!.toString()) as PendingReset;
  } catch (err: any) {
    if (err.code === 'NoSuchKey' || err.statusCode === 404) return null;
    throw err;
  }
}

export async function putPendingReset(token: string, body: PendingReset): Promise<void> {
  await s3
    .putObject({
      Bucket: bucket(),
      Key: pendingResetKey(token),
      Body: JSON.stringify(body),
      ContentType: 'application/json',
      ACL: 'private',
    })
    .promise();
}

export async function deletePendingReset(token: string): Promise<void> {
  try {
    await s3.deleteObject({ Bucket: bucket(), Key: pendingResetKey(token) }).promise();
  } catch {
    // ignore
  }
}
