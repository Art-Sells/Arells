import type { Metadata } from 'next';
import MyPortfolioPageClient from '../../components/MyPortfolio/MyPortfolioPageClient';
import { fetchPublicEarningsServer } from '../../lib/portfolio/fetchPublicEarningsServer';
import { HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION } from '../../lib/siteMetaDescriptions';

const banner = '/images/banners/MyInvestmentsBanner.jpg';

/** Signed-out my-portfolio UI. Works while signed in. */
export const metadata: Metadata = {
  title: 'Preview — My Portfolio (signed out)',
  description: 'Layout preview: guest / signed-out my portfolio.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/my-portfolio-preview' },
  openGraph: {
    title: 'Preview — My Portfolio (signed out)',
    description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
    url: '/my-portfolio-preview',
    type: 'website',
    images: [{ url: banner }],
  },
};

export default async function MyPortfolioPreviewPage() {
  const initialPublicEarnings = await fetchPublicEarningsServer();

  return (
    <MyPortfolioPageClient
      guestPreview
      initialPublicEarnings={initialPublicEarnings}
    />
  );
}
