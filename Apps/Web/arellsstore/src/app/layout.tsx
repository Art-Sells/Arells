// pages/_app.tsx or wherever your RootLayout is used
import { ReactNode } from 'react';
import { BitcoinPriceProvider } from '../context/BitcoinPriceContext';
import { EmailProvider } from '../context/EmailContext';
import { UserProvider } from '../context/UserContext';
import { HPMProvider } from '../context/HPMContext';
import ConfigureAmplifyClientSide from '../components/Amplify/ConfigureAmplifyClientSide';
import { Amplify } from 'aws-amplify';
import awsmobile from '../aws-exports';

Amplify.configure(awsmobile);

type LayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <link rel="shortcut icon" href="/ArellsBitcoin.png" />
      </head>
      <body>
        <ConfigureAmplifyClientSide />
          <BitcoinPriceProvider>
            <EmailProvider>
              <UserProvider>
                <HPMProvider>
                  {children}
                </HPMProvider>
              </UserProvider>
            </EmailProvider>
          </BitcoinPriceProvider>

      </body>
    </html>
  );
}