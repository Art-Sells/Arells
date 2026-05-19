import type { Metadata } from 'next';
import SolanaPageClient from '../../components/Assets/Crypto/Solana/SolanaPageClient';
import { buildCryptoAssetPageMetadata } from '../../lib/assets/cryptoAssetRegistry';

export const metadata: Metadata = buildCryptoAssetPageMetadata('solana');

const SolanaPage = () => {
  return <SolanaPageClient />;
};

export default SolanaPage;
