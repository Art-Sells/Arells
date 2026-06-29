import type { Metadata } from 'next';
import XrpPageClient from '../../components/Assets/Crypto/Xrp/XrpPageClient';
import { PublicEarningsGuestProvider } from '../../components/MyPortfolio/PublicEarningsGuestContext';
import {
  buildCryptoAssetPageMetadata,
  getCryptoAssetPageSeo,
} from '../../lib/assets/cryptoAssetRegistry';
import { buildWebPageJsonLd } from '../../lib/pageWebPageJsonLd';
import { loadGuestPublicEarnings } from '../../lib/portfolio/loadGuestPublicEarnings';

const assetId = 'xrp' as const;
const { title, description, path } = getCryptoAssetPageSeo(assetId);

export const metadata: Metadata = buildCryptoAssetPageMetadata(assetId);

const XrpPage = async () => {
  const initialPublicEarnings = await loadGuestPublicEarnings();

  return (
    <>
      <main>
        <div className="server-seo-summary">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <PublicEarningsGuestProvider value={initialPublicEarnings}>
          <XrpPageClient />
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

export default XrpPage;
