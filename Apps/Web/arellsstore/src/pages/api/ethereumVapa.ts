// pages/api/ethereumVapa.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import axios from 'axios';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const ETH_VAPA_KEY = 'vavity/ethereumVAPA.json';
const HISTORY_REFRESH_MS = 24 * 60 * 60 * 1000;

const isoDateFromDay = (day: string): string => `${day}T00:00:00.000Z`;

const buildMonotonicHistory = (prices: [number, number][], marketCaps: [number, number][]) => {
  const dailyMap = new Map<string, number>();
  const dailyCapMap = new Map<string, number>();
  for (const entry of prices) {
    const [timestamp, price] = entry;
    if (typeof price !== 'number') continue;
    const day = new Date(timestamp).toISOString().slice(0, 10);
    dailyMap.set(day, price);
  }
  for (const entry of marketCaps) {
    const [timestamp, cap] = entry;
    if (typeof cap !== 'number') continue;
    const day = new Date(timestamp).toISOString().slice(0, 10);
    dailyCapMap.set(day, cap);
  }

  const dailyEntries = Array.from(dailyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const history: { date: string; price: number }[] = [];
  const vapaMarketCap: number[] = [];
  let maxPrice = 0;
  let maxDate: string | null = null;

  for (const [date, price] of dailyEntries) {
    const lastPrice = history.length ? history[history.length - 1].price : 0;
    const adjusted = Math.max(price, lastPrice);
    history.push({ date, price: adjusted });
    const cap = dailyCapMap.get(date);
    const supply = cap && price > 0 ? cap / price : null;
    const computedMarketCap = supply ? adjusted * supply : null;
    vapaMarketCap.push(typeof computedMarketCap === 'number' ? computedMarketCap : 0);
    if (adjusted > maxPrice) {
      maxPrice = adjusted;
      maxDate = date;
    }
  }

  return {
    history,
    vapaMarketCap,
    highestPriceEver: maxPrice,
    highestPriceDate: maxDate ? isoDateFromDay(maxDate) : null
  };
};

async function fetchAndUpdateEthVAPA(): Promise<{ vapa: number; vapaDate: string | null }> {
  let storedVAPA = 0;
  let storedVapaDate: string | null = null;
  let storedHistory: { date: string; price: number }[] = [];
  let storedHistoryLastUpdated: number | null = null;
  let storedVapaMarketCap: number[] = [];
  let fileExists = false;

  try {
    const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: ETH_VAPA_KEY }).promise();
    if (response.Body) {
      const data = JSON.parse(response.Body.toString());
      storedVAPA = data.vapa || 0;
      storedVapaDate = data.vapaDate ?? data.lastUpdated ?? null;
      storedHistory = Array.isArray(data.history) ? data.history : [];
      storedHistoryLastUpdated = typeof data.historyLastUpdated === 'number' ? data.historyLastUpdated : null;
      storedVapaMarketCap = Array.isArray(data.vapaMarketCap) ? data.vapaMarketCap : [];
      fileExists = true;
    }
  } catch (error: any) {
    if (error.code !== 'NoSuchKey') {
      console.error('[ethereumVapa] Error fetching stored VAPA:', error);
    }
    fileExists = false;
  }

  try {
    let currentPrice = 0;
    const currentPriceDate = new Date().toISOString();
    try {
      const currentPriceResponse = await axios
        .get('http://localhost:3000/api/ethereumPrice', { timeout: 3000 })
        .catch(() => axios.get('/api/ethereumPrice', { timeout: 3000 }));
      currentPrice = currentPriceResponse.data?.ethereum?.usd || 0;
    } catch {
      // swallow; use stored
    }

    let highestPriceEver = 0;
    let highestPriceDate: string | null = null;
    let history: { date: string; price: number }[] = storedHistory;
    let vapaMarketCap: number[] = storedVapaMarketCap;
    let historyLastUpdated: number | null = storedHistoryLastUpdated;
    const missingVapaMarketCap = !Array.isArray(storedVapaMarketCap) || storedVapaMarketCap.length === 0;
    const shouldRefreshHistory =
      !storedHistory.length || !storedHistoryLastUpdated || Date.now() - storedHistoryLastUpdated > HISTORY_REFRESH_MS;

    if (shouldRefreshHistory || missingVapaMarketCap) {
      try {
        const historicalResponse = await axios
          .get('http://localhost:3000/api/fetchEthereumHistoricalData', { timeout: 5000 })
          .catch(() => axios.get('/api/fetchEthereumHistoricalData', { timeout: 5000 }));
        const prices: [number, number][] = historicalResponse.data?.prices || [];
        const caps: [number, number][] = historicalResponse.data?.market_caps || [];
        if (prices.length > 0) {
          const result = buildMonotonicHistory(prices, caps);
          history = result.history;
          vapaMarketCap = result.vapaMarketCap;
          historyLastUpdated = Date.now();
          highestPriceEver = result.highestPriceEver;
          highestPriceDate = result.highestPriceDate;
        }
      } catch {
        // ignore
      }
    }
    if (!highestPriceEver && history.length > 0) {
      const lastEntry = history[history.length - 1];
      highestPriceEver = lastEntry.price;
      highestPriceDate = isoDateFromDay(lastEntry.date);
    }

    const newVAPA = Math.max(storedVAPA, currentPrice, highestPriceEver);
    let newVapaDate = storedVapaDate;
    if (newVAPA > storedVAPA) {
      if (newVAPA === highestPriceEver && highestPriceDate) {
        newVapaDate = highestPriceDate;
      } else if (newVAPA === currentPrice) {
        newVapaDate = currentPriceDate;
      } else if (!newVapaDate) {
        newVapaDate = currentPriceDate;
      }
    }

    if (!fileExists) {
      await s3
        .putObject({
          Bucket: BUCKET_NAME,
          Key: ETH_VAPA_KEY,
          Body: JSON.stringify({
            vapa: newVAPA,
            vapaDate: newVapaDate,
            history,
            vapaMarketCap,
            historyLastUpdated
          }),
          ContentType: 'application/json'
        })
        .promise();
    } else if (newVAPA > storedVAPA || shouldRefreshHistory || missingVapaMarketCap) {
      await s3
        .putObject({
          Bucket: BUCKET_NAME,
          Key: ETH_VAPA_KEY,
          Body: JSON.stringify({
            vapa: newVAPA,
            vapaDate: newVapaDate,
            history,
            vapaMarketCap,
            historyLastUpdated
          }),
          ContentType: 'application/json'
        })
        .promise();
    }

    return { vapa: newVAPA, vapaDate: newVapaDate ?? null };
  } catch (error: any) {
    console.error('[ethereumVapa] Error fetching/updating VAPA:', error);
    let fallbackVapa = 0;
    let fallbackDate: string | null = null;
    try {
      const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: ETH_VAPA_KEY }).promise();
      if (response.Body) {
        const data = JSON.parse(response.Body.toString());
        fallbackVapa = data.vapa || 0;
        fallbackDate = data.vapaDate ?? data.lastUpdated ?? null;
      }
    } catch {
      // ignore
    }
    return { vapa: fallbackVapa, vapaDate: fallbackDate };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      let fileExists = false;
      try {
        await s3.headObject({ Bucket: BUCKET_NAME, Key: ETH_VAPA_KEY }).promise();
        fileExists = true;
      } catch (error: any) {
        if (error.code === 'NoSuchKey') {
          const initialVapa = 0;
          await s3
            .putObject({
              Bucket: BUCKET_NAME,
              Key: ETH_VAPA_KEY,
              Body: JSON.stringify({
                vapa: initialVapa,
                vapaDate: null,
                history: [],
                vapaMarketCap: [],
                historyLastUpdated: null
              }),
              ContentType: 'application/json'
            })
            .promise();
          const { vapa, vapaDate } = await fetchAndUpdateEthVAPA();
          return res.status(200).json({ vapa, vapaDate });
        } else {
          throw error;
        }
      }

      const { vapa, vapaDate } = await fetchAndUpdateEthVAPA();
      if (!fileExists) {
        return res.status(200).json({ vapa, vapaDate });
      }
      return res.status(200).json({ vapa, vapaDate });
    } catch (error: any) {
      console.error('[ethereumVapa] Error in GET:', error);
      return res.status(500).json({ error: 'Failed to fetch Ethereum VAPA' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
