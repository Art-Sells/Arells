/**
 * Per-user portfolio fields from asset-level VAPA (solid series) and stored token amounts.
 * Asset VAPA / liquid history come from S3; this module only applies them to a user's lots.
 */

export type PriceHistoryPoint = { date: string; price: number };

export type VapaAssetSnapshot = {
  /** Current asset VAPA (same for all users). */
  vapa: number;
  price: number | null;
  /** Asset solid / VAPA daily series. */
  solidHistory: PriceHistoryPoint[];
  liquidHistory: PriceHistoryPoint[];
};

export type PortfolioTotals = {
  acVatop: number;
  acVact: number;
  acdVatop: number;
  acVactTaa: number;
};

export const EMPTY_PORTFOLIO_TOTALS: PortfolioTotals = {
  acVatop: 0,
  acVact: 0,
  acdVatop: 0,
  acVactTaa: 0,
};

/** Bump when solid/l totals logic changes — triggers S3 rewrite on next fetch. */
export const VALUATION_VERSION = 8;

export function needsValuationMigration(data: Record<string, unknown> | null | undefined): boolean {
  return Number(data?.valuationVersion) !== VALUATION_VERSION;
}

const VALUATION_KEYS = [
  'cVatop',
  'cpVatop',
  'cpVact',
  'cVact',
  'cdVatop',
  'lCpVatop',
  'lCpVact',
  'lCVatop',
  'lCVact',
  'lCdVatop',
] as const;

