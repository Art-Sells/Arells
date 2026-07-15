import type { Metadata } from 'next';
import SpaceXPageClient from '../../components/Assets/Stocks/SpaceX/SpaceXPageClient';
import { PublicEarningsGuestProvider } from '../../components/MyPortfolio/PublicEarningsGuestContext';
import {
  buildStockAssetPageMetadata,
  getStockAssetPageSeo,
} from '../../lib/assets/stockAssetRegistry';
import { buildWebPageJsonLd } from '../../lib/pageWebPageJsonLd';
import { loadGuestPublicEarnings } from '../../lib/portfolio/loadGuestPublicEarnings';

const assetId = 'spacex' as const;
const { title, description, path } = getStockAssetPageSeo(assetId);

export const metadata: Metadata = buildStockAssetPageMetadata(assetId);

const SpaceXPage = async () => {
  const initialPublicEarnings = await loadGuestPublicEarnings();

  return (
    <>
      <main>
        <div className="server-seo-summary">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <PublicEarningsGuestProvider value={initialPublicEarnings}>
          <SpaceXPageClient />
        </PublicEarningsGuestProvider>
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

export default SpaceXPage;
