import { ReactNode } from 'react';
import { BitcoinPriceProvider } from '../context/BitcoinPriceContext';
import { UserProvider } from '../context/UserContext';
import { HPMProvider } from '../context/HPMarchitecture';
import { HPMConceptProvider } from '../context/concept/HPMContextConcept';
import ConfigureAmplifyClientSide from '../components/Amplify/ConfigureAmplifyClientSide';
import { Amplify } from 'aws-amplify';
import awsmobile from '../aws-exports';
import dotenv from 'dotenv';
import { MASSProvider } from '../context/MASSarchitecture';
import { SignerProvider } from "../state/signer";

dotenv.config();
Amplify.configure(awsmobile);

type LayoutProps = {
  children: ReactNode;
};

const RootLayout = ({ children }: LayoutProps) => {

  return (
    <html lang="en">
      {/* <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
        />
        <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
        <link rel="icon" href="/favicon.ico" />
        // CAUTION!: favicon.ico might show up "blurry on google"
      </head> */}
      <body>
        <ConfigureAmplifyClientSide />
        <BitcoinPriceProvider>
          <UserProvider>
            <SignerProvider>
              
              <HPMProvider>
                <MASSProvider>
                  <HPMConceptProvider>
                    {children}
                  </HPMConceptProvider>
                </MASSProvider>
              </HPMProvider>
            </SignerProvider>
          </UserProvider>
        </BitcoinPriceProvider>
      </body>
    </html>
  );
};

export default RootLayout;
