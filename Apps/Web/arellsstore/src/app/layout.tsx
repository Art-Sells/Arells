import { ReactNode } from 'react';
import { UserProvider } from '../context/UserContext';
import { VavityProvider } from '../context/VavityAggregator';
import { AssetsProvider } from '../context/Assets/AssetsProvider';
import FaviconSwitcher from '../components/FaviconSwitcher';

type LayoutProps = {
  children: ReactNode;
};

const RootLayout = ({ children }: LayoutProps) => {

  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/ArellsIcoIcon.png" />
        <link rel="shortcut icon" type="image/png" href="/ArellsIcoIcon.png" />
        <link rel="apple-touch-icon" href="/ArellsIcoIcon.png" />
      </head>
      <body>
        <FaviconSwitcher />
        <AssetsProvider>
          <UserProvider>
            <VavityProvider>{children}</VavityProvider>
          </UserProvider>
        </AssetsProvider>
      </body>
    </html>
  );
};

export default RootLayout;
