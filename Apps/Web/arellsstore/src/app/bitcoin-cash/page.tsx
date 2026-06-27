import type { Metadata } from 'next';
import BitcoinCashPageClient from '../../components/Assets/Crypto/BitcoinCash/BitcoinCashPageClient';
import { PublicEarningsGuestProvider } from '../../components/MyPortfolio/PublicEarningsGuestContext';
import { buildCryptoAssetPageMetadata } from '../../lib/assets/cryptoAssetRegistry';
import { loadGuestPublicEarnings } from '../../lib/portfolio/loadGuestPublicEarnings';

export const metadata: Metadata = buildCryptoAssetPageMetadata('bch');

const BitcoinCashPage = async () => {
  const initialPublicEarnings = await loadGuestPublicEarnings();

  return (
    <PublicEarningsGuestProvider value={initialPublicEarnings}>
      <BitcoinCashPageClient />
    </PublicEarningsGuestProvider>
  );
};

export default BitcoinCashPage;
