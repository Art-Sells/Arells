import '../../app/css/prototype/seller-created.css';

import React from "react";
import type { Metadata } from 'next';

//change link after testing
import Selling from '../../components/Selling';
import { SignerProvider } from '../../state/signer';
import { ApolloWrapper } from '../../lib/apollo-provider';

export const metadata: Metadata = {
  title: "Arells",
  description: "Buy art that never loses value. With Arells bear markets are obsolete.",
  robots: "noimageindex",

  openGraph: {
    title: "Arells",
    description: "Buy art that never loses value. With Arells bear markets are obsolete.",
    // Change this link after testing
    url: "https://arells.com/buy/[storeAddress]", 
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner-prototype.jpg"
      }
    ]
  },

  twitter: {
    title: "Arells",
    description: "Buy art that never loses value. With Arells bear markets are obsolete.",
    // Change this link after testing
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner-prototype.jpg"
      }
    ]
  }
}

const SellingPage = () => {
  return (
    <>
          <div id="prototype-seller-created-wrapper">
            <SignerProvider>
              <ApolloWrapper>
                <Selling/>
              </ApolloWrapper>      
            </SignerProvider>
          </div>
    </>
  );
}

export default SellingPage;

