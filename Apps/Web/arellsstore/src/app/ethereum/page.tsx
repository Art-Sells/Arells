import type { Metadata } from 'next';
import EthereumPageClient from '../../components/Assets/Crypto/Ethereum/EthereumPageClient';

export const metadata: Metadata = {
  title: 'Ethereum',
  description: 'If bear markets never existed.',
  robots: 'noimageindex',
  openGraph: {
    title: 'Ethereum',
    description: 'If bear markets never existed.',
    url: 'https://arells.com/ethereum',
    type: 'website',
    images: [
      {
        url: 'https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsEthereumBannerOne.jpg'
      }
    ]
  },
  twitter: {
    title: 'Arells',
    description: 'If bear markets never existed.',
    card: 'summary_large_image',
    images: [
      {
        url: 'https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsEthereumBannerOne.jpg'
      }
    ]
  }
};

const EthereumPage = () => {
  return <EthereumPageClient />;
};

export default EthereumPage;
