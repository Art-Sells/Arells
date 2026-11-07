import { resolveReferrerEmailFromCode } from '../auth/referral';
import { publicAlienImagePath } from '../assets/assetSharePath';
import { alienComposedKey, isMissingS3Object } from './alienPhoto';
import { getServerS3 } from './awsS3';
import { s3BucketNameOrThrow } from './s3Bucket';

/** Public composed metaposter URL, versioned by the object's save time. Null if none exists. */
export async function composedSharePosterUrl(
  shareId: string,
  asset = 'bitcoin'
): Promise<string | null> {
  const email = await resolveReferrerEmailFromCode(shareId);
  if (!email) return null;
  try {
    const head = await getServerS3()
      .headObject({
        Bucket: s3BucketNameOrThrow(),
        Key: alienComposedKey(email, asset),
      })
      .promise();
    const version = head.LastModified ? head.LastModified.getTime() : Date.now();
    return publicAlienImagePath({
      shareId,
      asset,
      kind: 'composed',
      cacheBust: version,
    });
  } catch (err) {
    if (isMissingS3Object(err)) return null;
    return null;
  }
}
