import AWS from 'aws-sdk';
import { s3BucketNameOrThrow } from './s3Bucket';

let s3Singleton: AWS.S3 | null = null;

/**
 * S3 for server / API routes. Reads WS_* (or standard AWS_* fallbacks).
 * If access keys are unset, credentials are omitted so the SDK can use the host IAM role (e.g. Amplify compute role).
 *
 * Alien-generate worker Lambda: always use the execution role. Static WS_ or AWS_ access
 * keys in that function's env override the role; dead keys leave jobs stuck at 1% forever.
 */
export function getServerS3(): AWS.S3 {
  if (s3Singleton) return s3Singleton;
  const region =
    process.env.WS_REGION?.trim() ||
    process.env.AWS_REGION?.trim() ||
    process.env.AWS_DEFAULT_REGION?.trim() ||
    'us-east-1';
  const accessKeyId =
    process.env.WS_ACCESS_KEY_ID?.trim() || process.env.AWS_ACCESS_KEY_ID?.trim() || '';
  const secretAccessKey =
    process.env.WS_SECRET_ACCESS_KEY?.trim() || process.env.AWS_SECRET_ACCESS_KEY?.trim() || '';

  const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME || '';
  const preferIamRole =
    process.env.ARELLS_S3_USE_IAM_ROLE?.trim() === '1' || /alien-generate/i.test(functionName);

  const config: AWS.S3.ClientConfiguration = { region };
  if (!preferIamRole && accessKeyId && secretAccessKey) {
    config.accessKeyId = accessKeyId;
    config.secretAccessKey = secretAccessKey;
  }

  s3Singleton = new AWS.S3(config);
  return s3Singleton;
}

/**
 * Presigned GET so browsers/players fetch media from S3 directly.
 * Amplify Hosting compute cannot proxy large MP4s through the API Lambda.
 *
 * Keep this signature minimal (key + content-type only). VersionId needs
 * s3:GetObjectVersion (403 without it). Extra Response* overrides have also
 * broken playback. Bust caches via the /api/...&t= query instead.
 */
export function getServerS3SignedGetUrl(args: {
  key: string;
  expiresSec?: number;
  responseContentType?: string;
  /** Ignored — call sites may still pass head.VersionId. */
  versionId?: string | null;
  /** Ignored — do not put ResponseCacheControl on the signed URL. */
  responseCacheControl?: string;
}): string {
  return getServerS3().getSignedUrl('getObject', {
    Bucket: s3BucketNameOrThrow(),
    Key: args.key,
    Expires: args.expiresSec ?? 3600,
    ...(args.responseContentType
      ? { ResponseContentType: args.responseContentType }
      : {}),
  });
}

/** Presigned PUT — browser uploads the selfie binary straight to S3 (bypasses Amplify ~1MB API body). */
export function getServerS3SignedPutUrl(args: {
  key: string;
  contentType: string;
  expiresSec?: number;
}): string {
  return getServerS3().getSignedUrl('putObject', {
    Bucket: s3BucketNameOrThrow(),
    Key: args.key,
    ContentType: args.contentType,
    Expires: args.expiresSec ?? 600,
    // No ACL — Bucket owner enforced rejects it and browser PUTs 403.
  });
}
