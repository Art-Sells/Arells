import AWS from 'aws-sdk';
import axios from 'axios';

const s3 = new AWS.S3({
  region: process.env.WS_REGION,
  accessKeyId: process.env.WS_ACCESS_KEY_ID,
  secretAccessKey: process.env.WS_SECRET_ACCESS_KEY,
});
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const HISTORY_REFRESH_MS = 60 * 60 * 1000;

export type VapaAssetConfig = {
  id: string;
  s3Key: string;
  priceUrl: string;
  historyUrl: string;
};

const isoDateFromDay = (day: string): string => `${day}T00:00:00.000Z`;

const buildDailyHistory = (prices: [number, number][], marketCaps: [number, number][]) => {
  const dailyMap = new Map<string, number>();
  const dailyCapMap = new Map<string, number>();
  for (const [timestamp, price] of prices) {
    if (typeof price !== 'number') continue;
    const day = new Date(timestamp).toISOString().slice(0, 10);
    // keep the last-seen point for the day (market_chart is ordered, so later points overwrite earlier ones)
    dailyMap.set(day, price);
  }
  for (const [timestamp, cap] of marketCaps) {
    if (typeof cap !== 'number') continue;
    const day = new Date(timestamp).toISOString().slice(0, 10);
    dailyCapMap.set(day, cap);
  }

  const dailyEntries = Array.from(dailyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const history: { date: string; price: number }[] = [];
  const marketCap: number[] = [];
  let maxPrice = 0;
  let maxDate: string | null = null;

  let lastKnownSupply: number | null = null;
  for (const [date, price] of dailyEntries) {
    history.push({ date, price });
    const cap = dailyCapMap.get(date);
    if (cap != null && cap > 0 && price > 0) {
      lastKnownSupply = cap / price;
      marketCap.push(cap);
    } else if (lastKnownSupply != null && price > 0) {
      marketCap.push(price * lastKnownSupply);
    } else {
      marketCap.push(0);
    }
    if (price > maxPrice) {
      maxPrice = price;
      maxDate = date;
    }
  }

  return { history, marketCap, highestPriceEver: maxPrice, highestPriceDate: maxDate ? isoDateFromDay(maxDate) : null };
};

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

  let lastKnownSupply: number | null = null;
  for (const [date, price] of dailyEntries) {
    const lastPrice = history.length ? history[history.length - 1].price : 0;
    const adjusted = Math.max(price, lastPrice);
    history.push({ date, price: adjusted });
    const cap = dailyCapMap.get(date);
    if (cap != null && cap > 0 && price > 0) {
      lastKnownSupply = cap / price;
    }
    const supply = lastKnownSupply;
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
  // Solid series (monotonic/VAPA)
  let storedHistory: { date: string; price: number }[] = [];
  let storedHistoryLastUpdated: number | null = null;
  let storedVapaMarketCap: number[] = [];
  // Liquid series (real/raw)
  let storedRealHistory: { date: string; price: number }[] = [];
  let storedRealMarketCap: number[] = [];
  let storedPrice: number | null = null;
  let fileExists = false;

  try {
    const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: config.s3Key }).promise();
    if (response.Body) {
      const data = JSON.parse(response.Body.toString());
      storedVAPA = data.vapa || 0;
      storedVapaDate = data.vapaDate ?? data.lastUpdated ?? null;
      // Prefer new Liquid/Solid keys; fall back to legacy keys.
      storedHistory = Array.isArray(data.solidHistory)
        ? data.solidHistory
        : Array.isArray(data.history)
          ? data.history
          : [];
      storedHistoryLastUpdated = typeof data.historyLastUpdated === 'number' ? data.historyLastUpdated : null;
      storedVapaMarketCap = Array.isArray(data.solidMarketCap)
        ? data.solidMarketCap
        : Array.isArray(data.vapaMarketCap)
          ? data.vapaMarketCap
          : [];
      storedRealHistory = Array.isArray(data.liquidHistory)
        ? data.liquidHistory
        : Array.isArray(data.realHistory)
          ? data.realHistory
          : [];
      storedRealMarketCap = Array.isArray(data.liquidMarketCap)
        ? data.liquidMarketCap
        : Array.isArray(data.realMarketCap)
          ? data.realMarketCap
          : [];
      storedPrice = typeof data.price === 'number' ? data.price : null;
      fileExists = true;
    }
  } catch (error: any) {
    if (error.code !== 'NoSuchKey') {
      console.error(`[vapa:${config.id}] read error`, error);
    }
  }

    let currentPrice = storedPrice ?? storedVAPA;
    let currentMarketCap: number | null = null;
    try {
    const currentPriceResponse = await axios.get(config.priceUrl, {
      timeout: 5000,
      headers: COINGECKO_API_KEY ? { 'x-cg-pro-api-key': COINGECKO_API_KEY } : undefined
    });
    const assetData = currentPriceResponse.data?.[config.id];
    const val = assetData?.usd;
    if (typeof val === 'number') currentPrice = val;
    const capVal = assetData?.usd_market_cap;
    if (typeof capVal === 'number') currentMarketCap = capVal;
  } catch {
      // keep stored
    }

    let highestPriceEver = 0;
    let highestPriceDate: string | null = null;
  let history = storedHistory;
  let vapaMarketCap = storedVapaMarketCap;
  let realHistory = storedRealHistory;
  let realMarketCap = storedRealMarketCap;
  let historyLastUpdated = storedHistoryLastUpdated;
    const missingVapaMarketCap = !Array.isArray(storedVapaMarketCap) || storedVapaMarketCap.length === 0;
    const missingRealHistory = !Array.isArray(storedRealHistory) || storedRealHistory.length === 0;
    const missingRealMarketCap = !Array.isArray(storedRealMarketCap) || storedRealMarketCap.length === 0;
    const hasZeroCaps = Array.isArray(storedRealMarketCap) && storedRealMarketCap.length > 0 && storedRealMarketCap[storedRealMarketCap.length - 1] === 0;
    const today = new Date().toISOString().slice(0, 10);
    const lastHistoryDate = storedRealHistory.length ? storedRealHistory[storedRealHistory.length - 1].date : null;
    const historyStale = !lastHistoryDate || lastHistoryDate < today;
    const shouldRefreshHistory = !storedHistory.length || !storedHistoryLastUpdated || Date.now() - storedHistoryLastUpdated > HISTORY_REFRESH_MS || historyStale || hasZeroCaps;

    if (shouldRefreshHistory || missingVapaMarketCap || missingRealHistory || missingRealMarketCap) {
      try {
      const historicalResponse = await axios.get(config.historyUrl, {
        timeout: 30000,
        headers: COINGECKO_API_KEY ? { 'x-cg-pro-api-key': COINGECKO_API_KEY } : undefined
      });
        const prices: [number, number][] = historicalResponse.data?.prices || [];
        const caps: [number, number][] = historicalResponse.data?.market_caps || [];
        if (prices.length > 0) {
          const real = buildDailyHistory(prices, caps);
          const result = buildMonotonicHistory(prices, caps);
          realHistory = real.history;
          realMarketCap = real.marketCap;
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

  if (currentMarketCap != null && realMarketCap.length > 0) {
    realMarketCap[realMarketCap.length - 1] = currentMarketCap;
  }
  if (currentMarketCap != null && vapaMarketCap.length > 0 && realMarketCap.length > 0) {
    const lastRealPrice = realHistory.length ? realHistory[realHistory.length - 1].price : currentPrice;
    const supply = lastRealPrice > 0 ? currentMarketCap / lastRealPrice : null;
    if (supply) {
      vapaMarketCap[vapaMarketCap.length - 1] = newVAPA * supply;
    }
  }

  const priceChanged = storedPrice !== currentPrice;
  const shouldWrite =
    !fileExists ||
    newVAPA > storedVAPA ||
    shouldRefreshHistory ||
    missingVapaMarketCap ||
    missingRealHistory ||
    missingRealMarketCap ||
    storedPrice == null ||
    priceChanged;
  if (shouldWrite) {
    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: config.s3Key,
        Body: JSON.stringify({
          vapa: newVAPA,
          vapaDate: newVapaDate,
          price: currentPrice,
          // Solid series (monotonic/VAPA)
          solidHistory: history,
          solidMarketCap: vapaMarketCap,
          // Liquid series (real/raw)
          liquidHistory: realHistory,
          liquidMarketCap: realMarketCap,
          historyLastUpdated
        }),
        ContentType: 'application/json',
      })
      .promise();
  }

  return {
    vapa: newVAPA,
    vapaDate: newVapaDate ?? null,
    price: currentPrice,
    solidHistory: history,
    solidMarketCap: vapaMarketCap,
    liquidHistory: realHistory,
    liquidMarketCap: realMarketCap,
    historyLastUpdated,
  };
}
