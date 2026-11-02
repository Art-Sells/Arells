import {
  ALIEN_STAGED_MEDIA_KINDS,
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

/**
 * Promote staged create outputs to live keys so guests never see a mixed generation
 * (new poster + old video). Required kinds must exist; optional loops are copied when
 * present, otherwise live loops are cleared so a prior character cannot linger.
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

  for (const kind of ALIEN_STAGED_MEDIA_KINDS) {
    const stagingKey = alienStagedObjectKey(email, asset, kind, true);
    const liveKey = alienStagedObjectKey(email, asset, kind, false);
    try {
      await s3.headObject({ Bucket: bucket, Key: stagingKey }).promise();
    } catch (err) {
      if (isMissingS3Object(err)) {
        missing.push(kind);
        if (require.has(kind)) {
          throw new Error(`Missing staged ${kind} — cannot publish character`);
        }
        if (clearMissingLoops && REPLACE_OR_CLEAR_KINDS.includes(kind)) {
          await deleteQuiet(bucket, liveKey);
        }
        continue;
      }
      throw err;
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
    promoted.push(kind);
  }

  return { promoted, missing };
}
