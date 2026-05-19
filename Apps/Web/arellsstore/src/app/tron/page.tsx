import type { Metadata } from 'next';
import TronPageClient from '../../components/Assets/Crypto/Tron/TronPageClient';
import { buildCryptoAssetPageMetadata } from '../../lib/assets/cryptoAssetRegistry';

export const metadata: Metadata = buildCryptoAssetPageMetadata('tron');

const TronPage = () => {
  return <TronPageClient />;
};

export default TronPage;
