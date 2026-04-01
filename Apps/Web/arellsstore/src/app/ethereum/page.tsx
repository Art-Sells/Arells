import type { Metadata } from 'next';
import EthereumPageClient from '../../components/Assets/Crypto/Ethereum/EthereumPageClient';

export const metadata: Metadata = {
  title: 'Ethereum',
  description: 'if investments never lost value.',
  robots: 'noimageindex',
  icons: {
    icon: '/ArellsIcoIcon.png',
    shortcut: '/ArellsIcoIcon.png',
    apple: '/ArellsIcoIcon.png'
  },
  openGraph: {
    title: 'Ethereum',
    description: 'if investments never lost value.',
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
    description: 'if investments never lost value.',
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
