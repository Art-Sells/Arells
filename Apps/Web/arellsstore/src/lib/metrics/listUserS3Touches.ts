import type AWS from 'aws-sdk';
import { normalizeEmailKey } from '../auth/normalize';

/** Map canonical encoded email key → S3 touch times + Auth object path for verification reads */
export type UserTouchMap = Map<
  string,
  { authMs?: number; vavityMs?: number; authS3Key?: string }
>;

const VERIFIED_AUTH_GET_BATCH = 24;

type TouchEntry = { authMs?: number; vavityMs?: number; authS3Key?: string };

/** Accept legacy Auth.json shapes (boolean, string, number). */
export function isUserAuthVerified(record: { verified?: unknown }): boolean {
  const v = record.verified;
  return v === true || v === 'true' || v === 1 || v === '1';
}

/** Collapse duplicate S3 folders (e.g. raw `@` vs `%40`) to one account per email. */
function pathSegmentToCanonicalEmailKey(segment: string): string {
  try {
    return normalizeEmailKey(decodeURIComponent(segment));
  } catch {
    return segment;
  }
}

function mergeTouchEntry(into: TouchEntry, from: TouchEntry, authObjectKey?: string): void {
  if (from.authMs != null) {
    into.authMs = into.authMs == null ? from.authMs : Math.max(into.authMs, from.authMs);
  }
  if (from.vavityMs != null) {
    into.vavityMs = into.vavityMs == null ? from.vavityMs : Math.max(into.vavityMs, from.vavityMs);
  }
  if (authObjectKey) into.authS3Key = authObjectKey;
  else if (from.authS3Key) into.authS3Key = from.authS3Key;
}

async function buildRawTouchMapFromS3Listing(s3: AWS.S3, bucket: string): Promise<UserTouchMap> {
  const map = new Map<string, TouchEntry>();
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
        const canonicalKey = pathSegmentToCanonicalEmailKey(auth[1]);
        keysWithAuthObject.add(canonicalKey);
        const cur = map.get(canonicalKey) || {};
        mergeTouchEntry(cur, { authMs: lm }, obj.Key);
        map.set(canonicalKey, cur);
      }

      const v = obj.Key.match(/^users\/(.+)\/VavityAggregate\.json$/);
      if (v) {
        const canonicalKey = pathSegmentToCanonicalEmailKey(v[1]);
        const cur = map.get(canonicalKey) || {};
        mergeTouchEntry(cur, { vavityMs: lm });
        map.set(canonicalKey, cur);
      }
    }

    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);

  const withAuthListing = new Map<string, TouchEntry>();
  for (const [ek, ut] of map) {
    if (keysWithAuthObject.has(ek)) withAuthListing.set(ek, { ...ut });
  }
  return withAuthListing;
}

async function filterTouchMapToVerifiedAuth(
  s3: AWS.S3,
  bucket: string,
  raw: UserTouchMap
): Promise<UserTouchMap> {
  const keys = [...raw.keys()];
  const out = new Map<string, TouchEntry>();

  for (let i = 0; i < keys.length; i += VERIFIED_AUTH_GET_BATCH) {
    const slice = keys.slice(i, i + VERIFIED_AUTH_GET_BATCH);
    const results = await Promise.all(
      slice.map(async (emailKey) => {
        const entry = raw.get(emailKey);
        const objectKey = entry?.authS3Key ?? `users/${emailKey}/Auth.json`;
        try {
          const obj = await s3.getObject({ Bucket: bucket, Key: objectKey }).promise();
          if (!obj.Body) return null;
          const record = JSON.parse(obj.Body.toString()) as { verified?: unknown };
          if (!isUserAuthVerified(record)) return null;
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

/**
 * Every distinct users/…/Auth.json in S3 (includes unverified registrations).
 * Prefer {@link listVerifiedUserS3Touches} for metrics and product counts.
 */
export async function listAllUserAuthAccountsFromS3(s3: AWS.S3, bucket: string): Promise<UserTouchMap> {
  return buildRawTouchMapFromS3Listing(s3, bucket);
}

/** Verified Auth.json only — used for all user metrics (growth, retention, DAUt/WAUt/MAUt). */
export async function listVerifiedUserS3Touches(s3: AWS.S3, bucket: string): Promise<UserTouchMap> {
  const raw = await buildRawTouchMapFromS3Listing(s3, bucket);
  return filterTouchMapToVerifiedAuth(s3, bucket, raw);
}

/** @alias listVerifiedUserS3Touches */
export async function listUserS3Touches(s3: AWS.S3, bucket: string): Promise<UserTouchMap> {
  return listVerifiedUserS3Touches(s3, bucket);
}

export async function countVerifiedRegisteredUsers(s3: AWS.S3, bucket: string): Promise<number> {
  const touchMap = await listVerifiedUserS3Touches(s3, bucket);
  return touchMap.size;
}
