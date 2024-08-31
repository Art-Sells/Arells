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

const RootLayout = ({ children }: LayoutProps) => {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits." />
        <meta name="robots" content="noimageindex" />
        <meta property="og:title" content="Arells" />
        <meta property="og:description" content="Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits." />
        <meta property="og:url" content="https://arells.com" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg" />
        <meta name="twitter:title" content="Arells" />
        <meta name="twitter:description" content="Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg" />
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
};

export default RootLayout;
