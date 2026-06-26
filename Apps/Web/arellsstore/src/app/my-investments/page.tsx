import type { Metadata } from 'next';
import MyInvestmentsPageClient from '../../components/MyInvestments/MyInvestmentsPageClient';
const myInvestmentsBanner = '/images/banners/MyInvestmentsBanner.jpg';

const description =
  'View and manage your investments on Arells. Track assets powered by Vavity so your investments never lose value.';

export const metadata: Metadata = {
  title: 'My Investments never lose value',
  description,
  robots: { index: false, follow: true },
  alternates: {
    canonical: '/my-investments',
  },
  openGraph: {
    title: 'My Investments never lose value',
    description,
    url: '/my-investments',
    type: 'website',
    images: [{ url: myInvestmentsBanner }],
  },
  twitter: {
    title: 'My Investments never lose value',
    description,
    card: 'summary_large_image',
    images: [{ url: myInvestmentsBanner }],
  },
};

const MyInvestmentsPage = () => {
  return <MyInvestmentsPageClient />;
};

export default MyInvestmentsPage;

