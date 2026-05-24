import { NextApiRequest, NextApiResponse } from 'next';
import { logApiRouteError, withOptionalApiDebug } from '../../lib/server/apiErrorDebug';
import { getServerS3 } from '../../lib/server/awsS3';
import { recalculateInvestmentsForAllAssets } from '../../lib/server/loadVapaAssetSnapshot';
import { s3BucketNameOrThrow } from '../../lib/server/s3Bucket';
import {
  buildValuationAggregatePayload,
  calculateLiquidTotals,
  calculateSolidTotals,
  EMPTY_PORTFOLIO_TOTALS,
  investmentValuationChanged,
  needsValuationMigration,
} from '../../lib/vavity/portfolioValuation';

const s3 = getServerS3();
const SESSION_TTL_MS = (() => {
  const raw = process.env.VAPAGG_SESSION_TTL_MS;
  if (raw) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  // Default to 1 minute unless explicitly overridden.
  return 60_000;
})();

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rawSessionId = req.query.sessionId;
  const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;
  const rawAsset = req.query.asset;
  const asset = Array.isArray(rawAsset) ? rawAsset[0] : rawAsset;
  const normalizedAsset = typeof asset === 'string' && asset.length ? asset.toLowerCase() : undefined;
  const rawSkipExpiry = req.query.skipExpiry;
  const skipExpiryParam = Array.isArray(rawSkipExpiry) ? rawSkipExpiry[0] : rawSkipExpiry;
  const skipExpiry =
    typeof skipExpiryParam === 'string'
      ? ['1', 'true', 'yes', 'on'].includes(skipExpiryParam.toLowerCase())
      : Boolean(skipExpiryParam);

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId query parameter is required' });
  }

  const key = `sessions/${sessionId}/VavityAggregate.json`;

  try {
    const data = await s3.getObject({ Bucket: s3BucketNameOrThrow(), Key: key }).promise();
    const userData = JSON.parse(data.Body!.toString()) as Record<string, unknown>;

    // Session TTL meta: if expired, delete the session object and return empty.
    const now = Date.now();
    const existingCreatedAt = typeof userData?.createdAt === 'number' ? userData.createdAt : null;
    const existingExpiresAt = typeof userData?.expiresAt === 'number' ? userData.expiresAt : null;
    const expired =
      typeof existingExpiresAt === 'number' && Number.isFinite(existingExpiresAt) && now >= existingExpiresAt;
    if (expired && !skipExpiry) {
      try {
        await s3.deleteObject({ Bucket: s3BucketNameOrThrow(), Key: key }).promise();
      } catch {
        // ignore delete errors; still return empty
      }
      return res.status(200).json({
        investments: [],
        totals: { ...EMPTY_PORTFOLIO_TOTALS },
        totalsLiquid: { ...EMPTY_PORTFOLIO_TOTALS },
      });
    }

    // Backfill TTL meta for legacy session files that predate createdAt/expiresAt.
    let didMutate = false;
    const createdAt = existingCreatedAt ?? now;
    let expiresAt = existingExpiresAt ?? createdAt + SESSION_TTL_MS;
    if (typeof expiresAt === 'number' && Number.isFinite(expiresAt)) {
      const maxExpiresAt = now + SESSION_TTL_MS;
      if (expiresAt > maxExpiresAt) {
        expiresAt = maxExpiresAt;
        didMutate = true;
      }
    }
    const investmentsAll: Record<string, unknown>[] = Array.isArray(userData.investments)
      ? (userData.investments as Record<string, unknown>[])
      : [];

    const hasLegacyLiquidFields = investmentsAll.some(
      (inv) =>
        inv &&
        (typeof inv.rCpVatop === 'number' ||
          typeof inv.rCpVact === 'number' ||
          typeof inv.rCVatop === 'number' ||
          typeof inv.rCVact === 'number' ||
          typeof inv.rCdVatop === 'number')
    );
    const hasLegacyTotals = userData.totalsReality != null;
    didMutate =
      didMutate ||
      needsValuationMigration(userData) ||
      hasLegacyLiquidFields ||
      hasLegacyTotals ||
      investmentsAll.length > 0;
    if (existingCreatedAt == null || existingExpiresAt == null) {
      didMutate = true;
    }

    const updatedAll = await recalculateInvestmentsForAllAssets(investmentsAll);
    if (!didMutate) {
      for (let i = 0; i < investmentsAll.length; i++) {
        if (investmentValuationChanged(investmentsAll[i], updatedAll[i])) {
          didMutate = true;
          break;
        }
      }
    }

    const valuationPayload = buildValuationAggregatePayload(updatedAll);
    const newData = { createdAt, expiresAt, ...valuationPayload };

    if (didMutate) {
      await s3
        .putObject({
          Bucket: s3BucketNameOrThrow(),
          Key: key,
          Body: JSON.stringify(newData),
          ContentType: 'application/json',
          ACL: 'private',
        })
        .promise();
    }

    if (normalizedAsset) {
      const filteredInvestments = updatedAll.filter(
        (entry) => String(entry?.asset || 'bitcoin').toLowerCase() === normalizedAsset
      );
      return res.status(200).json({
        createdAt,
        expiresAt,
        investments: filteredInvestments,
        totals: calculateSolidTotals(filteredInvestments),
        totalsLiquid: calculateLiquidTotals(filteredInvestments),
        valuationVersion: valuationPayload.valuationVersion,
      });
    }

    return res.status(200).json(newData);
  } catch (error: unknown) {
    const awsLike = error as { code?: string; statusCode?: number };
    if (awsLike.code === 'NoSuchKey' || awsLike.statusCode === 404) {
      return res.status(200).json({
        investments: [],
        totals: { ...EMPTY_PORTFOLIO_TOTALS },
        totalsLiquid: { ...EMPTY_PORTFOLIO_TOTALS },
      });
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : (error as { message?: string })?.message || 'Could not fetch user data';
    logApiRouteError('fetchVavityAggregator', error);
    return res.status(500).json(withOptionalApiDebug({ error: errorMessage }, error));
  }
};
