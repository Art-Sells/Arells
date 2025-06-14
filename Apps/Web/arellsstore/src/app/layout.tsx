import { ReactNode } from 'react';
import { BitcoinPriceProvider } from '../context/BitcoinPriceContext';
import { UserProvider } from '../context/UserContext';
import { HPMConceptProvider } from '../context/concept/HPMContextConcept';
import { HPMProvider } from '../context/HPMarchitecture';
import ConfigureAmplifyClientSide from '../components/Amplify/ConfigureAmplifyClientSide';
import { Amplify } from 'aws-amplify';
import { SignerProvider } from "../state/signer";
import awsmobile from '../aws-exports';
import dotenv from 'dotenv';

dotenv.config();
Amplify.configure(awsmobile);

type LayoutProps = {
  children: ReactNode;
};

const RootLayout = ({ children }: LayoutProps) => {
  // const breadcrumbJsonLd = `
  // {
  //   "@context": "https://schema.org",
  //   "@type": "BreadcrumbList",
  //   "itemListElement": [
  //     {
  //       "@type": "ListItem",
  //       "position": 1,
  //       "name": "Arells",
  //       "item": "https://arells.com"
  //     },
  //     {
  //       "@type": "ListItem",
  //       "position": 2,
  //       "name": "Login",
  //       "item": "https://arells.com/login"
  //     }
  //   ]
  // }
  // `;

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
                <HPMConceptProvider>
                  {children}
                </HPMConceptProvider>
              </HPMProvider>
            </SignerProvider>
          </UserProvider>
        </BitcoinPriceProvider>
      </body>
    </html>
  );
};

export default RootLayout;
