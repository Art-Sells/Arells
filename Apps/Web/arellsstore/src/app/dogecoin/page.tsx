import type { Metadata } from 'next';
import DogePageClient from '../../components/Assets/Crypto/Doge/DogePageClient';
import { PublicEarningsGuestProvider } from '../../components/MyPortfolio/PublicEarningsGuestContext';
import { buildCryptoAssetPageMetadata } from '../../lib/assets/cryptoAssetRegistry';
import { loadGuestPublicEarnings } from '../../lib/portfolio/loadGuestPublicEarnings';

export const metadata: Metadata = buildCryptoAssetPageMetadata('doge');

const DogecoinPage = async () => {
  const initialPublicEarnings = await loadGuestPublicEarnings();

  return (
    <PublicEarningsGuestProvider value={initialPublicEarnings}>
      <DogePageClient />
    </PublicEarningsGuestProvider>
  );
};

export default DogecoinPage;
