import AWS from 'aws-sdk';
import axios from 'axios';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const HISTORY_REFRESH_MS = 24 * 60 * 60 * 1000;

export type VapaAssetConfig = {
  id: string;
  s3Key: string;
  priceUrl: string;
  historyUrl: string;
};

const isoDateFromDay = (day: string): string => `${day}T00:00:00.000Z`;

const buildMonotonicHistory = (prices: [number, number][], marketCaps: [number, number][]) => {
  const dailyMap = new Map<string, number>();
  const dailyCapMap = new Map<string, number>();
  for (const [timestamp, price] of prices) {
    if (typeof price !== 'number') continue;
    const day = new Date(timestamp).toISOString().slice(0, 10);
    dailyMap.set(day, price);
  }
  for (const [timestamp, cap] of marketCaps) {
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

  return { history, vapaMarketCap, highestPriceEver: maxPrice, highestPriceDate: maxDate ? isoDateFromDay(maxDate) : null };
};

export async function refreshVapa(config: VapaAssetConfig) {
  let storedVAPA = 0;
  let storedVapaDate: string | null = null;
  let storedHistory: { date: string; price: number }[] = [];
  let storedHistoryLastUpdated: number | null = null;
  let storedVapaMarketCap: number[] = [];
  let fileExists = false;

  try {
    const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: config.s3Key }).promise();
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
      console.error(`[vapa:${config.id}] read error`, error);
    }
  }

  let currentPrice = storedVAPA;
  try {
    const currentPriceResponse = await axios.get(config.priceUrl, {
      timeout: 5000,
      headers: COINGECKO_API_KEY ? { 'x-cg-pro-api-key': COINGECKO_API_KEY } : undefined
    });
    const val = currentPriceResponse.data?.ethereum?.usd ?? currentPriceResponse.data?.bitcoin?.usd ?? currentPriceResponse.data?.[config.id]?.usd;
    if (typeof val === 'number') currentPrice = val;
  } catch {
    // keep stored
  }

  let highestPriceEver = 0;
  let highestPriceDate: string | null = null;
  let history = storedHistory;
  let vapaMarketCap = storedVapaMarketCap;
  let historyLastUpdated = storedHistoryLastUpdated;
  const missingVapaMarketCap = !Array.isArray(storedVapaMarketCap) || storedVapaMarketCap.length === 0;
  const shouldRefreshHistory = !storedHistory.length || !storedHistoryLastUpdated || Date.now() - storedHistoryLastUpdated > HISTORY_REFRESH_MS;

  if (shouldRefreshHistory || missingVapaMarketCap) {
    try {
      const historicalResponse = await axios.get(config.historyUrl, {
        timeout: 8000,
        headers: COINGECKO_API_KEY ? { 'x-cg-pro-api-key': COINGECKO_API_KEY } : undefined
      });
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
    } catch (err) {
      console.error(`[vapa:${config.id}] history fetch failed`, err);
    }
  }
  if (!highestPriceEver && history.length > 0) {
    const lastEntry = history[history.length - 1];
    highestPriceEver = lastEntry.price;
    highestPriceDate = isoDateFromDay(lastEntry.date);
  }

  const newVAPA = Math.max(storedVAPA, currentPrice, highestPriceEver);
  let newVapaDate = storedVapaDate;
  const currentPriceDate = new Date().toISOString();
  if (newVAPA > storedVAPA) {
    if (newVAPA === highestPriceEver && highestPriceDate) newVapaDate = highestPriceDate;
    else newVapaDate = currentPriceDate;
  }

  const shouldWrite = !fileExists || newVAPA > storedVAPA || shouldRefreshHistory || missingVapaMarketCap;
  if (shouldWrite) {
    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: config.s3Key,
        Body: JSON.stringify({ vapa: newVAPA, vapaDate: newVapaDate, history, vapaMarketCap, historyLastUpdated }),
        ContentType: 'application/json',
      })
      .promise();
  }

  return { vapa: newVAPA, vapaDate: newVapaDate ?? null, history, vapaMarketCap, historyLastUpdated, price: currentPrice };
}
