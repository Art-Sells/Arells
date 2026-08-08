import type { Metadata } from 'next';
import ApplePageClient from '../../components/Assets/Stocks/Apple/ApplePageClient';
import {
  buildStockAssetPageMetadata,
  getStockAssetPageSeo,
} from '../../lib/assets/stockAssetRegistry';
import { buildWebPageJsonLd } from '../../lib/pageWebPageJsonLd';

const assetId = 'apple' as const;
const { title, description, path } = getStockAssetPageSeo(assetId);

export const metadata: Metadata = buildStockAssetPageMetadata(assetId);

const ApplePage = async () => {

  return (
    <>
      <main>
        <div className="server-seo-summary">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <ApplePageClient />
</main>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- JSON-LD requires raw script injection
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildWebPageJsonLd({ title, description, path })),
        }}
      />
    </>
  );
};

export default ApplePage;
