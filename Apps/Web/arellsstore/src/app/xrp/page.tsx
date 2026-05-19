import type { Metadata } from 'next';
import XrpPageClient from '../../components/Assets/Crypto/Xrp/XrpPageClient';
import { buildCryptoAssetPageMetadata } from '../../lib/assets/cryptoAssetRegistry';

export const metadata: Metadata = buildCryptoAssetPageMetadata('xrp');

const XrpPage = () => {
  return <XrpPageClient />;
};

export default XrpPage;
