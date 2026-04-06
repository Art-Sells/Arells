import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from './session';

export async function assertUserEmailMatchesSession(
  req: NextApiRequest,
  res: NextApiResponse,
  emailFromClient: string | undefined
): Promise<string | null> {
  const session = await getSessionFromRequest(req);
  const normalized = (emailFromClient || '').trim().toLowerCase();
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  if (!normalized || session.email !== normalized) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }
  return session.email;
}
