import type { Metadata } from 'next';
import CardanoPageClient from '../../components/Assets/Crypto/Cardano/CardanoPageClient';
import { PublicEarningsGuestProvider } from '../../components/MyPortfolio/PublicEarningsGuestContext';
import { buildCryptoAssetPageMetadata } from '../../lib/assets/cryptoAssetRegistry';
import { loadGuestPublicEarnings } from '../../lib/portfolio/loadGuestPublicEarnings';

export const metadata: Metadata = buildCryptoAssetPageMetadata('cardano');

const CardanoPage = async () => {
  const initialPublicEarnings = await loadGuestPublicEarnings();

  return (
    <PublicEarningsGuestProvider value={initialPublicEarnings}>
      <CardanoPageClient />
    </PublicEarningsGuestProvider>
  );
};

export default CardanoPage;
