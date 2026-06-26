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
