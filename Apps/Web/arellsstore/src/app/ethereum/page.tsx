import type { Metadata } from 'next';
import EthereumPageClient from '../../components/Assets/Crypto/Ethereum/EthereumPageClient';
import { buildCryptoAssetPageMetadata } from '../../lib/assets/cryptoAssetRegistry';

export const metadata: Metadata = buildCryptoAssetPageMetadata('ethereum');

const EthereumPage = () => {
  return <EthereumPageClient />;
};

export default EthereumPage;
