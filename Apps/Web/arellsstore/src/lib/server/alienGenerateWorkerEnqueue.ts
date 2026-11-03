import AWS from 'aws-sdk';

export type AlienGenerateWorkerPayload = {
  email: string;
  assetId: string;
  startedAt: string;
};

/** Amplify env: worker Lambda name or ARN (console-managed, long timeout). */
export function alienGenerateWorkerTarget(): string | null {
  const raw = process.env.ALIEN_GENERATE_WORKER_FUNCTION_NAME?.trim() || '';
  return raw || null;
}

export function isAlienGenerateWorkerConfigured(): boolean {
  return Boolean(alienGenerateWorkerTarget());
}

/**
 * Local/dev only: allow browser-driven Grok when the worker Lambda is unset.
 * Production must use the worker so create survives leaving the page.
 */
export function isAlienGenerateClientDriverAllowed(): boolean {
  return process.env.ALIEN_GENERATE_ALLOW_CLIENT?.trim() === '1';
}

/**
 * Fire-and-forget invoke of the dedicated alien-generate worker.
 * Amplify SSR returns immediately; the worker holds Grok for minutes.
 */
export async function enqueueAlienGenerateWorker(
  payload: AlienGenerateWorkerPayload
): Promise<{ enqueued: boolean; reason?: string }> {
  const FunctionName = alienGenerateWorkerTarget();
  if (!FunctionName) {
    return { enqueued: false, reason: 'ALIEN_GENERATE_WORKER_FUNCTION_NAME unset' };
  }

  const region =
    process.env.WS_REGION?.trim() ||
    process.env.AWS_REGION?.trim() ||
    process.env.AWS_DEFAULT_REGION?.trim() ||
    'us-west-1';
  const accessKeyId =
    process.env.WS_ACCESS_KEY_ID?.trim() || process.env.AWS_ACCESS_KEY_ID?.trim() || '';
  const secretAccessKey =
    process.env.WS_SECRET_ACCESS_KEY?.trim() ||
    process.env.AWS_SECRET_ACCESS_KEY?.trim() ||
    '';

  const config: AWS.Lambda.ClientConfiguration = { region };
  if (accessKeyId && secretAccessKey) {
    config.accessKeyId = accessKeyId;
    config.secretAccessKey = secretAccessKey;
  }

  const lambda = new AWS.Lambda(config);

  await lambda
    .invoke({
      FunctionName,
      InvocationType: 'Event',
      Payload: JSON.stringify(payload),
    })
    .promise();

  return { enqueued: true };
}
