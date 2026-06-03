import type AWS from 'aws-sdk';
import type { UserAuthRecord } from '../auth/s3UserAuth';
import { normalizeEmailKey } from '../auth/normalize';

function pathSegmentToCanonicalEmailKey(segment: string): string {
  try {
    return normalizeEmailKey(decodeURIComponent(segment));
  } catch {
    return segment;
  }
}

/** Every users/…/Auth.json in the bucket. */
export async function listAllUserAuthRecordsFromS3(s3: AWS.S3, bucket: string): Promise<UserAuthRecord[]> {
  const records: UserAuthRecord[] = [];
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
      const key = obj.Key;
      const m = key?.match(/^users\/(.+)\/Auth\.json$/);
      if (!m || !key) continue;
      const emailKey = pathSegmentToCanonicalEmailKey(m[1]);
      const objectKey = key;
      try {
        const data = await s3.getObject({ Bucket: bucket, Key: objectKey }).promise();
        if (!data.Body) continue;
        const record = JSON.parse(data.Body.toString()) as UserAuthRecord;
        records.push({ ...record, email: record.email || decodeURIComponent(emailKey) });
      } catch {
        // skip unreadable
      }
    }

    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);

  return records;
}
