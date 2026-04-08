import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = {
  title: 'About',
  description: 'Arells is a belief that investments should never lose value.',
  robots: 'noimageindex',
};

const AboutPage = () => {
  return <AboutPageClient />;
};

export default AboutPage;
