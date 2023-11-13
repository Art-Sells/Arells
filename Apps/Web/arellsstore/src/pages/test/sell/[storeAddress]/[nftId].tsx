import '../../../../app/css/prototype/asset/asset.css';

import React from "react";
import type { Metadata } from 'next';

//change link after testing
import Asset from '../../../../components/test/Asset/Asset';
import { SignerProvider } from '../../../../state/signer';
import { ApolloWrapper } from '../../../../lib/apollo-provider';

export const metadata: Metadata = {
  title: "Arells",
  description: "Art For Sale",
  robots: "noimageindex",

  openGraph: {
    title: "Arells",
    description: "Art For Sale",
    // Change this link after testing
    url: "https://arells.com/test/sell/[storeAddress]/[nftId]", 
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

const SellPage = () => {
  return (
    <>
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


