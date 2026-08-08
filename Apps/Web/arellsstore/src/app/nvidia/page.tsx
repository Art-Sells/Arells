import type { Metadata } from 'next';
import NvidiaPageClient from '../../components/Assets/Stocks/Nvidia/NvidiaPageClient';
import {
  buildStockAssetPageMetadata,
  getStockAssetPageSeo,
} from '../../lib/assets/stockAssetRegistry';
import { buildWebPageJsonLd } from '../../lib/pageWebPageJsonLd';

const assetId = 'nvidia' as const;
const { title, description, path } = getStockAssetPageSeo(assetId);

export const metadata: Metadata = buildStockAssetPageMetadata(assetId);

const NvidiaPage = async () => {

  return (
    <>
      <main>
        <div className="server-seo-summary">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <NvidiaPageClient />
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

export default NvidiaPage;
