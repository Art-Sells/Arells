import '../../css/prototype/asset/blue-orange.css';

import React from "react";

import type { Metadata } from 'next';

import {SignerProvider} from "../../../state/signer";

import CreateArtTest from '../../../components/test/CreationPage/CreateArtTest';

export const metadata: Metadata = {
  title: "Create Test",
  description: "Test for Creating",
  robots: "noimageindex",

  openGraph: {
    title: "Create Test",
    description: "Test for Creating",
    // Change this link after testing
    url: "https://arells.com/test/create", 
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner-prototype.jpg"
      }
    ]
  },

  twitter: {
    title: "Create Test",
    description: "Test for Creating",
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
      <SignerProvider>
        <div id="blue-orange-wrapper">
          <CreateArtTest/>
        </div>  
      </SignerProvider>
    </>
  );
}

export default CreateTest;

