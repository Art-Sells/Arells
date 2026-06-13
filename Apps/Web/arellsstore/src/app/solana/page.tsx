import type { Metadata } from 'next';
import SolanaPageClient from '../../components/Assets/Crypto/Solana/SolanaPageClient';
import { PublicEarningsGuestProvider } from '../../components/MyPortfolio/PublicEarningsGuestContext';
import { buildCryptoAssetPageMetadata } from '../../lib/assets/cryptoAssetRegistry';
import { loadGuestPublicEarnings } from '../../lib/portfolio/loadGuestPublicEarnings';

export const metadata: Metadata = buildCryptoAssetPageMetadata('solana');

const SolanaPage = async () => {
  const initialPublicEarnings = await loadGuestPublicEarnings();

  return (
    <PublicEarningsGuestProvider value={initialPublicEarnings}>
      <SolanaPageClient />
    </PublicEarningsGuestProvider>
  );
};

export default SolanaPage;
