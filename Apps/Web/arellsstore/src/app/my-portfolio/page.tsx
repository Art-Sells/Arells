import type { Metadata } from 'next';
import MyPortfolioPageClient from '../../components/MyPortfolio/MyPortfolioPageClient';
import { HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION } from '../../lib/siteMetaDescriptions';

const banner = '/images/banners/MyInvestmentsBanner.jpg';

export const metadata: Metadata = {
  title: 'My Portfolio — Arells',
  description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
  robots: { index: false, follow: true },
  alternates: { canonical: '/my-portfolio' },
  openGraph: {
    title: 'My Portfolio — Arells',
    description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
    url: '/my-portfolio',
    type: 'website',
    images: [{ url: banner }],
  },
};

export default function MyPortfolioPage() {
  return <MyPortfolioPageClient />;
}
