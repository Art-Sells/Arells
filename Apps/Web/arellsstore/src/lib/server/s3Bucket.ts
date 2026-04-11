let cachedBucket: string | null = null;

function resolveBucketFromEnv(): string | undefined {
  // Use static `process.env.*` keys so `next.config.mjs` can replace `process.env.S3_BUCKET_NAME` at build (server only).
  const primary = process.env.S3_BUCKET_NAME?.trim();
  if (primary) return primary;
  const aws = process.env.AWS_S3_BUCKET?.trim();
  if (aws) return aws;
  const short = process.env.S3_BUCKET?.trim();
  if (short) return short;
  return undefined;
}

/**
 * Required for all S3 API routes. Set `S3_BUCKET_NAME` in Amplify (per branch). It must be available when `yarn build`
 * runs so the server bundle can embed it (see `next.config.mjs` DefinePlugin); the API Lambda often does not receive
 * the same env at runtime.
 */
export function s3BucketNameOrThrow(): string {
  if (cachedBucket) return cachedBucket;
  const b = resolveBucketFromEnv();
  if (!b) {
    throw new Error(
      'S3 bucket name is missing. Set S3_BUCKET_NAME (or AWS_S3_BUCKET / S3_BUCKET) in Amplify Environment variables for this branch so it is present during the build step; access is enforced by IAM.'
    );
  }
  cachedBucket = b;
  return cachedBucket;
}
