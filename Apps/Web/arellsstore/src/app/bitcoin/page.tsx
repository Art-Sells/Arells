import type { Metadata } from 'next';
import BitcoinPageClient from '../../components/Assets/Crypto/Bitcoin/BitcoinPageClient';
export const metadata: Metadata = {
  title: "Bitcoin",
  description: "if investments never lost value.",
  robots: "noimageindex",
  icons: {
    icon: "/images/favicons/BtcBadge.svg",
    shortcut: "/images/favicons/BtcBadge.svg",
    apple: "/images/favicons/BtcBadge.svg"
  },
  openGraph: {
    title: "Bitcoin",
    description: "if investments never lost value.",
    url: "https://arells.com/bitcoin",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  },
  twitter: {
    title: "Bitcoin",
    description: "if investments never lost value.",
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