import {
  ALIEN_STAGED_MEDIA_KINDS,
  alienMetaloopSourceKey,
  alienStagedObjectKey,
  isMissingS3Object,
  type AlienStagedMediaKind,
} from './alienPhoto';
import { getServerS3 } from './awsS3';
import { s3BucketNameOrThrow } from './s3Bucket';

const s3 = getServerS3();

/** Optional loops — if staging is missing on publish, wipe live so old clips never stick. */
const REPLACE_OR_CLEAR_KINDS: AlienStagedMediaKind[] = ['metaloop', 'seasononeloop'];

async function deleteQuiet(bucket: string, key: string): Promise<void> {
  try {
    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
  } catch {
    /* missing is fine */
  }
}

/** S3 CopySource must encode each key segment (`%40` → `%2540`). */
function s3CopySource(bucket: string, key: string): string {
  return `${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

async function stagingExists(bucket: string, key: string): Promise<boolean> {
  try {
    await s3.headObject({ Bucket: bucket, Key: key }).promise();
    return true;
  } catch (err) {
    if (isMissingS3Object(err)) return false;
    throw err;
  }
}

/**
 * Promote staged create outputs to live keys so guests never see a mixed generation
 * (new poster + old video).
 *
 * All required staging keys are checked BEFORE any live copy. Otherwise a missing
 * metaloop could throw after stills were already published and leave the old launch
 * loop live.
 */
export async function promoteAlienStagedMedia(
  email: string,
  asset: string,
  opts?: { require?: AlienStagedMediaKind[]; clearMissingLoops?: boolean }
): Promise<{ promoted: AlienStagedMediaKind[]; missing: AlienStagedMediaKind[] }> {
  const bucket = s3BucketNameOrThrow();
  const require = new Set(opts?.require || ['composed', 'portrait', 'seasonone']);
  const clearMissingLoops = opts?.clearMissingLoops !== false;
  const promoted: AlienStagedMediaKind[] = [];
  const missing: AlienStagedMediaKind[] = [];

  const present = new Map<AlienStagedMediaKind, string>();
  for (const kind of ALIEN_STAGED_MEDIA_KINDS) {
    const stagingKey = alienStagedObjectKey(email, asset, kind, true);
    if (await stagingExists(bucket, stagingKey)) {
      present.set(kind, stagingKey);
    } else {
      missing.push(kind);
    }
  }

  for (const kind of missing) {
    if (require.has(kind)) {
      throw new Error(`Missing staged ${kind} — cannot publish character`);
    }
  }

  for (const kind of ALIEN_STAGED_MEDIA_KINDS) {
    const liveKey = alienStagedObjectKey(email, asset, kind, false);
    const stagingKey = present.get(kind);
    if (!stagingKey) {
      if (clearMissingLoops && REPLACE_OR_CLEAR_KINDS.includes(kind)) {
        await deleteQuiet(bucket, liveKey);
      }
      continue;
    }

    await s3
      .copyObject({
        Bucket: bucket,
        CopySource: s3CopySource(bucket, stagingKey),
        Key: liveKey,
        ACL: 'private',
        MetadataDirective: 'COPY',
      })
      .promise();
    await deleteQuiet(bucket, stagingKey);
    if (kind === 'composed') {
      const sourceStaging = alienMetaloopSourceKey(email, asset, true);
      const sourceLive = alienMetaloopSourceKey(email, asset, false);
      if (await stagingExists(bucket, sourceStaging)) {
        await s3
          .copyObject({
            Bucket: bucket,
            CopySource: s3CopySource(bucket, sourceStaging),
            Key: sourceLive,
            ACL: 'private',
            MetadataDirective: 'COPY',
          })
          .promise();
        await deleteQuiet(bucket, sourceStaging);
      }
    }
    promoted.push(kind);
  }

  return { promoted, missing };
}
