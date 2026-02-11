import type { Metadata } from 'next';
import BitcoinPageClient from '../../components/Assets/Crypto/Bitcoin/BitcoinPageClient';
export const metadata: Metadata = {
  title: "Arells Bitcoin",
  description: "Bitcoin dashboard for Arells.",
  robots: "noimageindex",
  openGraph: {
    title: "Arells Bitcoin",
    description: "Bitcoin dashboard for Arells.",
    url: "https://arells.com/bitcoin",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  },
  twitter: {
    title: "Arells",
    description: "If bear markets never existed Connect your investments.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  }
};

const BitcoinPage = () => {
  return <BitcoinPageClient />;
};

export default BitcoinPage;