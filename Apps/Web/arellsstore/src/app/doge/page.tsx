import type { Metadata } from 'next';
import DogePageClient from '../../components/Assets/Crypto/Doge/DogePageClient';
import { buildCryptoAssetPageMetadata } from '../../lib/assets/cryptoAssetRegistry';

export const metadata: Metadata = buildCryptoAssetPageMetadata('doge');

const DogePage = () => {
  return <DogePageClient />;
};

export default DogePage;
