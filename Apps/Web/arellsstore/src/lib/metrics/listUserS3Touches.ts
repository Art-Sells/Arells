import type AWS from 'aws-sdk';

/** Map encoded email key (S3 path segment) → last-modified ms for Auth / VavityAggregate */
export type UserTouchMap = Map<string, { authMs?: number; vavityMs?: number }>;

export async function listUserS3Touches(s3: AWS.S3, bucket: string): Promise<UserTouchMap> {
  const map = new Map<string, { authMs?: number; vavityMs?: number }>();
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
      if (!obj.Key || !obj.LastModified) continue;
      const lm = obj.LastModified.getTime();

      const auth = obj.Key.match(/^users\/(.+)\/Auth\.json$/);
      if (auth) {
        const emailKey = auth[1];
        const cur = map.get(emailKey) || {};
        cur.authMs = cur.authMs == null ? lm : Math.max(cur.authMs, lm);
        map.set(emailKey, cur);
      }

      const v = obj.Key.match(/^users\/(.+)\/VavityAggregate\.json$/);
      if (v) {
        const emailKey = v[1];
        const cur = map.get(emailKey) || {};
        cur.vavityMs = cur.vavityMs == null ? lm : Math.max(cur.vavityMs, lm);
        map.set(emailKey, cur);
      }
    }

    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);

  return map;
}
