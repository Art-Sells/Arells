/**
 * Build market search catalog and write to S3.
 * Run: npx --yes tsx scripts/refresh-market-catalog.ts
 */
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { buildMarketCatalog } from '../src/lib/market/buildMarketCatalog';
import { writeMarketCatalogToS3 } from '../src/lib/server/loadMarketCatalog';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

async function main() {
  if (!process.env.S3_BUCKET_NAME?.trim()) {
    console.error('S3_BUCKET_NAME missing in .env');
    process.exit(1);
  }

  console.log('Building market catalog…');
  const catalog = await buildMarketCatalog();
  console.log(`Crypto: ${catalog.crypto.length}, Stocks: ${catalog.stocks.length}`);
  if (catalog.crypto[0]) {
    console.log('Top crypto:', catalog.crypto[0].symbol, catalog.crypto[0].name);
  }
  if (catalog.stocks[0]) {
    console.log('Top stock:', catalog.stocks[0].symbol, catalog.stocks[0].name);
  }

  await writeMarketCatalogToS3(catalog);
  console.log('Wrote market/home-search-catalog.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
