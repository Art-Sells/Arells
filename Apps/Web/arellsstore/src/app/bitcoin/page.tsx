import type { Metadata } from 'next';
import BitcoinPageClient from '../../components/Assets/Crypto/Bitcoin/BitcoinPageClient';
import { PublicEarningsGuestProvider } from '../../components/MyPortfolio/PublicEarningsGuestContext';
import {
  buildCryptoAssetPageMetadata,
  getCryptoAssetPageSeo,
} from '../../lib/assets/cryptoAssetRegistry';
import { buildWebPageJsonLd } from '../../lib/pageWebPageJsonLd';
import { loadGuestPublicEarnings } from '../../lib/portfolio/loadGuestPublicEarnings';

const assetId = 'bitcoin' as const;
const { title, description, path } = getCryptoAssetPageSeo(assetId);

export const metadata: Metadata = buildCryptoAssetPageMetadata(assetId);

const BitcoinPage = async () => {
  const initialPublicEarnings = await loadGuestPublicEarnings();

  return (
    <>
      <main>
        <div className="server-seo-summary">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <PublicEarningsGuestProvider value={initialPublicEarnings}>
          <BitcoinPageClient />
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

export default BitcoinPage;
