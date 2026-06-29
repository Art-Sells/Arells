import type { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';
import './css/server-seo-summary.css';
import './css/Home.css';
import './css/HomeLoaderOverrides.css';
import './css/assets/crypto/xrp-asset-rules.css';
import './css/assets/crypto/bnb-asset-rules.css';
import './css/assets/crypto/solana-asset-rules.css';
import './css/assets/crypto/tron-asset-rules.css';
import './css/assets/crypto/doge-asset-rules.css';
import './css/assets/crypto/cardano-asset-rules.css';
import './css/assets/crypto/bch-asset-rules.css';
import './css/home-myinv-asset-chip-colors.css';
import { UserProvider } from '../context/UserContext';
import AnalyticsBeacon from '../components/Analytics/AnalyticsBeacon';
import ReferralCaptureRoot from './referral-capture';
import { VavityProvider } from '../context/VavityAggregator';
import { defaultSiteIcons } from '../lib/defaultSiteIcons';
import { getSiteMetadataBase } from '../lib/siteMetadataBase';

/** Default tab icons; `/bitcoin`, `/ethereum`, `/bnb`, `/solana`, `/tron`, `/cardano`, `/bitcoin-cash`, `/vavity` override via their own `metadata.icons`. */
export const metadata: Metadata = {
  metadataBase: getSiteMetadataBase(),
  icons: defaultSiteIcons,
};

/** Lets `env(safe-area-inset-*)` reflect notch / home indicator on phones (e.g. My Investments header). */
export const viewport: Viewport = {
  viewportFit: 'cover',
};

type LayoutProps = {
  children: ReactNode;
};

/** Sitewide structured data for search + generative engines (paired with per-route `metadata` + sitemap). */
function siteJsonLd(origin: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: 'Arells',
        url: origin,
        logo: `${origin}/ArellsIcon.png`,
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        name: 'Arells',
        url: origin,
        description: 'Investments never lose value.',
        inLanguage: 'en-US',
        publisher: { '@id': `${origin}/#organization` },
      },
    ],
  };
}

const RootLayout = ({ children }: LayoutProps) => {
  const origin = getSiteMetadataBase().origin;
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger -- JSON-LD requires raw script injection
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd(origin)) }}
        />
        <UserProvider>
          <ReferralCaptureRoot />
          <AnalyticsBeacon />
          <VavityProvider>{children}</VavityProvider>
        </UserProvider>
      </body>
    </html>
  );
};

export default RootLayout;
