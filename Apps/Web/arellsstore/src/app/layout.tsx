import type { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';
import './css/Home.css';
import './css/xrp-asset-rules.css';
import './css/solana-asset-rules.css';
import './css/HomeLoaderOverrides.css';
import './css/bnb-asset-rules.css';
import './css/tron-asset-rules.css';
import { UserProvider } from '../context/UserContext';
import AnalyticsBeacon from '../components/Analytics/AnalyticsBeacon';
import { VavityProvider } from '../context/VavityAggregator';
import { AssetsProvider } from '../context/Assets/AssetsProvider';
import { defaultSiteIcons } from '../lib/defaultSiteIcons';
import { getSiteMetadataBase } from '../lib/siteMetadataBase';

/** Default tab icons; `/bitcoin`, `/ethereum`, `/bnb`, `/solana`, `/tron`, `/vavity` override via their own `metadata.icons`. */
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
        <AssetsProvider>
          <UserProvider>
            <AnalyticsBeacon />
            <VavityProvider>{children}</VavityProvider>
          </UserProvider>
        </AssetsProvider>
      </body>
    </html>
  );
};

export default RootLayout;