export function normalizeToIsoDay(value: string): string | null {
  if (!value) return null;
  if (value.includes('/')) {
    const parts = value.split('/');
    if (parts.length !== 3) return null;
    const [month, day, year] = parts;
    if (!year || !month || !day) return null;
    return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  if (value.includes('-')) {
    const parts = value.split('-');
    if (parts.length !== 3) return null;
    const [year, month, day] = parts;
    if (!year || !month || !day) return null;
    return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** Normalize any history/purchase date string to UTC YYYY-MM-DD for comparisons. */
export function historyDayKey(value: string): string | null {
  const iso = normalizeToIsoDay(value);
  if (iso) return iso;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function getNearestHistoricalPrice(
  history: PriceHistoryPoint[],
  targetDate: string
): PriceHistoryPoint | null {
  if (!history.length) return null;
  const targetDay = historyDayKey(targetDate) ?? targetDate;
  const sorted = [...history]
    .map((entry) => {
      const day = historyDayKey(entry.date);
      return day ? { date: day, price: entry.price } : null;
    })
    .filter((entry): entry is PriceHistoryPoint => entry != null)
    .sort((a, b) => a.date.localeCompare(b.date));
  let selected: PriceHistoryPoint | null = null;
  for (const entry of sorted) {
    if (entry.date <= targetDay) selected = entry;
    else break;
  }
  return selected;
}

/** Max external (liquid) spot from history start through a UTC day (building block of VAPA). */
export function maxLiquidThroughUtcDay(snapshot: VapaAssetSnapshot, isoDay: string): number {
  const targetDay = historyDayKey(isoDay) ?? isoDay;
  let maxLiquid = 0;
  for (const point of snapshot.liquidHistory) {
    const day = historyDayKey(point.date);
    if (!day || day > targetDay) continue;
    if (point.price > maxLiquid) maxLiquid = point.price;
  }
  return maxLiquid;
}

/**
 * VAPA on a UTC day: monotonic solid series at/before that day, else max liquid through that day.
 * Never uses today's global `vapa` for a past day (that pinned purchased = current).
 */
export function vapaAtUtcDay(snapshot: VapaAssetSnapshot, isoDay: string): number {
  const targetDay = historyDayKey(isoDay) ?? isoDay;
  const solidAtDay = getNearestHistoricalPrice(snapshot.solidHistory, targetDay);
  if (solidAtDay && solidAtDay.price > 0) return solidAtDay.price;
  const maxLiquid = maxLiquidThroughUtcDay(snapshot, targetDay);
  if (maxLiquid > 0) return maxLiquid;
  return 0;
}

export function parsePurchaseDay(inv: Record<string, unknown>): string | null {
  const raw = inv.date;
  if (typeof raw === 'string') {
    return normalizeToIsoDay(raw) ?? historyDayKey(raw);
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return new Date(raw).toISOString().slice(0, 10);
  }
  return null;
}

/**
 * Highest external price from startDay through endDay (inclusive), plus live spot when end is today.
 * Used for per-lot cpVact — not the asset all-time VAPA.
 */
export function maxExternalPriceInUtcDayRange(
  snapshot: VapaAssetSnapshot,
  startDay: string,
  endDay: string,
  currentLiquidPrice?: number | null
): number {
  const start = historyDayKey(startDay) ?? startDay;
  const end = historyDayKey(endDay) ?? endDay;
  let max = 0;
  for (const point of snapshot.liquidHistory) {
    const day = historyDayKey(point.date);
    if (!day || day < start || day > end) continue;
    if (point.price > max) max = point.price;
  }
  const today = new Date().toISOString().slice(0, 10);
  if (end >= today) {
    const live = currentLiquidSpot(snapshot, currentLiquidPrice);
    if (live > max) max = live;
  }
  return max;
}

/**
 * cpVact (per lot): highest external price from purchase date through today — not all-time VAPA.
 */
export function cpVactSincePurchase(
  snapshot: VapaAssetSnapshot,
  purchaseDay: string,
  currentLiquidPrice?: number | null
): number {
  const today = new Date().toISOString().slice(0, 10);
  return maxExternalPriceInUtcDayRange(snapshot, purchaseDay, today, currentLiquidPrice);
}

/** When solid on purchase day exceeds spot by more than this, treat solid as stale ATH (use spot). */
const SOLID_ATH_ARTIFACT_RATIO = 1.12;

/**
 * cpVatop for a lot: VAPA on the purchase calendar day (not all-time high before that date).
 * Scenario 2: spot $54k, VAPA $60k on that day → $60k. Post-ATH buy with spot $30k → ~$30k not $65k.
 */
export function cpVatopAtPurchaseForLot(
  snapshot: VapaAssetSnapshot,
  purchaseDay: string,
  currentLiquidPrice?: number | null
): number {
  const liveLiquid = currentLiquidSpot(snapshot, currentLiquidPrice);
  const liquidOnDay = liquidSpotOnUtcDay(snapshot, purchaseDay) || liveLiquid || 0;
  const solidOnDay = getNearestHistoricalPrice(snapshot.solidHistory, purchaseDay)?.price ?? 0;

  if (liquidOnDay <= 0) return solidOnDay > 0 ? solidOnDay : 0;
  if (solidOnDay <= 0) return liquidOnDay;
  if (solidOnDay > liquidOnDay * SOLID_ATH_ARTIFACT_RATIO) {
    return liquidOnDay;
  }
  return Math.max(solidOnDay, liquidOnDay);
}

/**
 * cpVatop (terminologies): VAPA at time of purchase — purchase-day anchor only.
 */
export function cpVatopAtPurchase(
  snapshot: VapaAssetSnapshot,
  isoDay: string,
  currentLiquidPrice?: number | null
): number {
  return cpVatopAtPurchaseForLot(snapshot, isoDay, currentLiquidPrice);
}

/** @deprecated Use vapaAtUtcDay */
export const vapaOnUtcDay = vapaAtUtcDay;

/** Asset-level VAPA today (charts / asset pages). Per-lot cpVact uses cpVactSincePurchase instead. */
export function currentAssetVapa(snapshot: VapaAssetSnapshot): number {
  if (snapshot.vapa > 0) return snapshot.vapa;
  const today = new Date().toISOString().slice(0, 10);
  const fromSeries = vapaAtUtcDay(snapshot, today);
  if (fromSeries > 0) return fromSeries;
  const solid = snapshot.solidHistory;
  if (solid.length) return solid[solid.length - 1]?.price ?? 0;
  return 0;
}

/** External asset (liquid) spot on a UTC day — for liquid-mode rows only. */
export function liquidSpotOnUtcDay(snapshot: VapaAssetSnapshot, isoDay: string): number {
  const historical = getNearestHistoricalPrice(snapshot.liquidHistory, isoDay);
  if (historical && historical.price > 0) return historical.price;
  return 0;
}

/** Live liquid spot (CoinGecko / snapshot.price). */
export function currentLiquidSpot(
  snapshot: VapaAssetSnapshot,
  currentLiquidPrice: number | null | undefined
): number {
  if (typeof currentLiquidPrice === 'number' && currentLiquidPrice > 0) return currentLiquidPrice;
  if (typeof snapshot.price === 'number' && snapshot.price > 0) return snapshot.price;
  return 0;
}

export function migrateLegacyLiquidFields(inv: Record<string, unknown>): Record<string, unknown> {
  const next = { ...inv };
  if (typeof next.lCpVatop !== 'number' && typeof next.rCpVatop === 'number') next.lCpVatop = next.rCpVatop;
  if (typeof next.lCpVact !== 'number' && typeof next.rCpVact === 'number') next.lCpVact = next.rCpVact;
  if (typeof next.lCVatop !== 'number' && typeof next.rCVatop === 'number') next.lCVatop = next.rCVatop;
  if (typeof next.lCVact !== 'number' && typeof next.rCVact === 'number') next.lCVact = next.rCVact;
  if (typeof next.lCdVatop !== 'number' && typeof next.rCdVatop === 'number') next.lCdVatop = next.rCdVatop;
  delete next.rCpVatop;
  delete next.rCpVact;
  delete next.rCVatop;
  delete next.rCVact;
  delete next.rCdVatop;
  return next;
}

export type RecalculatedInvestmentFields = {
  cVatop: number;
  cpVatop: number;
  cpVact: number;
  cVact: number;
  cdVatop: number;
  lCpVatop: number;
  lCpVact: number;
  lCVatop: number;
  lCVact: number;
  lCdVatop: number;
};

/**
 * Solid (c*): cpVatop = VAPA on purchase day; cpVact = max external price purchase date → today (per lot).
 * Liquid (l*): spot at purchase / spot today (separate reality track).
 */
export function recalculateInvestmentFields(
  inv: Record<string, unknown>,
  snapshot: VapaAssetSnapshot,
  currentLiquidPrice?: number | null
): RecalculatedInvestmentFields & { normalizedDate: string | null; cVactTaa: number } {
  const rawAmount = inv.cVactTaa ?? 0;
  const cVactTaa = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount) || 0;
  const normalizedDate = parsePurchaseDay(inv);
  const hasDateAndAmount = Boolean(normalizedDate) && cVactTaa > 0;

  if (!hasDateAndAmount) {
    const cpVatop = Number(inv.cpVatop) || 0;
    const cpVact = Number(inv.cpVact) || cpVatop;
    const cVatop = Number(inv.cVatop) || cVactTaa * cpVatop;
    const cVact = Number(inv.cVact) || cVactTaa * cpVact;
    const cdVatop = Number(inv.cdVatop) || cVact - cVatop;
    const lCpVatop = Number(inv.lCpVatop) || cpVatop;
    const lCpVact = Number(inv.lCpVact) || cpVact;
    const lCVatop = Number(inv.lCVatop) || cVatop;
    const lCVact = Number(inv.lCVact) || cVact;
    const lCdVatop = Number(inv.lCdVatop) || cdVatop;
    return {
      normalizedDate,
      cVactTaa,
      cVatop,
      cpVatop,
      cpVact,
      cVact,
      cdVatop,
      lCpVatop,
      lCpVact,
      lCVatop,
      lCVact,
      lCdVatop,
    };
  }

  const purchaseDay = normalizedDate as string;
  const liveLiquid = currentLiquidSpot(snapshot, currentLiquidPrice);
  const lCpVatop = liquidSpotOnUtcDay(snapshot, purchaseDay) || liveLiquid;
  const cpVatop = cpVatopAtPurchaseForLot(snapshot, purchaseDay, liveLiquid);
  const cpVact = cpVactSincePurchase(snapshot, purchaseDay, currentLiquidPrice);
  const lCpVact = liveLiquid || lCpVatop;
  const lCVatop = cVactTaa * lCpVatop;
  const lCVact = cVactTaa * lCpVact;
  const lCdVatop = lCVact - lCVatop;

  const cVatop = cVactTaa * cpVatop;
  const cVact = cVactTaa * cpVact;
  const cdVatop = cVact - cVatop;

  return {
    normalizedDate,
    cVactTaa,
    cVatop,
    cpVatop,
    cpVact,
    cVact,
    cdVatop,
    lCpVatop,
    lCpVact,
    lCVatop,
    lCVact,
    lCdVatop,
  };
}

export function applyRecalculatedFields(
  inv: Record<string, unknown>,
  snapshot: VapaAssetSnapshot,
  assetId: string,
  currentLiquidPrice?: number | null
): Record<string, unknown> {
  const migrated = migrateLegacyLiquidFields(inv);
  const fields = recalculateInvestmentFields(migrated, snapshot, currentLiquidPrice);
  return {
    ...migrated,
    asset: assetId,
    date: fields.normalizedDate ?? inv.date,
    cVactTaa: fields.cVactTaa,
    cVatop: fields.cVatop,
    purchaseCpVatop: fields.cpVatop,
    cpVatop: fields.cpVatop,
    cpVact: fields.cpVact,
    cVact: fields.cVact,
    cdVatop: fields.cdVatop,
    lCpVatop: fields.lCpVatop,
    lCpVact: fields.lCpVact,
    lCVatop: fields.lCVatop,
    lCVact: fields.lCVact,
    lCdVatop: fields.lCdVatop,
  };
}

export function investmentValuationChanged(prev: Record<string, unknown>, next: Record<string, unknown>): boolean {
  for (const k of VALUATION_KEYS) {
    const a = Number(prev[k]);
    const b = Number(next[k]);
    if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) > 1e-9) return true;
  }
  return false;
}

export function calculateSolidTotals(investments: Record<string, unknown>[]): PortfolioTotals {
  const totals = investments.reduce<PortfolioTotals>(
    (acc, inv) => {
      acc.acVatop += Number(inv.cVatop) || 0;
      acc.acVact += Number(inv.cVact) || 0;
      acc.acVactTaa += Number(inv.cVactTaa) || 0;
      return acc;
    },
    { ...EMPTY_PORTFOLIO_TOTALS }
  );
  totals.acdVatop = totals.acVact - totals.acVatop;
  return totals;
}

export function calculateLiquidTotals(investments: Record<string, unknown>[]): PortfolioTotals {
  const totals = investments.reduce<PortfolioTotals>(
    (acc, inv) => {
      acc.acVatop += Number(inv.lCVatop) || 0;
      acc.acVact += Number(inv.lCVact) || 0;
      acc.acVactTaa += Number(inv.cVactTaa) || 0;
      return acc;
    },
    { ...EMPTY_PORTFOLIO_TOTALS }
  );
  totals.acdVatop = totals.acVact - totals.acVatop;
  return totals;
}

export function buildValuationAggregatePayload(
  investments: Record<string, unknown>[]
): {
  investments: Record<string, unknown>[];
  totals: PortfolioTotals;
  totalsLiquid: PortfolioTotals;
  valuationVersion: number;
} {
  return {
    investments,
    totals: calculateSolidTotals(investments),
    totalsLiquid: calculateLiquidTotals(investments),
    valuationVersion: VALUATION_VERSION,
  };
}

/** Client summary: sum stored anchored fields (no live spot). */
export function toVapaAssetSnapshot(raw: {
  vapa?: number;
  price?: number | null;
  solidHistory?: PriceHistoryPoint[];
  liquidHistory?: PriceHistoryPoint[];
  history?: PriceHistoryPoint[];
  realHistory?: PriceHistoryPoint[];
} | null | undefined): VapaAssetSnapshot {
  return {
    vapa: typeof raw?.vapa === 'number' ? raw.vapa : 0,
    price: typeof raw?.price === 'number' ? raw.price : null,
    solidHistory: raw?.solidHistory ?? raw?.history ?? [],
    liquidHistory: raw?.liquidHistory ?? raw?.realHistory ?? [],
  };
}

export function recalculateInvestmentsWithSnapshots(
  investments: Record<string, unknown>[],
  getSnapshot: (assetId: string) => VapaAssetSnapshot,
  getLiquidSpot?: (assetId: string) => number | null | undefined
): Record<string, unknown>[] {
  return investments.map((inv) => {
    const assetId = String(inv?.asset || 'bitcoin').toLowerCase();
    const snapshot = getSnapshot(assetId);
    const liquid = getLiquidSpot?.(assetId);
    return applyRecalculatedFields(inv, snapshot, assetId, liquid);
  });
}

/** Invest-form purchase row: liquid on purchase day (solid uses same liquid-at-date rule as range summaries). */
export function investFormPurchaseUnitPrice(
  liquidOnPurchaseDay: number | null | undefined,
  liveLiquid: number,
  liveVapa: number
): number {
  if (liquidOnPurchaseDay != null && liquidOnPurchaseDay > 0) return liquidOnPurchaseDay;
  if (liveLiquid > 0) return liveLiquid;
  if (liveVapa > 0) return liveVapa;
  return 0;
}

export function investFormCurrentUnitPrice(
  liquidMode: boolean,
  liveLiquid: number,
  liveVapa: number
): number {
  if (liquidMode) return liveLiquid > 0 ? liveLiquid : 0;
  return liveVapa > 0 ? liveVapa : 0;
}

export function sumPortfolioTotalsFromEntries(
  investments: Record<string, unknown>[],
  liquidMode: boolean
): PortfolioTotals {
  return investments.reduce<PortfolioTotals>(
    (acc, entry) => {
      const purchaseValue = liquidMode
        ? Number(entry.lCVatop ?? entry.rCVatop) || 0
        : Number(entry.cVatop) || 0;
      const currentValue = liquidMode
        ? Number(entry.lCVact ?? entry.rCVact) || 0
        : Number(entry.cVact) || 0;
      acc.acVatop += purchaseValue;
      acc.acVact += currentValue;
      acc.acdVatop += currentValue - purchaseValue;
      acc.acVactTaa += Number(entry.cVactTaa) || 0;
      return acc;
    },
    { ...EMPTY_PORTFOLIO_TOTALS }
  );
}

/** Range baseline: liquid spot on range start day (solid + liquid UIs). */
export function sumPortfolioTotalsForRange(
  investments: Record<string, unknown>[],
  liquidMode: boolean,
  rangeStartMs: number,
  rangeLiquidByAsset: Record<string, number | null>
): PortfolioTotals {
  return investments.reduce<PortfolioTotals>(
    (acc, entry) => {
      const amount = Number(entry.cVactTaa) || 0;
      const assetId = String(entry.asset || 'bitcoin').toLowerCase();
      const currentValue = liquidMode
        ? Number(entry.lCVact ?? entry.rCVact) || 0
        : Number(entry.cVact) || 0;
      const purchaseTime = entry.date ? new Date(String(entry.date)).getTime() : NaN;
      const hasValidPurchaseTime = Number.isFinite(purchaseTime);
      const rangePrice = rangeLiquidByAsset[assetId] ?? 0;
      const pastValue =
        liquidMode && hasValidPurchaseTime && purchaseTime > rangeStartMs
          ? Number(entry.lCVatop ?? entry.rCVatop) || 0
          : amount * rangePrice;
      acc.acVatop += pastValue;
      acc.acVact += currentValue;
      acc.acdVatop += currentValue - pastValue;
      acc.acVactTaa += amount;
      return acc;
    },
    { ...EMPTY_PORTFOLIO_TOTALS }
  );
}
