import {
  ALIEN_STAGED_MEDIA_KINDS,
  alienStagedObjectKey,
  isMissingS3Object,
  type AlienStagedMediaKind,
} from './alienPhoto';
import { getServerS3 } from './awsS3';
import { s3BucketNameOrThrow } from './s3Bucket';

const s3 = getServerS3();

async function deleteQuiet(bucket: string, key: string): Promise<void> {
  try {
    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
  } catch {
    /* missing is fine */
  }
}

/**
 * Promote staged create outputs to live keys so guests never see a mixed generation
 * (new poster + old video). Copies what exists; skips missing optional loops.
 */
export async function promoteAlienStagedMedia(
  email: string,
  asset: string,
  opts?: { require?: AlienStagedMediaKind[] }
): Promise<{ promoted: AlienStagedMediaKind[]; missing: AlienStagedMediaKind[] }> {
  const bucket = s3BucketNameOrThrow();
  const require = new Set(opts?.require || ['composed', 'portrait']);
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
        continue;
      }
      throw err;
    }

    await s3
      .copyObject({
        Bucket: bucket,
        CopySource: `${bucket}/${stagingKey}`,
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
