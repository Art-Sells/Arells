/**
 * Prefer the Lambda execution role for S3. Do this before any getServerS3() singleton.
 * User-defined static keys are not required; if a deleted AKIA is somehow present it
 * overrides the role and create sticks at 1%.
 */
process.env.ARELLS_S3_USE_IAM_ROLE = '1';

import { runAlienGeneratePipeline } from '../../src/lib/server/alienGenerateJob';

type WorkerEvent = {
  email?: string;
  assetId?: string;
  startedAt?: string;
};

function credentialDiag() {
  const awsKey = process.env.AWS_ACCESS_KEY_ID || '';
  const wsKey = process.env.WS_ACCESS_KEY_ID || '';
  console.log('alien-generate worker creds', {
    functionName: process.env.AWS_LAMBDA_FUNCTION_NAME || null,
    region:
      process.env.WS_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || null,
    bucket: process.env.S3_BUCKET_NAME ? 'set' : 'missing',
    grok: process.env.GROK_API_KEY ? 'set' : 'missing',
    awsAccessKeyPrefix: awsKey ? awsKey.slice(0, 4) : null,
    awsAccessKeyLen: awsKey.length,
    wsAccessKeyPrefix: wsKey ? wsKey.slice(0, 4) : null,
    hasSessionToken: Boolean(process.env.AWS_SESSION_TOKEN),
  });
}

/**
 * Long-timeout Lambda entry (not Amplify SSR).
 * Invoked async from POST /api/user/alien-generate action=arm.
 */
export async function handler(event: WorkerEvent) {
  credentialDiag();

  const email = typeof event?.email === 'string' ? event.email.trim() : '';
  const assetId = typeof event?.assetId === 'string' ? event.assetId.trim() : 'bitcoin';
  const startedAt =
    typeof event?.startedAt === 'string' && event.startedAt.trim()
      ? event.startedAt.trim()
      : undefined;

  if (!email) {
    console.error('alien-generate worker: missing email', event);
    return { ok: false, error: 'missing email' };
  }

  try {
    const job = await runAlienGeneratePipeline(email, assetId, {
      startedAt,
      driver: 'worker',
    });
    return { ok: true, status: job.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'worker failed';
    console.error('alien-generate worker', err);
    return { ok: false, error: message };
  }
}
