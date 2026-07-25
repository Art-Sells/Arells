import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '../../../lib/auth/session';
import {
  getUserPrefsByEmail,
  prefsResponseFromRecord,
  putUserPrefs,
} from '../../../lib/user/s3UserPrefs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.S3_BUCKET_NAME) {
    return res.status(503).json({ error: 'S3 not configured' });
  }

  try {
    if (req.method === 'GET') {
      const record = await getUserPrefsByEmail(session.email);
      return res.status(200).json(prefsResponseFromRecord(record));
    }

    const body = typeof req.body === 'object' && req.body != null ? req.body : {};
    if (body.payoutsMessageChecked !== true) {
      return res.status(400).json({ error: 'payoutsMessageChecked must be true' });
    }

    await putUserPrefs(session.email, {
      email: session.email,
      payoutsMessageChecked: true,
      updatedAt: Date.now(),
    });

    return res.status(200).json({ payoutsMessageChecked: true });
  } catch (e) {
    console.error('[user/prefs]', e);
    return res.status(500).json({ error: 'Failed to update prefs' });
  }
}
