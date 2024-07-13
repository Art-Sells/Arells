// pages/_app.tsx or wherever your RootLayout is used
import { ReactNode } from 'react';
import { BitcoinPriceProvider } from '../context/BitcoinPriceContext';
import { EmailProvider } from '../context/EmailContext';
import { UserProvider } from '../context/UserContext'; // Import UserProvider
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
        <link rel="shortcut icon" href="https://arells.com/ArellsIcoIcon.png" />
      </head>
      <body>
        <ConfigureAmplifyClientSide />
        <EmailProvider>
          <BitcoinPriceProvider>
            <UserProvider>
              {children}
            </UserProvider>
          </BitcoinPriceProvider>
        </EmailProvider>
      </body>
    </html>
  );
}