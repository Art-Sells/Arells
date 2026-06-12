import type { Metadata } from 'next';
import { headers } from 'next/headers';
import MyPortfolioPageClient from '../../components/MyPortfolio/MyPortfolioPageClient';
import { resolveAppOrigin } from '../../lib/auth/origin';
import { getSessionFromAppCookies } from '../../lib/auth/session';
import {
  fetchPortfolioLeaderboardServer,
  fetchPortfolioMeServer,
} from '../../lib/portfolio/fetchPortfolioDataServer';
import { fetchPublicEarningsServer } from '../../lib/portfolio/fetchPublicEarningsServer';
import { HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION } from '../../lib/siteMetaDescriptions';

const banner = '/images/banners/MyInvestmentsBanner.jpg';

export const metadata: Metadata = {
  title: 'My Portfolio',
  description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
  robots: { index: false, follow: true },
  alternates: { canonical: '/my-portfolio' },
  openGraph: {
    title: 'My Portfolio',
    description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
    url: '/my-portfolio',
    type: 'website',
    images: [{ url: banner }],
  },
};

export default async function MyPortfolioPage() {
  const session = await getSessionFromAppCookies();
  const origin = resolveAppOrigin(headers().get('origin') ?? undefined, undefined);

  const [initialPortfolioMe, initialLeaderboardRows, initialPublicEarnings] = session
    ? await Promise.all([
        fetchPortfolioMeServer(session.email, origin),
        fetchPortfolioLeaderboardServer(),
        Promise.resolve(null),
      ])
    : await Promise.all([
        Promise.resolve(null),
        Promise.resolve([]),
        fetchPublicEarningsServer(),
      ]);

  return (
    <MyPortfolioPageClient
      initialPortfolioMe={initialPortfolioMe}
      initialLeaderboardRows={initialLeaderboardRows ?? []}
      initialPublicEarnings={initialPublicEarnings}
    />
  );
}
