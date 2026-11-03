import type { NextApiRequest, NextApiResponse } from 'next';
import { assertUserEmailMatchesSession } from '../../../lib/auth/requireUserApi';
import {
  readAlienGenerateJob,
  writeAlienGenerateJob,
  type AlienGenerateJob,
} from '../../../lib/server/alienGenerateJob';
import { normalizeAlienPhotoAsset } from '../../../lib/server/alienPhoto';
import { promoteAlienStagedMedia } from '../../../lib/server/alienStaging';
import { CHARACTER_GENERATION_PAYMENT_DISABLED } from '../../../lib/characterGenerationPaymentGate';
import { findPaidUnusedCredit } from '../../../lib/server/characterGenerationCredit';
import {
  enqueueAlienGenerateWorker,
  isAlienGenerateWorkerConfigured,
} from '../../../lib/server/alienGenerateWorkerEnqueue';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

/**
 * GET  — poll job status.
 * POST — job control only (no background pipeline).
 *
 * When ALIEN_GENERATE_WORKER_FUNCTION_NAME is set, arm enqueues a long-timeout
 * worker Lambda (Grok runs there). Browser only polls GET.
 * Without a worker (local): browser still drives compose/videos.
 *   action: 'arm'      → mark running (+ enqueue worker when configured)
 *   action: 'phase'    → update phase (client-driven fallback)
 *   action: 'finalize' → promote staging + mark complete (client-driven fallback)
 *   action: 'fail'     → mark error
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    const email = typeof req.query.email === 'string' ? req.query.email : '';
    const rawAsset = req.query.asset;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    const allowed = await assertUserEmailMatchesSession(req, res, email);
    if (!allowed) return;
    const asset = normalizeAlienPhotoAsset(rawAsset);
    if (!asset) return res.status(400).json({ error: 'Unsupported asset' });
    const job = await readAlienGenerateJob(allowed, asset);
    return res.status(200).json({ ok: true, job });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, asset: rawAsset } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Missing email' });
  }
  const allowed = await assertUserEmailMatchesSession(req, res, email);
  if (!allowed) return;

  const asset = normalizeAlienPhotoAsset(rawAsset);
  if (!asset) {
    return res.status(400).json({ error: 'Unsupported asset' });
  }

  const actionRaw = typeof req.body?.action === 'string' ? req.body.action.trim().toLowerCase() : 'arm';
  const action =
    actionRaw === 'finalize' || actionRaw === 'fail' || actionRaw === 'phase' || actionRaw === 'arm'
      ? actionRaw
      : 'arm';

  try {
    if (action === 'finalize') {
      const prev = await readAlienGenerateJob(allowed, asset);
      const startedAtBody =
        typeof req.body?.startedAt === 'string' ? req.body.startedAt.trim() : '';
      /*
       * Stale pipeline after a newer force-arm: do not promote old staging over a
       * fresher create, and do not mark error on the winning job.
       */
      if (
        startedAtBody &&
        prev?.startedAt &&
        startedAtBody !== prev.startedAt &&
        prev.status === 'running'
      ) {
        return res.status(409).json({
          error: 'Stale generate job — a newer create is in progress',
          code: 'stale_job',
        });
      }

      const metaloop = Boolean(req.body?.metaloop);
      const seasononeloop = Boolean(req.body?.seasononeloop);
      const alreadyComplete = prev?.status === 'complete';
      /*
       * Publish is atomic: stills + both loops together. Even a racing finalize
       * after complete must have the full staging set — never promote stills alone.
       */
      const require: Array<'composed' | 'portrait' | 'seasonone' | 'metaloop' | 'seasononeloop'> = [
        'composed',
        'portrait',
        'seasonone',
        'metaloop',
        'seasononeloop',
      ];

      try {
        await promoteAlienStagedMedia(allowed, asset, {
          require,
          clearMissingLoops: false,
        });
      } catch (err) {
        if (!alreadyComplete) throw err;
        /* complete + empty/partial staging: leave live as-is */
      }

      if (alreadyComplete) {
        return res.status(200).json({ ok: true, status: 'complete', job: prev });
      }

      const now = new Date().toISOString();
      const job: AlienGenerateJob = {
        email: allowed,
        assetId: asset,
        status: 'complete',
        phase: 'done',
        progress: 100,
        metaloop,
        seasononeloop,
        error: typeof req.body?.error === 'string' ? req.body.error : prev?.error,
        startedAt: prev?.startedAt || now,
        updatedAt: now,
        finishedAt: now,
      };
      await writeAlienGenerateJob(job);
      return res.status(200).json({ ok: true, status: 'complete', job });
    }

    if (action === 'fail') {
      const prev = await readAlienGenerateJob(allowed, asset);
      /* Never overwrite a successful create from a second browser's failed resume. */
      if (prev?.status === 'complete') {
        return res.status(200).json({ ok: true, status: 'complete', job: prev });
      }
      const startedAtBody =
        typeof req.body?.startedAt === 'string' ? req.body.startedAt.trim() : '';
      /* Stale pipeline after force-arm must not fail the newer running job. */
      if (startedAtBody && prev?.startedAt && startedAtBody !== prev.startedAt) {
        return res.status(200).json({ ok: true, status: prev?.status || 'running', job: prev });
      }
      const now = new Date().toISOString();
      const message =
        typeof req.body?.error === 'string' && req.body.error.trim()
          ? req.body.error.trim()
          : 'Character generation failed';
      const job: AlienGenerateJob = {
        email: allowed,
        assetId: asset,
        status: 'error',
        error: message,
        startedAt: prev?.startedAt || now,
        updatedAt: now,
        finishedAt: now,
      };
      await writeAlienGenerateJob(job);
      return res.status(200).json({ ok: true, status: 'error', job });
    }

    if (action === 'phase') {
      const prev = await readAlienGenerateJob(allowed, asset);
      if (!prev || prev.status !== 'running') {
        return res.status(409).json({ error: 'No running generate job' });
      }
      const phaseRaw = typeof req.body?.phase === 'string' ? req.body.phase.trim().toLowerCase() : '';
      const phase =
        phaseRaw === 'compose' ||
        phaseRaw === 'seasononeloop' ||
        phaseRaw === 'metaloop' ||
        phaseRaw === 'done'
          ? phaseRaw
          : prev.phase || 'compose';
      const progressRaw = req.body?.progress;
      const progress =
        typeof progressRaw === 'number' && Number.isFinite(progressRaw)
          ? Math.max(0, Math.min(100, Math.round(progressRaw)))
          : typeof progressRaw === 'string' && progressRaw.trim() && Number.isFinite(Number(progressRaw))
            ? Math.max(0, Math.min(100, Math.round(Number(progressRaw))))
            : prev.progress;
      const job: AlienGenerateJob = {
        ...prev,
        phase,
        ...(progress != null ? { progress } : {}),
        metaloop: req.body?.metaloop != null ? Boolean(req.body.metaloop) : prev.metaloop,
        seasononeloop:
          req.body?.seasononeloop != null ? Boolean(req.body.seasononeloop) : prev.seasononeloop,
        updatedAt: new Date().toISOString(),
      };
      await writeAlienGenerateJob(job);
      return res.status(200).json({ ok: true, status: 'running', job });
    }

    /* action === 'arm' — mark running; enqueue worker when configured. */
    const force = Boolean(req.body?.force);
    const useWorker = isAlienGenerateWorkerConfigured();
    const existing = await readAlienGenerateJob(allowed, asset);
    if (!force && existing?.status === 'running') {
      const startedMs = Date.parse(existing.startedAt || '') || 0;
      const ageMs = Date.now() - startedMs;
      /* Reuse fresh running jobs (worker or client). Older leftovers get re-armed. */
      if (ageMs >= 0 && ageMs < 20 * 60 * 1000) {
        if (useWorker && existing.driver === 'worker') {
          await enqueueAlienGenerateWorker({
            email: allowed,
            assetId: asset,
            startedAt: existing.startedAt,
          }).catch((err) => console.error('alien-generate re-enqueue', err));
        }
        return res.status(202).json({
          ok: true,
          status: 'running',
          job: existing,
          worker: existing.driver === 'worker',
        });
      }
    }

    if (!CHARACTER_GENERATION_PAYMENT_DISABLED) {
      const credit = await findPaidUnusedCredit(allowed, asset);
      if (!credit) {
        return res.status(402).json({
          error: 'Character generation payment required',
          code: 'payment_required',
        });
      }
    }

    const startedAt = new Date().toISOString();
    const job: AlienGenerateJob = {
      email: allowed,
      assetId: asset,
      status: 'running',
      phase: 'compose',
      progress: 1,
      driver: useWorker ? 'worker' : 'client',
      startedAt,
      updatedAt: startedAt,
    };
    await writeAlienGenerateJob(job);

    if (useWorker) {
      try {
        const queued = await enqueueAlienGenerateWorker({
          email: allowed,
          assetId: asset,
          startedAt,
        });
        if (!queued.enqueued) {
          console.error('alien-generate enqueue skipped', queued.reason);
        }
      } catch (err) {
        console.error('alien-generate enqueue', err);
        const message =
          err instanceof Error ? err.message : 'Could not start character worker';
        await writeAlienGenerateJob({
          ...job,
          status: 'error',
          error: message,
          finishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return res.status(500).json({ error: message });
      }
    }

    return res.status(202).json({
      ok: true,
      status: 'running',
      job,
      worker: useWorker,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not start generation';
    console.error('alien-generate POST', err);
    return res.status(500).json({ error: message });
  }
};

export default handler;
