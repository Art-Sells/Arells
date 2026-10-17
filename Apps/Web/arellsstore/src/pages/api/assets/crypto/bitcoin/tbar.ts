import type { NextApiRequest, NextApiResponse } from 'next';
import { listTBAR } from '../../../../../lib/assets/crypto/TBAR/list';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const days = await listTBAR();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ days });
  } catch (err) {
    console.error('tbar', err);
    return res.status(200).json({ days: [] });
  }
}
