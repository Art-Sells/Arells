import type { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';
import './css/Home.css';
import './css/HomeLoaderOverrides.css';
import { UserProvider } from '../context/UserContext';
import AnalyticsBeacon from '../components/Analytics/AnalyticsBeacon';
import { VavityProvider } from '../context/VavityAggregator';
import { AssetsProvider } from '../context/Assets/AssetsProvider';
import { defaultSiteIcons } from '../lib/defaultSiteIcons';
import { getSiteMetadataBase } from '../lib/siteMetadataBase';

/** Default tab icons; `/bitcoin`, `/ethereum`, `/vavity` override via their own `metadata.icons`. */
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

const RootLayout = ({ children }: LayoutProps) => {
  return (
    <html lang="en">
      <body>
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
