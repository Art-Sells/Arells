import type { Metadata } from 'next';
import MyInvestmentsPageClient from '../../components/MyInvestments/MyInvestmentsPageClient';

const myInvestmentsBanner = '/images/banners/MyInvestmentsBanner.jpg';

export const metadata: Metadata = {
  title: 'My Investments never lose value',
  description: 'Investments never lose value.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/my-investments',
  },
  openGraph: {
    title: 'My Investments never lose value',
    description: 'Investments never lose value.',
    url: '/my-investments',
    type: 'website',
    images: [{ url: myInvestmentsBanner }],
  },
  twitter: {
    title: 'My Investments never lose value',
    description: 'Investments never lose value.',
    card: 'summary_large_image',
    images: [{ url: myInvestmentsBanner }],
  },
};

const MyInvestmentsPage = () => {
  return <MyInvestmentsPageClient />;
};

export default MyInvestmentsPage;

