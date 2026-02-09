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
  const normalizedHistory = history
    .filter((item) => typeof item?.date === 'string' && typeof item?.price === 'number')
    .map((item) => ({ date: item.date, price: clamp(item.price) }))
    .filter((item) => item.date && item.price > 0);
  if (!normalizedHistory.length) return entries;

  const pickWeightedIndex = (len: number) => {
    const r = Math.random();
    const bias = 2.2; // >1 biases toward recent entries
    const pos = Math.pow(r, bias);
    const idx = Math.floor((1 - pos) * (len - 1));
    return Math.max(0, Math.min(len - 1, idx));
  };

  for (let i = 0; i < 100; i++) {
    const amount = 0.05 + Math.random() * 0.25;
    const hIdx = pickWeightedIndex(normalizedHistory.length);
    const histPrice = normalizedHistory[hIdx].price;
    const isLoss = Math.random() < 0.25;
    const purchasePrice = isLoss ? vapa * (1.02 + Math.random() * 0.08) : histPrice;
    const purchasedValue = amount * purchasePrice;
    const currentValue = amount * vapa;
    const profitLoss = currentValue - purchasedValue;
    const datePurchased = normalizedHistory[hIdx].date;
    entries.push({
      token: 'ETH',
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
      const resp = await axios
        .get('http://localhost:3000/api/assets/crypto/ethereum/ethereumvapa')
        .catch(() => axios.get('/api/assets/crypto/ethereum/ethereumvapa'));
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
