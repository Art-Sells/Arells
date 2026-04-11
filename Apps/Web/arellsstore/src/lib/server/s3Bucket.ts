let cachedBucket: string | null = null;

function resolveBucketFromEnv(): string | undefined {
  const keys = ['S3_BUCKET_NAME', 'AWS_S3_BUCKET', 'S3_BUCKET'] as const;
  for (const k of keys) {
    const v = process.env[k]?.trim();
    if (v) return v;
  }
  return undefined;
}

/**
 * Required for all S3 API routes. Prefer `S3_BUCKET_NAME` in Amplify → Hosting → Environment variables (per branch).
 * Also accepts `AWS_S3_BUCKET` or `S3_BUCKET` if your hosting only injects one of those names into the SSR runtime.
 */
export function s3BucketNameOrThrow(): string {
  if (cachedBucket) return cachedBucket;
  const b = resolveBucketFromEnv();
  if (!b) {
    throw new Error(
      'S3 bucket name is not set in this server runtime. Set S3_BUCKET_NAME (or AWS_S3_BUCKET / S3_BUCKET) in Amplify → Hosting → Environment variables for this branch, save, then redeploy so SSR/API Lambdas pick it up.'
    );
  }
  cachedBucket = b;
  return cachedBucket;
}
