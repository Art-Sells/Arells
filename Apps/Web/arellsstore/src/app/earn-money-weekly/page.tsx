import type { Metadata } from 'next';
import { headers } from 'next/headers';
import EarnMoneyWeeklyPageClient from '../../components/MyPortfolio/EarnMoneyWeeklyPageClient';
import { resolveAppOrigin } from '../../lib/auth/origin';
import { readRequestHostHeaders } from '../../lib/auth/requestHostHeaders';
import { getSessionFromAppCookies } from '../../lib/auth/session';
import { fetchPortfolioMeServer } from '../../lib/portfolio/fetchPortfolioDataServer';
import { fetchPublicEarningsServer } from '../../lib/portfolio/fetchPublicEarningsServer';
import { HOME_OG_BANNER } from '../../lib/siteMetaDescriptions';

const description =
  'See how much you can earn weekly on Arells through referrals and the users pool. Sign in to view your projected earnings.';

export const metadata: Metadata = {
  title: 'Earn Money Weekly',
  description,
  robots: { index: false, follow: true },
  alternates: { canonical: '/earn-money-weekly' },
  openGraph: {
    title: 'Earn Money Weekly',
    description,
    url: '/earn-money-weekly',
    type: 'website',
    images: [{ url: HOME_OG_BANNER }],
  },
};

export default async function EarnMoneyWeeklyPage() {
  const session = await getSessionFromAppCookies();
  const requestHeaders = headers();
  const origin = resolveAppOrigin(
    requestHeaders.get('origin') ?? undefined,
    undefined,
    readRequestHostHeaders(requestHeaders)
  );

  const [initialPortfolioMe, initialPublicEarnings] = await Promise.all([
    session ? fetchPortfolioMeServer(session.email, origin) : Promise.resolve(null),
    session ? Promise.resolve(null) : fetchPublicEarningsServer(),
  ]);

  return (
    <EarnMoneyWeeklyPageClient
      initialPortfolioMe={initialPortfolioMe}
      initialPublicEarnings={initialPublicEarnings}
    />
  );
}
