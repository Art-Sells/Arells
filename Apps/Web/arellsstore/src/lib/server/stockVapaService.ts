import { getServerS3 } from './awsS3';
import {
  defaultHistoryFromDay,
  fetchMassiveDailyCloses,
  fetchMassivePrevClose,
  fetchMassiveTickerFundamentals,
  filterClosesFromListDate,
  maxIsoDay,
  todayUtcDay,
} from './massiveStockQuotes';
import { s3BucketNameOrThrow } from './s3Bucket';

const s3 = getServerS3();
const HISTORY_REFRESH_MS = 60 * 60 * 1000;

export type StockVapaAssetConfig = {
  id: string;
  massiveTicker: string;
  s3Key: string;
  /** Exchange list / IPO day — clamps history when Massive returns recycled pre-list bars. */
  listDate?: string | null;
};

const isoDateFromDay = (day: string): string => `${day}T00:00:00.000Z`;

const marketCapsAreEmpty = (caps: number[]) =>
  !Array.isArray(caps) || caps.length === 0 || caps.every((c) => !(typeof c === 'number' && c > 0));

const buildDailyHistory = (prices: [number, number][], sharesOutstanding: number | null) => {
  const dailyMap = new Map<string, number>();
  for (const [timestamp, price] of prices) {
    if (typeof price !== 'number') continue;
    const day = new Date(timestamp).toISOString().slice(0, 10);
    dailyMap.set(day, price);
  }

  const dailyEntries = Array.from(dailyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const history: { date: string; price: number }[] = [];
  const marketCap: number[] = [];
  let maxPrice = 0;
  let maxDate: string | null = null;

  for (const [date, price] of dailyEntries) {
    history.push({ date, price });
    marketCap.push(sharesOutstanding != null && sharesOutstanding > 0 ? price * sharesOutstanding : 0);
    if (price > maxPrice) {
      maxPrice = price;
      maxDate = date;
    }
  }

  return { history, marketCap, highestPriceEver: maxPrice, highestPriceDate: maxDate ? isoDateFromDay(maxDate) : null };
};

const buildMonotonicHistory = (prices: [number, number][], sharesOutstanding: number | null) => {
  const dailyMap = new Map<string, number>();
  for (const [timestamp, price] of prices) {
    if (typeof price !== 'number') continue;
    const day = new Date(timestamp).toISOString().slice(0, 10);
    dailyMap.set(day, price);
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
    vapaMarketCap.push(sharesOutstanding != null && sharesOutstanding > 0 ? adjusted * sharesOutstanding : 0);
    if (adjusted > maxPrice) {
      maxPrice = adjusted;
      maxDate = date;
    }
  }

  return {
    history,
    vapaMarketCap,
    highestPriceEver: maxPrice,
    highestPriceDate: maxDate ? isoDateFromDay(maxDate) : null,
  };
};

export async function refreshStockVapa(config: StockVapaAssetConfig) {
  let storedVAPA = 0;
  let storedVapaDate: string | null = null;
  let storedHistory: { date: string; price: number }[] = [];
  let storedHistoryLastUpdated: number | null = null;
  let storedVapaMarketCap: number[] = [];
  let storedRealHistory: { date: string; price: number }[] = [];
  let storedRealMarketCap: number[] = [];
  let storedPrice: number | null = null;
  let fileExists = false;

  try {
    const response = await s3.getObject({ Bucket: s3BucketNameOrThrow(), Key: config.s3Key }).promise();
    if (response.Body) {
      const data = JSON.parse(response.Body.toString());
      storedVAPA = data.vapa || 0;
      storedVapaDate = data.vapaDate ?? data.lastUpdated ?? null;
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
      console.error(`[stock-vapa:${config.id}] read error`, error);
    }
  }

  let currentPrice = storedPrice ?? storedVAPA;
  try {
    const spot = await fetchMassivePrevClose(config.massiveTicker);
    currentPrice = spot.price;
  } catch (err) {
    console.error(`[stock-vapa:${config.id}] spot fetch failed`, err);
  }

  let currentMarketCap: number | null = null;
  let sharesOutstanding: number | null = null;
  let apiListDate: string | null = null;
  try {
    const fundamentals = await fetchMassiveTickerFundamentals(config.massiveTicker);
    currentMarketCap = fundamentals.marketCap;
    sharesOutstanding = fundamentals.weightedSharesOutstanding;
    apiListDate = fundamentals.listDate;
    if (sharesOutstanding == null && currentMarketCap != null && currentPrice > 0) {
      sharesOutstanding = currentMarketCap / currentPrice;
    }
  } catch (err) {
    console.error(`[stock-vapa:${config.id}] fundamentals fetch failed`, err);
  }

  const listDate =
    (typeof config.listDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(config.listDate)
      ? config.listDate
      : null) ?? apiListDate;

  let highestPriceEver = 0;
  let highestPriceDate: string | null = null;
  let history = storedHistory;
  let vapaMarketCap = storedVapaMarketCap;
  let realHistory = storedRealHistory;
  let realMarketCap = storedRealMarketCap;
  let historyLastUpdated = storedHistoryLastUpdated;

  const missingRealHistory = !Array.isArray(storedRealHistory) || storedRealHistory.length === 0;
  const missingMarketCaps = marketCapsAreEmpty(storedRealMarketCap) || marketCapsAreEmpty(storedVapaMarketCap);
  const today = todayUtcDay();
  const planLookbackDay = defaultHistoryFromDay();
  const historyFromDay = listDate ? maxIsoDay(planLookbackDay, listDate) : planLookbackDay;
  const lastHistoryDate = storedRealHistory.length ? storedRealHistory[storedRealHistory.length - 1].date : null;
  const firstHistoryDate = storedRealHistory.length ? storedRealHistory[0].date : null;
  const historyStale = !lastHistoryDate || lastHistoryDate < today;
  // Rebuild old 2y snapshots after a plan upgrade (first point far later than the desired lookback).
  const HISTORY_DEPTH_SLACK_MS = 90 * 24 * 60 * 60 * 1000;
  const historyShorterThanPlan =
    !!firstHistoryDate &&
    Date.parse(`${firstHistoryDate}T00:00:00.000Z`) - Date.parse(`${planLookbackDay}T00:00:00.000Z`) >
      HISTORY_DEPTH_SLACK_MS;
  // Massive sometimes returns recycled-ticker bars before list_date (e.g. SPCX pre-IPO junk).
  const historyStartsBeforeListDate =
    !!listDate && !!firstHistoryDate && firstHistoryDate < listDate;
  const shouldRefreshHistory =
    !storedHistory.length ||
    !storedHistoryLastUpdated ||
    Date.now() - storedHistoryLastUpdated > HISTORY_REFRESH_MS ||
    historyStale ||
    missingRealHistory ||
    missingMarketCaps ||
    historyShorterThanPlan ||
    historyStartsBeforeListDate;

  if (shouldRefreshHistory) {
    try {
      const rawPrices = await fetchMassiveDailyCloses(config.massiveTicker, historyFromDay, today);
      const prices = filterClosesFromListDate(rawPrices, listDate);
      if (prices.length > 0) {
        const real = buildDailyHistory(prices, sharesOutstanding);
        const result = buildMonotonicHistory(prices, sharesOutstanding);
        realHistory = real.history;
        realMarketCap = real.marketCap;
        history = result.history;
        vapaMarketCap = result.vapaMarketCap;
        historyLastUpdated = Date.now();
        highestPriceEver = result.highestPriceEver;
        highestPriceDate = result.highestPriceDate;
      }
    } catch (err) {
      console.error(`[stock-vapa:${config.id}] history fetch failed`, err);
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

  // Prefer Massive's reported market cap for the latest liquid point; derive solid from shares × VAPA.
  if (currentMarketCap != null && realMarketCap.length > 0) {
    realMarketCap[realMarketCap.length - 1] = currentMarketCap;
  } else if (sharesOutstanding != null && currentPrice > 0 && realMarketCap.length > 0) {
    realMarketCap[realMarketCap.length - 1] = currentPrice * sharesOutstanding;
  }
  if (sharesOutstanding != null && newVAPA > 0 && vapaMarketCap.length > 0) {
    vapaMarketCap[vapaMarketCap.length - 1] = newVAPA * sharesOutstanding;
  } else if (currentMarketCap != null && currentPrice > 0 && vapaMarketCap.length > 0) {
    const supply = currentMarketCap / currentPrice;
    vapaMarketCap[vapaMarketCap.length - 1] = newVAPA * supply;
  }

  const priceChanged = storedPrice !== currentPrice;
  const shouldWrite =
    !fileExists ||
    newVAPA > storedVAPA ||
    shouldRefreshHistory ||
    missingRealHistory ||
    missingMarketCaps ||
    storedPrice == null ||
    priceChanged;

  if (shouldWrite) {
    await s3
      .putObject({
        Bucket: s3BucketNameOrThrow(),
        Key: config.s3Key,
        Body: JSON.stringify({
          vapa: newVAPA,
          vapaDate: newVapaDate,
          price: currentPrice,
          solidHistory: history,
          solidMarketCap: vapaMarketCap,
          liquidHistory: realHistory,
          liquidMarketCap: realMarketCap,
          historyLastUpdated,
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
