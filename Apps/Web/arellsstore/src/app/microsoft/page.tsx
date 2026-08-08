import type { Metadata } from 'next';
import MicrosoftPageClient from '../../components/Assets/Stocks/Microsoft/MicrosoftPageClient';
import {
  buildStockAssetPageMetadata,
  getStockAssetPageSeo,
} from '../../lib/assets/stockAssetRegistry';
import { buildWebPageJsonLd } from '../../lib/pageWebPageJsonLd';

const assetId = 'microsoft' as const;
const { title, description, path } = getStockAssetPageSeo(assetId);

export const metadata: Metadata = buildStockAssetPageMetadata(assetId);

const MicrosoftPage = async () => {

  return (
    <>
      <main>
        <div className="server-seo-summary">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <MicrosoftPageClient />
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

export default MicrosoftPage;
