import type { Metadata } from 'next';
import MyPortfolioPageClient from '../../components/MyPortfolio/MyPortfolioPageClient';
import { getSessionFromAppCookies } from '../../lib/auth/session';
import { fetchPortfolioMeServer } from '../../lib/portfolio/fetchPortfolioDataServer';
import { fetchPublicEarningsServer } from '../../lib/portfolio/fetchPublicEarningsServer';
import { HOME_OG_BANNER } from '../../lib/siteMetaDescriptions';

const description =
  'Your Arells portfolio, referral network, and projected weekly earnings. Investments never lose value.';

export const metadata: Metadata = {
  title: 'My Portfolio',
  description,
  robots: { index: false, follow: true },
  alternates: { canonical: '/my-portfolio' },
  openGraph: {
    title: 'My Portfolio',
    description,
    url: '/my-portfolio',
    type: 'website',
    images: [{ url: HOME_OG_BANNER }],
  },
};

export default async function MyPortfolioPage() {
  const session = await getSessionFromAppCookies();

  const [initialPortfolioMe, initialPublicEarnings] = session
    ? await Promise.all([fetchPortfolioMeServer(session.email), Promise.resolve(null)])
    : await Promise.all([Promise.resolve(null), fetchPublicEarningsServer()]);

  return (
    <MyPortfolioPageClient
      initialPortfolioMe={initialPortfolioMe}
      initialPublicEarnings={initialPublicEarnings}
    />
  );
}
