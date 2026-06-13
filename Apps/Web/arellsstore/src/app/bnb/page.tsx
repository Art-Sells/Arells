import type { Metadata } from 'next';
import BnbPageClient from '../../components/Assets/Crypto/Bnb/BnbPageClient';
import { PublicEarningsGuestProvider } from '../../components/MyPortfolio/PublicEarningsGuestContext';
import { buildCryptoAssetPageMetadata } from '../../lib/assets/cryptoAssetRegistry';
import { loadGuestPublicEarnings } from '../../lib/portfolio/loadGuestPublicEarnings';

export const metadata: Metadata = buildCryptoAssetPageMetadata('bnb');

const BnbPage = async () => {
  const initialPublicEarnings = await loadGuestPublicEarnings();

  return (
    <PublicEarningsGuestProvider value={initialPublicEarnings}>
      <BnbPageClient />
    </PublicEarningsGuestProvider>
  );
};

export default BnbPage;
