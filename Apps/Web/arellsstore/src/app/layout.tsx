import type { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';
import { UserProvider } from '../context/UserContext';
import AnalyticsBeacon from '../components/Analytics/AnalyticsBeacon';
import { VavityProvider } from '../context/VavityAggregator';
import { AssetsProvider } from '../context/Assets/AssetsProvider';
import { arellsIcoIconUrl } from '../lib/faviconUrls';

/** Default tab icon site-wide; `/vavity/*` overrides in `app/vavity/layout.tsx`. */
export const metadata: Metadata = {
  icons: {
    icon: arellsIcoIconUrl,
    shortcut: arellsIcoIconUrl,
    apple: arellsIcoIconUrl,
  },
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
