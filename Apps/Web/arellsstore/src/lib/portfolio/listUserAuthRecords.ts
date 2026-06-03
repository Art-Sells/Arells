import type AWS from 'aws-sdk';
import { normalizeEmailKey } from '../auth/normalize';
import type { UserAuthRecord } from '../auth/s3UserAuth';

const AUTH_GET_BATCH = 24;

function pathSegmentToEmailKey(segment: string): string {
  try {
    return normalizeEmailKey(decodeURIComponent(segment));
  } catch {
    return segment;
  }
}

async function listAuthObjectKeys(s3: AWS.S3, bucket: string): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const out = await s3
      .listObjectsV2({
        Bucket: bucket,
        Prefix: 'users/',
        ContinuationToken: token,
        MaxKeys: 1000,
      })
      .promise();
    for (const obj of out.Contents || []) {
      if (!obj.Key?.endsWith('/Auth.json')) continue;
      keys.push(obj.Key);
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

export async function listAllUserAuthRecords(s3: AWS.S3, bucket: string): Promise<UserAuthRecord[]> {
  const objectKeys = await listAuthObjectKeys(s3, bucket);
  const out: UserAuthRecord[] = [];

  for (let i = 0; i < objectKeys.length; i += AUTH_GET_BATCH) {
    const slice = objectKeys.slice(i, i + AUTH_GET_BATCH);
    const batch = await Promise.all(
      slice.map(async (key) => {
        try {
          const obj = await s3.getObject({ Bucket: bucket, Key: key }).promise();
          if (!obj.Body) return null;
          return JSON.parse(obj.Body.toString()) as UserAuthRecord;
        } catch {
          return null;
        }
      })
    );
    for (const rec of batch) {
      if (rec?.email) out.push(rec);
    }
  }
  return out;
}

export function emailKeyFromAuthRecord(rec: UserAuthRecord): string {
  return normalizeEmailKey(rec.email);
}

export function emailFromAuthKey(emailKey: string): string {
  try {
    return decodeURIComponent(emailKey);
  } catch {
    return emailKey;
  }
}
