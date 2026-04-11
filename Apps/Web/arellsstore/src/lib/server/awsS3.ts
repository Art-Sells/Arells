import AWS from 'aws-sdk';

let s3Singleton: AWS.S3 | null = null;

/**
 * S3 for server / API routes. Reads WS_* (or standard AWS_* fallbacks).
 * If access keys are unset, credentials are omitted so the SDK can use the host IAM role (e.g. Amplify compute role).
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

  const config: AWS.S3.ClientConfiguration = { region };
  if (accessKeyId && secretAccessKey) {
    config.accessKeyId = accessKeyId;
    config.secretAccessKey = secretAccessKey;
  }

  s3Singleton = new AWS.S3(config);
  return s3Singleton;
}
