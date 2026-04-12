import type { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';
import { UserProvider } from '../context/UserContext';
import AnalyticsBeacon from '../components/Analytics/AnalyticsBeacon';
import { VavityProvider } from '../context/VavityAggregator';
import { AssetsProvider } from '../context/Assets/AssetsProvider';
import FaviconSwitcher from '../components/FaviconSwitcher';

/** Default tab icon; `/bitcoin` and `/ethereum` override via their own `metadata.icons`. */
export const metadata: Metadata = {
  icons: {
    icon: '/ArellsIcoIcon.png',
    shortcut: '/ArellsIcoIcon.png',
    apple: '/ArellsIcoIcon.png',
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
        <FaviconSwitcher />
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
