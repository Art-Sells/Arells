import type { Metadata } from 'next';
import { headers } from 'next/headers';
import EarnMoneyWeeklyPageClient from '../../components/MyPortfolio/EarnMoneyWeeklyPageClient';
import { resolveAppOrigin } from '../../lib/auth/origin';
import { getSessionFromAppCookies } from '../../lib/auth/session';
import { fetchPortfolioMeServer } from '../../lib/portfolio/fetchPortfolioDataServer';
import { fetchPublicEarningsServer } from '../../lib/portfolio/fetchPublicEarningsServer';
import { HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION } from '../../lib/siteMetaDescriptions';

const banner = '/images/banners/MyInvestmentsBanner.jpg';

export const metadata: Metadata = {
  title: 'Earn Money Weekly',
  description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
  robots: { index: false, follow: true },
  alternates: { canonical: '/earn-money-weekly' },
  openGraph: {
    title: 'Earn Money Weekly',
    description: HOME_ABOUT_MY_INVESTMENTS_META_DESCRIPTION,
    url: '/earn-money-weekly',
    type: 'website',
    images: [{ url: banner }],
  },
};

export default async function EarnMoneyWeeklyPage() {
  const session = await getSessionFromAppCookies();
  const origin = resolveAppOrigin(headers().get('origin') ?? undefined, undefined);

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
