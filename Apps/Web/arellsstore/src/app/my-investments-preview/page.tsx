import type { Metadata } from 'next';
import MyInvestmentsPageClient from '../../components/MyInvestments/MyInvestmentsPageClient';

const myInvestmentsBanner = '/images/banners/MyInvestmentsBanner.jpg';

/** Signed-in, zero-holdings UI (mission + Add Investments). Not tied to auth. */
export const metadata: Metadata = {
  title: 'Preview — My Investments (empty portfolio)',
  description: 'Layout preview: signed in with no assets.',
  robots: { index: false, follow: false },
  alternates: {
    canonical: '/my-investments-preview',
  },
  openGraph: {
    title: 'Preview — My Investments (empty portfolio)',
    description: 'Layout preview: signed in with no assets.',
    url: '/my-investments-preview',
    type: 'website',
    images: [{ url: myInvestmentsBanner }],
  },
  twitter: {
    title: 'Preview — My Investments (empty portfolio)',
    description: 'Layout preview: signed in with no assets.',
    card: 'summary_large_image',
    images: [{ url: myInvestmentsBanner }],
  },
};

export default function MyInvestmentsPreviewPage() {
  return <MyInvestmentsPageClient emptyPortfolioPreview />;
}
