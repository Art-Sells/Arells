import '../../css/prototype/asset/asset.css';

import React from "react";
import type { Metadata } from 'next';

import AssetTest from '../../../components/test/Asset/AssetTest';

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

const AssetPageTest = () => {

  return (
    <>
          <div id="asset-wrapper">
              <AssetTest/>
          </div>
    </>
  );
}

export default AssetPageTest;


