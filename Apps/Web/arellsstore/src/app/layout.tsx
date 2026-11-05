import type { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';
import './css/global.css';
import { UserProvider } from '../context/UserContext';
import { AlienCharacterCreateProvider } from '../context/AlienCharacterCreateContext';
import AlienCharacterCreateHost from '../components/Assets/shared/AlienCharacterCreateHost';
import AssetNavCircleLoaderHost from '../components/Assets/shared/AssetNavCircleLoaderHost';
import AnalyticsBeacon from '../components/Analytics/AnalyticsBeacon';
import ReferralCaptureRoot from './referral-capture';
import { VavityProvider } from '../context/VavityAggregator';
import { defaultSiteIcons } from '../lib/defaultSiteIcons';
import { getSiteMetadataBase } from '../lib/siteMetadataBase';

/** Default tab icons; `/bitcoin`, `/ethereum`, `/bnb`, `/solana`, `/tron`, `/cardano`, `/stellar`, `/bitcoin-cash`, `/chainlink`, `/vavity` override via their own `metadata.icons`. */
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
        description: 'On a mission to ensure investments never lose value.',
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
          <AlienCharacterCreateProvider>
            <ReferralCaptureRoot />
            <AnalyticsBeacon />
            <VavityProvider>{children}</VavityProvider>
            <AssetNavCircleLoaderHost />
            <AlienCharacterCreateHost />
          </AlienCharacterCreateProvider>
        </UserProvider>
      </body>
    </html>
  );
};

export default RootLayout;
