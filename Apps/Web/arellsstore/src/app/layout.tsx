// pages/_app.tsx or wherever your RootLayout is used
import { ReactNode } from 'react';
import { BitcoinPriceProvider } from '../context/BitcoinPriceContext';
import { UserProvider } from '../context/UserContext';
import { HPMProvider } from '../context/HPMContext';
import ConfigureAmplifyClientSide from '../components/Amplify/ConfigureAmplifyClientSide';
import { Amplify } from 'aws-amplify';
import awsmobile from '../aws-exports';
import dotenv from 'dotenv';
dotenv.config();

Amplify.configure(awsmobile);

type LayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <link rel="shortcut icon" href="/ArellsBitcoin.png" />
        <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
      </head>
      <body>
        <ConfigureAmplifyClientSide />
          <BitcoinPriceProvider>
              <UserProvider>
                <HPMProvider>
                  {children}
                </HPMProvider>
              </UserProvider>
          </BitcoinPriceProvider>

      </body>
    </html>
  );
}