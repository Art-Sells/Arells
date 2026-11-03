import AWS from 'aws-sdk';

export type AlienGenerateWorkerPayload = {
  email: string;
  assetId: string;
  startedAt: string;
};

/** Set on Amplify to the worker Lambda name or ARN (15‑min timeout, not SSR). */
export function alienGenerateWorkerTarget(): string | null {
  const raw =
    process.env.ALIEN_GENERATE_WORKER_FUNCTION_NAME?.trim() ||
    process.env.ALIEN_GENERATE_WORKER_ARN?.trim() ||
    '';
  return raw || null;
}

export function isAlienGenerateWorkerConfigured(): boolean {
  return Boolean(alienGenerateWorkerTarget());
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

  const lambda = new AWS.Lambda({
    region: process.env.WS_REGION || process.env.AWS_REGION || 'us-west-1',
  });

  await lambda
    .invoke({
      FunctionName,
      InvocationType: 'Event',
      Payload: JSON.stringify(payload),
    })
    .promise();

  return { enqueued: true };
}
