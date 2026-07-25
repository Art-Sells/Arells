import { normalizeEmail, normalizeEmailKey } from '../auth/normalize';
import { getServerS3 } from '../server/awsS3';

const s3 = getServerS3();

function bucket(): string {
  const b = process.env.S3_BUCKET_NAME;
  if (!b) throw new Error('S3_BUCKET_NAME is not set');
  return b;
}

export type UserPrefsRecord = {
  email: string;
  /** One-time Stripe payouts intro on My Portfolio. Missing ⇒ false. */
  payoutsMessageChecked: boolean;
  updatedAt: number;
};

export function userPrefsKey(emailKey: string) {
  return `users/${emailKey}/Prefs.json`;
}

export async function getUserPrefsByEmail(email: string): Promise<UserPrefsRecord | null> {
  const key = userPrefsKey(normalizeEmailKey(email));
  try {
    const data = await s3.getObject({ Bucket: bucket(), Key: key }).promise();
    return JSON.parse(data.Body!.toString()) as UserPrefsRecord;
  } catch (err: any) {
    if (err.code === 'NoSuchKey' || err.statusCode === 404) return null;
    throw err;
  }
}

export async function putUserPrefs(email: string, record: UserPrefsRecord): Promise<void> {
  const key = userPrefsKey(normalizeEmailKey(email));
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

export function prefsResponseFromRecord(record: UserPrefsRecord | null): {
  payoutsMessageChecked: boolean;
} {
  return {
    payoutsMessageChecked: record?.payoutsMessageChecked === true,
  };
}
