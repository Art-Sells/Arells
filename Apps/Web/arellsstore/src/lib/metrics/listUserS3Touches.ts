import type AWS from 'aws-sdk';

/** Map encoded email key (S3 path segment) → last-modified ms for Auth / VavityAggregate */
export type UserTouchMap = Map<string, { authMs?: number; vavityMs?: number }>;

const VERIFIED_AUTH_GET_BATCH = 24;

async function filterTouchMapToVerifiedAuth(s3: AWS.S3, bucket: string, raw: UserTouchMap): Promise<UserTouchMap> {
  const keys = [...raw.keys()];
  const out = new Map<string, { authMs?: number; vavityMs?: number }>();

  for (let i = 0; i < keys.length; i += VERIFIED_AUTH_GET_BATCH) {
    const slice = keys.slice(i, i + VERIFIED_AUTH_GET_BATCH);
    const results = await Promise.all(
      slice.map(async (emailKey) => {
        try {
          const obj = await s3
            .getObject({ Bucket: bucket, Key: `users/${emailKey}/Auth.json` })
            .promise();
          if (!obj.Body) return null;
          const record = JSON.parse(obj.Body.toString()) as { verified?: boolean };
          if (record.verified !== true) return null;
          return emailKey;
        } catch {
          return null;
        }
      })
    );
    for (let j = 0; j < results.length; j += 1) {
      const ek = results[j];
      if (ek == null) continue;
      const ut = raw.get(ek);
      if (ut) out.set(ek, { ...ut });
    }
  }

  return out;
}

/** Vavity-only rows (no Auth.json in bucket) are never “signed up” for metrics. */
function dropKeysWithoutAuthListing(raw: UserTouchMap, keysWithAuthObject: Set<string>): UserTouchMap {
  const next = new Map<string, { authMs?: number; vavityMs?: number }>();
  for (const [ek, ut] of raw) {
    if (keysWithAuthObject.has(ek)) next.set(ek, ut);
  }
  return next;
}

/**
 * Lists users/…/Auth.json and users/…/VavityAggregate.json LastModified, then keeps only
 * rows whose Auth.json exists and has verified: true (email verified, not pending signup).
 */
export async function listUserS3Touches(s3: AWS.S3, bucket: string): Promise<UserTouchMap> {
  const map = new Map<string, { authMs?: number; vavityMs?: number }>();
  const keysWithAuthObject = new Set<string>();
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
        keysWithAuthObject.add(emailKey);
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

  const withAuthListing = dropKeysWithoutAuthListing(map, keysWithAuthObject);
  return filterTouchMapToVerifiedAuth(s3, bucket, withAuthListing);
}
