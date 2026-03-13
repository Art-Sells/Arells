import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = {
  title: 'About',
  description: 'About Arells.',
  robots: 'noimageindex',
};

const AboutPage = () => {
  return <AboutPageClient />;
};

export default AboutPage;
