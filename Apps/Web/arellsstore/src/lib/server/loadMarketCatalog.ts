import { getServerS3 } from './awsS3';
import { s3BucketNameOrThrow } from './s3Bucket';
import {
  emptyMarketCatalog,
  isMarketCatalogSnapshot,
  MARKET_CATALOG_S3_KEY,
  type MarketCatalogSnapshot,
} from '../market/marketCatalogTypes';

const s3 = getServerS3();

export async function loadMarketCatalogFromS3(): Promise<MarketCatalogSnapshot> {
  try {
    const obj = await s3.getObject({ Bucket: s3BucketNameOrThrow(), Key: MARKET_CATALOG_S3_KEY }).promise();
    if (!obj.Body) return emptyMarketCatalog();
    const parsed: unknown = JSON.parse(obj.Body.toString());
    if (!isMarketCatalogSnapshot(parsed)) return emptyMarketCatalog();
    return parsed;
  } catch (e: unknown) {
    const err = e as { code?: string; statusCode?: number };
    if (err.code === 'NoSuchKey' || err.statusCode === 404) return emptyMarketCatalog();
    throw e;
  }
}

export async function writeMarketCatalogToS3(catalog: MarketCatalogSnapshot): Promise<void> {
  await s3
    .putObject({
      Bucket: s3BucketNameOrThrow(),
      Key: MARKET_CATALOG_S3_KEY,
      Body: JSON.stringify(catalog),
      ContentType: 'application/json',
    })
    .promise();
}
