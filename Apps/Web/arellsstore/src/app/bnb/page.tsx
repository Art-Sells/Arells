import type { Metadata } from 'next';
import BnbPageClient from '../../components/Assets/Crypto/Bnb/BnbPageClient';
import { buildCryptoAssetPageMetadata } from '../../lib/assets/cryptoAssetRegistry';

export const metadata: Metadata = buildCryptoAssetPageMetadata('bnb');

const BnbPage = () => {
  return <BnbPageClient />;
};

export default BnbPage;
