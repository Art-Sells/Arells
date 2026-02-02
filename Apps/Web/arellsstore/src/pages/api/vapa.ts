// pages/api/vapa.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import axios from 'axios';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const BITCOIN_VAPA_KEY = 'vavity/bitcoinVAPA.json';
const HISTORY_REFRESH_MS = 24 * 60 * 60 * 1000;

const isoDateFromDay = (day: string): string => `${day}T00:00:00.000Z`;

const buildMonotonicHistory = (prices: [number, number][]) => {
  const dailyMap = new Map<string, number>();
  for (const entry of prices) {
    const [timestamp, price] = entry;
    if (typeof price !== 'number') continue;
    const day = new Date(timestamp).toISOString().slice(0, 10);
    dailyMap.set(day, price);
  }

  const dailyEntries = Array.from(dailyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const history: { date: string; price: number }[] = [];
  let maxPrice = 0;
  let maxDate: string | null = null;

  for (const [date, price] of dailyEntries) {
    const lastPrice = history.length ? history[history.length - 1].price : 0;
    const adjusted = Math.max(price, lastPrice);
    history.push({ date, price: adjusted });
    if (adjusted > maxPrice) {
      maxPrice = adjusted;
      maxDate = date;
    }
  }

  return {
    history,
    highestPriceEver: maxPrice,
    highestPriceDate: maxDate ? isoDateFromDay(maxDate) : null
  };
};

/**
 * Fetch current Bitcoin price and update VAPA if higher
 * This ensures VAPA is always up-to-date and never decreases
 */
async function fetchAndUpdateVAPA(): Promise<{ vapa: number; vapaDate: string | null }> {
  // First, check if file exists - if not, we'll create it
  let storedVAPA = 0;
  let storedVapaDate: string | null = null;
  let storedHistory: { date: string; price: number }[] = [];
  let storedHistoryLastUpdated: number | null = null;
  let fileExists = false;
  try {
    const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: BITCOIN_VAPA_KEY }).promise();
    if (response.Body) {
      const data = JSON.parse(response.Body.toString());
      storedVAPA = data.vapa || 0;
      storedVapaDate = data.vapaDate ?? data.lastUpdated ?? null;
      storedHistory = Array.isArray(data.history) ? data.history : [];
      storedHistoryLastUpdated = typeof data.historyLastUpdated === 'number' ? data.historyLastUpdated : null;
      fileExists = true;
    }
  } catch (error: any) {
    if (error.code !== 'NoSuchKey') {
      console.error('[vapa] Error fetching stored VAPA:', error);
    }
    fileExists = false;
  }
  
  try {
    // Fetch current Bitcoin price
    let currentPrice = 0;
    const currentPriceDate = new Date().toISOString();
    try {
      const currentPriceResponse = await axios.get('http://localhost:3000/api/bitcoinPrice', { 
        timeout: 3000 
      }).catch(() => {
        // Try relative URL if localhost fails (for production)
        return axios.get('/api/bitcoinPrice', { timeout: 3000 });
      });
      currentPrice = currentPriceResponse.data?.bitcoin?.usd || 0;
    } catch (error) {
      console.warn('[vapa] Failed to fetch current price, using stored value or 0');
    }
    
    // Fetch historical data to compute highest price ever and store monotonic history
    let highestPriceEver = 0;
    let highestPriceDate: string | null = null;
    let history: { date: string; price: number }[] = storedHistory;
    let historyLastUpdated: number | null = storedHistoryLastUpdated;
    const shouldRefreshHistory =
      !storedHistory.length ||
      !storedHistoryLastUpdated ||
      Date.now() - storedHistoryLastUpdated > HISTORY_REFRESH_MS;
    try {
      if (shouldRefreshHistory) {
        const historicalResponse = await axios.get('http://localhost:3000/api/fetchHistoricalData', {
          timeout: 5000
        }).catch(() => {
          return axios.get('/api/fetchHistoricalData', { timeout: 5000 });
        });
        const prices: [number, number][] = historicalResponse.data?.prices || [];
        if (prices.length > 0) {
          const result = buildMonotonicHistory(prices);
          history = result.history;
          historyLastUpdated = Date.now();
          highestPriceEver = result.highestPriceEver;
          highestPriceDate = result.highestPriceDate;
        }
      }
    } catch (error) {
      // Ignore errors - use current price only
    }
    if (!highestPriceEver && history.length > 0) {
      const lastEntry = history[history.length - 1];
      highestPriceEver = lastEntry.price;
      highestPriceDate = isoDateFromDay(lastEntry.date);
    }
    
    // Calculate new VAPA: use Math.max to ensure it never decreases
    const newVAPA = Math.max(
      storedVAPA,      // Current stored VAPA (never decreases)
      currentPrice,    // Current Bitcoin price
      highestPriceEver // Highest price ever from historical data
    );
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
    
    // ALWAYS create the file if it doesn't exist, OR update if new VAPA is higher
    if (!fileExists) {
      // File doesn't exist - create it with current VAPA (even if 0)
      await s3.putObject({
        Bucket: BUCKET_NAME,
        Key: BITCOIN_VAPA_KEY,
        Body: JSON.stringify({
          vapa: newVAPA,
          vapaDate: newVapaDate,
          history,
          historyLastUpdated
        }),
        ContentType: 'application/json',
      }).promise();
      console.log('[vapa] Created VAPA file:', { vapa: newVAPA });
    } else if (newVAPA > storedVAPA || shouldRefreshHistory) {
      // File exists - update if VAPA is higher or history refreshed
      await s3.putObject({
        Bucket: BUCKET_NAME,
        Key: BITCOIN_VAPA_KEY,
        Body: JSON.stringify({
          vapa: newVAPA,
          vapaDate: newVapaDate,
          history,
          historyLastUpdated
        }),
        ContentType: 'application/json',
      }).promise();
      console.log('[vapa] Updated VAPA:', { old: storedVAPA, new: newVAPA });
    }
    
    return { vapa: newVAPA, vapaDate: newVapaDate ?? null };
  } catch (error: any) {
    console.error('[vapa] Error fetching/updating VAPA:', error);
    // Try to get stored VAPA if available
    let storedVAPA = 0;
    let storedVapaDate: string | null = null;
    let storedHistory: { date: string; price: number }[] = [];
    let storedHistoryLastUpdated: number | null = null;
    let fileExists = false;
    try {
    const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: BITCOIN_VAPA_KEY }).promise();
      if (response.Body) {
        const data = JSON.parse(response.Body.toString());
        storedVAPA = data.vapa || 0;
        storedVapaDate = data.vapaDate ?? data.lastUpdated ?? null;
        storedHistory = Array.isArray(data.history) ? data.history : [];
        storedHistoryLastUpdated = typeof data.historyLastUpdated === 'number' ? data.historyLastUpdated : null;
        fileExists = true;
      }
    } catch (err: any) {
      // File doesn't exist - create it with 0 as fallback
      if (err.code === 'NoSuchKey') {
        try {
          await s3.putObject({
            Bucket: BUCKET_NAME,
        Key: BITCOIN_VAPA_KEY,
            Body: JSON.stringify({ vapa: 0, vapaDate: null, history: [], historyLastUpdated: null }),
            ContentType: 'application/json',
          }).promise();
          console.log('[vapa] Created VAPA file with fallback value 0 due to error');
        } catch (createError) {
          console.error('[vapa] Failed to create VAPA file even with fallback:', createError);
        }
      }
    }
    return { vapa: storedVAPA, vapaDate: storedVapaDate };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // GET: Fetch current VAPA (auto-updates if price is higher)
    try {
      // First, ensure file exists - create it if it doesn't
      let fileExists = false;
      try {
        await s3.headObject({ Bucket: BUCKET_NAME, Key: BITCOIN_VAPA_KEY }).promise();
        fileExists = true;
      } catch (error: any) {
        if (error.code === 'NoSuchKey') {
          // File doesn't exist - create it immediately with initial value
          const initialVapa = 0;
          await s3.putObject({
            Bucket: BUCKET_NAME,
        Key: BITCOIN_VAPA_KEY,
            Body: JSON.stringify({ vapa: initialVapa, vapaDate: null, history: [], historyLastUpdated: null }),
            ContentType: 'application/json',
          }).promise();
          console.log('[vapa] Created VAPA file on first GET request');
          // Now fetch and update with actual price
          const { vapa, vapaDate } = await fetchAndUpdateVAPA();
          return res.status(200).json({ vapa, vapaDate });
        } else {
          throw error;
        }
      }
      
      // File exists - fetch and update
      const { vapa, vapaDate } = await fetchAndUpdateVAPA();
      // After update, load stored history to return to clients
      try {
        const stored = await s3.getObject({ Bucket: BUCKET_NAME, Key: BITCOIN_VAPA_KEY }).promise();
        if (stored.Body) {
          const data = JSON.parse(stored.Body.toString());
          return res.status(200).json({
            vapa,
            vapaDate,
            history: Array.isArray(data.history) ? data.history : [],
            historyLastUpdated: data.historyLastUpdated ?? null
          });
        }
      } catch (readErr) {
        // fall through to default return if history read fails
      }
      return res.status(200).json({ vapa, vapaDate, history: [], historyLastUpdated: null });
    } catch (error: any) {
      console.error('[vapa] Error in GET handler:', error);
      // Even on error, try to return stored value or create file
      try {
      const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: BITCOIN_VAPA_KEY }).promise();
        if (response.Body) {
          const data = JSON.parse(response.Body.toString());
          return res.status(200).json({
            vapa: data.vapa || 0,
            vapaDate: data.vapaDate ?? data.lastUpdated ?? null,
            history: Array.isArray(data.history) ? data.history : [],
            historyLastUpdated: data.historyLastUpdated ?? null
          });
        }
      } catch (err: any) {
        // File doesn't exist - create it with 0
        if (err.code === 'NoSuchKey') {
          await s3.putObject({
            Bucket: BUCKET_NAME,
            Key: BITCOIN_VAPA_KEY,
            Body: JSON.stringify({ vapa: 0, vapaDate: null, history: [], historyLastUpdated: null }),
            ContentType: 'application/json',
          }).promise();
          return res.status(200).json({ vapa: 0, vapaDate: null, history: [], historyLastUpdated: null });
        }
      }
      return res.status(500).json({ error: 'Failed to fetch VAPA', details: error.message });
    }
  } else if (req.method === 'POST') {
    // POST: Update VAPA (only if new value is higher)
    const { vapa: requestedVAPA } = req.body as { vapa?: number };
    
    try {
      // Get current stored VAPA
      let storedVAPA = 0;
      let storedVapaDate: string | null = null;
      let storedHistory: { date: string; price: number }[] = [];
      let storedHistoryLastUpdated: number | null = null;
      let fileExists = false;
      try {
        const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: BITCOIN_VAPA_KEY }).promise();
        if (response.Body) {
          const data = JSON.parse(response.Body.toString());
          storedVAPA = data.vapa || 0;
          storedVapaDate = data.vapaDate ?? data.lastUpdated ?? null;
          storedHistory = Array.isArray(data.history) ? data.history : [];
          storedHistoryLastUpdated = typeof data.historyLastUpdated === 'number' ? data.historyLastUpdated : null;
          fileExists = true;
        }
      } catch (error: any) {
        if (error.code !== 'NoSuchKey') {
          throw error;
        }
        // File doesn't exist yet - will create it
        fileExists = false;
      }
      
      // Also fetch current price to ensure we have the latest
      const currentVAPA = await fetchAndUpdateVAPA();
      
      // Use Math.max to ensure VAPA never decreases
      const finalVAPA = Math.max(
        storedVAPA,
        currentVAPA.vapa,
        requestedVAPA || 0
      );
      let finalVapaDate = storedVapaDate;
      if (finalVAPA > storedVAPA) {
        finalVapaDate = currentVAPA.vapaDate ?? storedVapaDate ?? new Date().toISOString();
      }
      
      // ALWAYS create the file if it doesn't exist, OR update if final VAPA is higher
      if (!fileExists) {
        // File doesn't exist - create it with final VAPA (even if 0)
        await s3.putObject({
          Bucket: BUCKET_NAME,
          Key: BITCOIN_VAPA_KEY,
          Body: JSON.stringify({
            vapa: finalVAPA,
            vapaDate: finalVapaDate,
            history: storedHistory,
            historyLastUpdated: storedHistoryLastUpdated
          }),
          ContentType: 'application/json',
        }).promise();
        console.log('[vapa] Created VAPA file via POST:', { vapa: finalVAPA });
      } else if (finalVAPA > storedVAPA) {
        // File exists - only update if final VAPA is higher
        await s3.putObject({
          Bucket: BUCKET_NAME,
          Key: BITCOIN_VAPA_KEY,
          Body: JSON.stringify({
            vapa: finalVAPA,
            vapaDate: finalVapaDate,
            history: storedHistory,
            historyLastUpdated: storedHistoryLastUpdated
          }),
          ContentType: 'application/json',
        }).promise();
        console.log('[vapa] Updated VAPA via POST:', { old: storedVAPA, new: finalVAPA });
      }
      
      return res.status(200).json({ vapa: finalVAPA, vapaDate: finalVapaDate });
    } catch (error: any) {
      console.error('[vapa] Error in POST handler:', error);
      return res.status(500).json({ error: 'Failed to update VAPA', details: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}

