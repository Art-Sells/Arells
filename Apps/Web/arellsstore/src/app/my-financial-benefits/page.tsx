import type { Metadata } from 'next';
import MyFinancialBenefitsPageClient from '../../components/MyPortfolio/MyFinancialBenefitsPageClient';
import { HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION } from '../../lib/siteMetaDescriptions';

const banner = '/images/banners/MyInvestmentsBanner.jpg';

export const metadata: Metadata = {
  title: 'My Financial Benefits — Arells',
  description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
  robots: { index: false, follow: true },
  alternates: { canonical: '/my-financial-benefits' },
  openGraph: {
    title: 'My Financial Benefits — Arells',
    description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
    url: '/my-financial-benefits',
    type: 'website',
    images: [{ url: banner }],
  },
};

export default function MyFinancialBenefitsPage() {
  return <MyFinancialBenefitsPageClient />;
}
