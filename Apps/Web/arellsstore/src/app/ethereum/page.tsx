import type { Metadata } from 'next';
import EthereumPageClient from '../../components/Assets/Crypto/Ethereum/EthereumPageClient';
import { PublicEarningsGuestProvider } from '../../components/MyPortfolio/PublicEarningsGuestContext';
import { buildCryptoAssetPageMetadata } from '../../lib/assets/cryptoAssetRegistry';
import { loadGuestPublicEarnings } from '../../lib/portfolio/loadGuestPublicEarnings';

export const metadata: Metadata = buildCryptoAssetPageMetadata('ethereum');

const EthereumPage = async () => {
  const initialPublicEarnings = await loadGuestPublicEarnings();

  return (
    <PublicEarningsGuestProvider value={initialPublicEarnings}>
      <EthereumPageClient />
    </PublicEarningsGuestProvider>
  );
};

export default EthereumPage;
