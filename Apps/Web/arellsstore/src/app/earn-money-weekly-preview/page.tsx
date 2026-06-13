import type { Metadata } from 'next';
import EarnMoneyWeeklyPageClient from '../../components/MyPortfolio/EarnMoneyWeeklyPageClient';
import { fetchPublicEarningsServer } from '../../lib/portfolio/fetchPublicEarningsServer';
import { HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION } from '../../lib/siteMetaDescriptions';

const banner = '/images/banners/MyInvestmentsBanner.jpg';

/** Signed-out earn-money-weekly UI. Works while signed in. */
export const metadata: Metadata = {
  title: 'Earn Money Weekly',
  description: 'Layout preview: guest / signed-out earn money weekly.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/earn-money-weekly-preview' },
  openGraph: {
    title: 'Earn Money Weekly',
    description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
    url: '/earn-money-weekly-preview',
    type: 'website',
    images: [{ url: banner }],
  },
};

export default async function EarnMoneyWeeklyPreviewPage() {
  const initialPublicEarnings = await fetchPublicEarningsServer();

  return (
    <EarnMoneyWeeklyPageClient
      guestPreview
      initialPublicEarnings={initialPublicEarnings}
    />
  );
}
