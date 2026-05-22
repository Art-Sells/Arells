import Link from 'next/link';
import { CRYPTO_ASSETS } from '../../lib/assets/cryptoAssetRegistry';

/** Crawlable asset links on `/` for search engines (complements home table + registry hrefs). */
export default function CrawlAssetLinks() {
  return (
    <nav aria-label="Crypto assets" className="home-crawl-asset-links">
      <ul>
        {CRYPTO_ASSETS.map((asset) => (
          <li key={asset.id}>
            <Link href={asset.href}>{asset.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
