import { runAlienGeneratePipeline } from '../../src/lib/server/alienGenerateJob';

type WorkerEvent = {
  email?: string;
  assetId?: string;
  startedAt?: string;
};

/**
 * Long-timeout Lambda entry (not Amplify SSR).
 * Invoked async from POST /api/user/alien-generate action=arm.
 */
export async function handler(event: WorkerEvent) {
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
