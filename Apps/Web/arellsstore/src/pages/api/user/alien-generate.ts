import type { NextApiRequest, NextApiResponse } from 'next';
import { assertUserEmailMatchesSession } from '../../../lib/auth/requireUserApi';
import {
  continueAfterResponse,
  readAlienGenerateJob,
  runAlienGeneratePipeline,
  writeAlienGenerateJob,
} from '../../../lib/server/alienGenerateJob';
import { normalizeAlienPhotoAsset } from '../../../lib/server/alienPhoto';
import { findPaidUnusedCredit } from '../../../lib/server/characterGenerationCredit';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  // Compose + both loops — same ceiling as alien-videos.
  maxDuration: 800,
};

/**
 * POST — start full character generate (compose + loops) and return immediately.
 * Work continues on the server after the response (set-and-forget).
 * GET  — poll job status for the signed-in user.
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

  try {
    const existing = await readAlienGenerateJob(allowed, asset);
    if (existing?.status === 'running') {
      const startedMs = Date.parse(existing.startedAt || '') || 0;
      const ageMs = Date.now() - startedMs;
      /* Reuse in-flight job; allow restart if a prior run looks wedged. */
      if (ageMs >= 0 && ageMs < 20 * 60 * 1000) {
        return res.status(202).json({ ok: true, status: 'running', job: existing });
      }
    }

    const credit = await findPaidUnusedCredit(allowed, asset);
    if (!credit) {
      return res.status(402).json({
        error: 'Character generation payment required',
        code: 'payment_required',
      });
    }

    const startedAt = new Date().toISOString();
    const job = {
      email: allowed,
      assetId: asset,
      status: 'running' as const,
      phase: 'compose' as const,
      startedAt,
      updatedAt: startedAt,
    };
    await writeAlienGenerateJob(job);

    continueAfterResponse(
      runAlienGeneratePipeline(allowed, asset).catch((err) => {
        console.error('alien-generate pipeline', err);
      })
    );

    return res.status(202).json({ ok: true, status: 'running', job });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not start generation';
    console.error('alien-generate POST', err);
    return res.status(500).json({ error: message });
  }
};

export default handler;
