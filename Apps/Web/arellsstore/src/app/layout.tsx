import { ReactNode } from 'react';
import { EthereumPriceProvider } from '../context/EthereumPriceContext';
import { UserProvider } from '../context/UserContext';
import { VavityAssetConnectProvider } from '../context/VavityAssetConnectContext';
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
        <EthereumPriceProvider>
          <UserProvider>
              <VavityProvider>
                <VavityAssetConnectProvider>
                    {children}
                </VavityAssetConnectProvider>
              </VavityProvider>
          </UserProvider>
        </EthereumPriceProvider>
      </body>
    </html>
  );
};

export default RootLayout;
