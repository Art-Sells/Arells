import { ReactNode } from 'react';
import { BitcoinPriceProvider } from '../context/BitcoinPriceContext';
import { UserProvider } from '../context/UserContext';
import { VavityProvider } from '../context/VavityAggregator';

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
        <BitcoinPriceProvider>
          <UserProvider>
              <VavityProvider>
                {children}
              </VavityProvider>
          </UserProvider>
        </BitcoinPriceProvider>
      </body>
    </html>
  );
};

export default RootLayout;
