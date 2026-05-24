import { NextApiRequest, NextApiResponse } from 'next';
import { assertUserEmailMatchesSession } from '../../../lib/auth/requireUserApi';
import { getServerS3 } from '../../../lib/server/awsS3';
import { recalculateInvestmentsForAllAssets } from '../../../lib/server/loadVapaAssetSnapshot';
import { s3BucketNameOrThrow } from '../../../lib/server/s3Bucket';
import {
  buildValuationAggregatePayload,
  calculateLiquidTotals,
  calculateSolidTotals,
  EMPTY_PORTFOLIO_TOTALS,
  investmentValuationChanged,
  needsValuationMigration,
} from '../../../lib/vavity/portfolioValuation';

const s3 = getServerS3();

const normalizeEmailKey = (raw: string) => encodeURIComponent(raw.trim().toLowerCase());

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rawEmail = req.query.email;
  const email = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail;
  const rawAsset = req.query.asset;
  const asset = Array.isArray(rawAsset) ? rawAsset[0] : rawAsset;
  const normalizedAsset = typeof asset === 'string' && asset.length ? asset.toLowerCase() : undefined;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email query parameter is required' });
  }

  const allowed = await assertUserEmailMatchesSession(req, res, email);
  if (!allowed) return;

  const key = `users/${normalizeEmailKey(email)}/VavityAggregate.json`;

  try {
    const data = await s3.getObject({ Bucket: s3BucketNameOrThrow(), Key: key }).promise();
    const userData = JSON.parse(data.Body!.toString()) as Record<string, unknown>;
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

    const updatedAll = await recalculateInvestmentsForAllAssets(investmentsAll);
    const valuationPayload = buildValuationAggregatePayload(updatedAll);

    let didMutate =
      needsValuationMigration(userData) ||
      hasLegacyLiquidFields ||
      hasLegacyTotals ||
      investmentsAll.length > 0;
    if (!didMutate) {
      for (let i = 0; i < investmentsAll.length; i++) {
        if (investmentValuationChanged(investmentsAll[i], updatedAll[i])) {
          didMutate = true;
          break;
        }
      }
    }

    if (didMutate) {
      await s3
        .putObject({
          Bucket: s3BucketNameOrThrow(),
          Key: key,
          Body: JSON.stringify(valuationPayload),
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
        investments: filteredInvestments,
        totals: calculateSolidTotals(filteredInvestments),
        totalsLiquid: calculateLiquidTotals(filteredInvestments),
        valuationVersion: valuationPayload.valuationVersion,
      });
    }

    return res.status(200).json(valuationPayload);
  } catch (error: any) {
    if (error.code === 'NoSuchKey' || error.statusCode === 404) {
      return res.status(200).json({
        investments: [],
        totals: { ...EMPTY_PORTFOLIO_TOTALS },
        totalsLiquid: { ...EMPTY_PORTFOLIO_TOTALS },
      });
    }
    const errorMessage = error.message || 'Could not fetch user data';
    console.error('Error fetching user data:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
};
