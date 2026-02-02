import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

interface MockEntry {
  token: string;
  purchasedValue: number;
  currentValue: number;
  profitLoss: number;
  datePurchased: string;
}

const generateMockPortfolio = (vapa: number, history: { date: string; price: number }[]): MockEntry[] => {
  const entries: MockEntry[] = [];
  if (!vapa || !history.length) return entries;
  const clamp = (n: number) => (Number.isFinite(n) ? n : 0);
  const now = Date.now();
  for (let i = 0; i < 100; i++) {
    const amount = 0.01 + (i % 5) * 0.005;
    const hIdx = i % history.length;
    const histPrice = clamp(history[hIdx].price);
    // Introduce some losses: every 3rd entry uses a purchase price above current VAPA
    const isLoss = (i % 3) === 2;
    const purchasePrice = isLoss ? vapa * 1.05 : histPrice;
    const purchasedValue = amount * purchasePrice;
    const currentValue = amount * vapa;
    const profitLoss = currentValue - purchasedValue;
    const rawDate = history[hIdx]?.date;
    const datePurchased =
      typeof rawDate === 'string' && rawDate.length > 0
        ? rawDate
        : new Date(now - hIdx * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    entries.push({
      token: 'BTC',
      purchasedValue,
      currentValue,
      profitLoss,
      datePurchased
    });
  }
  return entries;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let vapa = 0;
    let history: { date: string; price: number }[] = [];
    try {
      const resp = await axios.get('http://localhost:3000/api/vapa').catch(() => axios.get('/api/vapa'));
      vapa = typeof resp.data?.vapa === 'number' ? resp.data.vapa : 0;
      history = Array.isArray(resp.data?.history) ? resp.data.history : [];
    } catch {
      vapa = 0;
      history = [];
    }

    const portfolio = generateMockPortfolio(vapa, history);
    return res.status(200).json({ portfolio });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to generate mock portfolio', details: error?.message });
  }
}
