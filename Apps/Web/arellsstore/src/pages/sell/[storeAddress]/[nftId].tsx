
//change link after testing
import '../../../app/css/prototype/asset/asset.css';

import React from "react";
import type { Metadata } from 'next';

//change link after testing
import Asset from '../../../components/Asset/Asset';
import { SignerProvider } from '../../../state/signer';
import { ApolloWrapper } from '../../../lib/apollo-provider';

export const metadata: Metadata = {
  title: "Arells",
  description: "Buy art that never loses value. With Arells bear markets are obsolete.",
  robots: "noimageindex",

  openGraph: {
    title: "Arells",
    description: "Buy art that never loses value. With Arells bear markets are obsolete.",
    // Change this link after testing
    url: "https://arells.com", 
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Banner.jpg"
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
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Banner.jpg"
      }
    ]
  }
}

const SellPage = () => {
  return (
    <>
      <title>Sell Art</title>
      <div id="asset-wrapper">
        <SignerProvider>
          <ApolloWrapper>
            <Asset/>
          </ApolloWrapper>      
        </SignerProvider>
      </div>
    </>
  );
}

export default SellPage;


