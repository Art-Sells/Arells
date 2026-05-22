import type { Metadata } from 'next';
import MyInvestmentsPageClient from '../../components/MyInvestments/MyInvestmentsPageClient';
import { HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION } from '../../lib/siteMetaDescriptions';

const myInvestmentsBanner = '/images/banners/MyInvestmentsBanner.jpg';

export const metadata: Metadata = {
  title: 'My Investments never lose value',
  description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/my-investments',
  },
  openGraph: {
    title: 'My Investments never lose value',
    description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
    url: '/my-investments',
    type: 'website',
    images: [{ url: myInvestmentsBanner }],
  },
  twitter: {
    title: 'My Investments never lose value',
    description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
    card: 'summary_large_image',
    images: [{ url: myInvestmentsBanner }],
  },
};

const MyInvestmentsPage = () => {
  return <MyInvestmentsPageClient />;
};

export default MyInvestmentsPage;

