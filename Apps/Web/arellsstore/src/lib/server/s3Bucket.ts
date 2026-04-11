let cachedBucket: string | null = null;

/** Required for all S3 API routes. Set `S3_BUCKET_NAME` in Amplify → Hosting → Environment variables (per branch), then redeploy. */
export function s3BucketNameOrThrow(): string {
  if (cachedBucket) return cachedBucket;
  const b = process.env.S3_BUCKET_NAME?.trim();
  if (!b) {
    throw new Error(
      'S3_BUCKET_NAME is not set. In AWS Amplify: Hosting → Environment variables → add S3_BUCKET_NAME for this branch, save, then redeploy.'
    );
  }
  cachedBucket = b;
  return cachedBucket;
}
