import type { Metadata } from 'next';
import { headers } from 'next/headers';
import MyPortfolioPageClient from '../../components/MyPortfolio/MyPortfolioPageClient';
import { resolveAppOrigin } from '../../lib/auth/origin';
import { readRequestHostHeaders } from '../../lib/auth/requestHostHeaders';
import { getSessionFromAppCookies } from '../../lib/auth/session';
import {
  fetchPortfolioLeaderboardServer,
  fetchPortfolioMeServer,
} from '../../lib/portfolio/fetchPortfolioDataServer';
import { fetchPublicEarningsServer } from '../../lib/portfolio/fetchPublicEarningsServer';
import { HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION, HOME_OG_BANNER } from '../../lib/siteMetaDescriptions';

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
    images: [{ url: HOME_OG_BANNER }],
  },
};

export default async function MyPortfolioPage() {
  const session = await getSessionFromAppCookies();
  const requestHeaders = headers();
  const origin = resolveAppOrigin(
    requestHeaders.get('origin') ?? undefined,
    undefined,
    readRequestHostHeaders(requestHeaders)
  );

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
