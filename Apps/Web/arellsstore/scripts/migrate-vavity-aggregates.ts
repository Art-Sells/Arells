/**
 * Batch-rewrite users/*/VavityAggregate.json with valuation v3 fields.
 * Run: npx --yes tsx scripts/migrate-vavity-aggregates.ts
 */
import { config } from 'dotenv';
import AWS from 'aws-sdk';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { recalculateInvestmentsForAllAssets } from '../src/lib/server/loadVapaAssetSnapshot';
import {
  buildValuationAggregatePayload,
  needsValuationMigration,
} from '../src/lib/vavity/portfolioValuation';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const bucket = process.env.S3_BUCKET_NAME;
if (!bucket) {
  console.error('S3_BUCKET_NAME missing in .env');
  process.exit(1);
}

const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

async function listUserAggregateKeys(): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const out = await s3
      .listObjectsV2({ Bucket: bucket, Prefix: 'users/', ContinuationToken: token, MaxKeys: 1000 })
      .promise();
    for (const obj of out.Contents || []) {
      if (obj.Key?.endsWith('/VavityAggregate.json')) keys.push(obj.Key);
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function main() {
  const keys = await listUserAggregateKeys();
  console.log(`Found ${keys.length} user aggregate(s)`);

  let updated = 0;
  let skipped = 0;
  for (const key of keys) {
    const raw = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    const data = JSON.parse(raw.Body!.toString()) as Record<string, unknown>;
    const investments = Array.isArray(data.investments)
      ? (data.investments as Record<string, unknown>[])
      : [];
    const recalculated = await recalculateInvestmentsForAllAssets(investments);
    const payload = buildValuationAggregatePayload(recalculated);

    const unchanged =
      !needsValuationMigration(data) &&
      JSON.stringify(payload.investments) === JSON.stringify(data.investments) &&
      JSON.stringify(payload.totals) === JSON.stringify(data.totals) &&
      JSON.stringify(payload.totalsLiquid) === JSON.stringify(data.totalsLiquid);

    if (unchanged) {
      skipped++;
      continue;
    }

    await s3
      .putObject({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(payload),
        ContentType: 'application/json',
        ACL: 'private',
      })
      .promise();
    updated++;
    console.log('updated', key);
  }

  console.log(`Done. updated=${updated} skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
