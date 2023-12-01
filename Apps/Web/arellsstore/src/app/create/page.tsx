import '../css/prototype/asset/asset.css';

import React from "react";

import type { Metadata } from 'next';

import CreateArt from '../../components/Create/CreateArt';

export const metadata: Metadata = {
  title: "Create Art",
  description: "Create Art To Sell",
  robots: "noimageindex",

  openGraph: {
    title: "Create Art",
    description: "Create Art To Sell",
    // Change this link after testing
    url: "https://arells.com/create", 
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner-prototype.jpg"
      }
    ]
  },

  twitter: {
    title: "Create Art",
    description: "Create Art To Sell",
    // Change this link after testing
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner-prototype.jpg"
      }
    ]
  }
}

const CreateTest = () => {

  return (
    <>
        <div id="asset-wrapper">
          <CreateArt/>
        </div>  
    </>
  );
}

export default CreateTest;


