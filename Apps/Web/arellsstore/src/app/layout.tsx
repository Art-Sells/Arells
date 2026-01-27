import { ReactNode } from 'react';
import { BitcoinPriceProvider } from '../context/BitcoinPriceContext';
import { UserProvider } from '../context/UserContext';
import { VavityProvider } from '../context/VavityAggregator';
import ConfigureAmplifyClientSide from '../components/Amplify/ConfigureAmplifyClientSide';
import { Amplify } from 'aws-amplify';
import awsmobile from '../aws-exports';
import dotenv from 'dotenv';

dotenv.config();
Amplify.configure(awsmobile);

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
        <ConfigureAmplifyClientSide />
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
