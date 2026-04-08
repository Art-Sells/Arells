import type { Metadata } from 'next';
import BitcoinPageClient from '../../components/Assets/Crypto/Bitcoin/BitcoinPageClient';
export const metadata: Metadata = {
  title: "Bitcoin",
  description: "If investments never lost value.",
  robots: { index: false, follow: true },
  icons: {
    icon: "/images/favicons/BtcBadge.svg",
    shortcut: "/images/favicons/BtcBadge.svg",
    apple: "/images/favicons/BtcBadge.svg"
  },
  openGraph: {
    title: "Bitcoin",
    description: "If investments never lost value.",
    url: "https://arells.com/bitcoin",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/images%26banners/assets/crypto/Bitcoin/ArellsBTCBanner.jpg"
      }
    ]
  },
  twitter: {
    title: "Bitcoin",
    description: "If investments never lost value.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/images%26banners/assets/crypto/Bitcoin/ArellsBTCBanner.jpg"
      }
    ]
  }
};

const BitcoinPage = () => {
  return <BitcoinPageClient />;
};

export default BitcoinPage;