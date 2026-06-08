import { getServerS3 } from '../server/awsS3';
import { buildPublicEarningsPayload, type PublicEarningsPayload } from './referralShares';

export async function fetchPublicEarningsServer(): Promise<PublicEarningsPayload | null> {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) return null;
  try {
    const s3 = getServerS3();
    return await buildPublicEarningsPayload(s3, bucket);
  } catch {
    return null;
  }
}
