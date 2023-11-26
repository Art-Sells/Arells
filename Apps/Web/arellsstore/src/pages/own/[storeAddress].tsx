
//change link after testing
import '../../app/css/prototype/seller-created.css';

import React from "react";
import type { Metadata } from 'next';

//change link after testing
import Owned from '../../components/Owned';
import { SignerProvider } from '../../state/signer';
import { ApolloWrapper } from '../../lib/apollo-provider';

export const metadata: Metadata = {
  title: "Arells",
  description: "Art For Sale",
  robots: "noimageindex",

  openGraph: {
    title: "Arells",
    description: "Art For Sale",
    // Change this link after testing
    url: "https://arells.com/test/owned/[storeAddress]", 
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner-prototype.jpg"
      }
    ]
  },

  twitter: {
    title: "Arells",
    description: "Art For Sale",
    // Change this link after testing
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner-prototype.jpg"
      }
    ]
  }
}

const OwnedPage = () => {
  return (
    <>
          <div id="prototype-seller-created-wrapper">
            <SignerProvider>
              <ApolloWrapper>
                <Owned/>
              </ApolloWrapper>      
            </SignerProvider>
          </div>
    </>
  );
}

export default OwnedPage;


