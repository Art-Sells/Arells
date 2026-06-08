import type { Metadata } from 'next';
import MyFinancialBenefitsPageClient from '../../components/MyPortfolio/MyFinancialBenefitsPageClient';
import { fetchPublicEarningsServer } from '../../lib/portfolio/fetchPublicEarningsServer';
import { HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION } from '../../lib/siteMetaDescriptions';

const banner = '/images/banners/MyInvestmentsBanner.jpg';

/** Signed-out my-weekly-earnings UI. Works while signed in. */
export const metadata: Metadata = {
  title: 'Earn Money Weekly',
  description: 'Layout preview: guest / signed-out my weekly earnings.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/my-weekly-earnings-preview' },
  openGraph: {
    title: 'Earn Money Weekly',
    description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
    url: '/my-weekly-earnings-preview',
    type: 'website',
    images: [{ url: banner }],
  },
};

export default async function MyWeeklyEarningsPreviewPage() {
  const initialPublicEarnings = await fetchPublicEarningsServer();

  return (
    <MyFinancialBenefitsPageClient
      guestPreview
      initialPublicEarnings={initialPublicEarnings}
    />
  );
}
