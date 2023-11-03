
import React from "react";

import AssetTest from '../../../../../components/test/Asset/Asset';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Asset Test",
  description: "Test for Asset",
  robots: "noimageindex",

  openGraph: {
    title: "Asset Test",
    description: "Test for Asset",
    // Change this link after testing
    url: "https://arells.com/test/asset", 
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner-prototype.jpg"
      }
    ]
  },

  twitter: {
    title: "Asset Test",
    description: "Test for Asset",
    // Change this link after testing
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner-prototype.jpg"
      }
    ]
  }
}

type AssetPageTestProps = {
  ownerId: string;
  nftId: string;
};

const AssetPageTest: React.FC<AssetPageTestProps> = ({ ownerId, nftId }) => {
  console.log('Parent nftId:', nftId);
  return (
    <div id="asset-wrapper">
      <AssetTest ownerId={ownerId} nftId={nftId} />
    </div>
  );
};

export default AssetPageTest;


