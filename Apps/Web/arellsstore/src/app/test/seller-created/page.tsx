

import '../../css/prototype/seller-created.css';

import React from "react";
import Head from 'next/head';
import {SignerProvider} from "../../../state/signer";
import type { Metadata } from 'next';

import SellerCreatedTest from '../../../components/test/SellerCreatedTest';

export const metadata: Metadata = {
  title: "Seller Creations Test",
  description: "Test for Seller Creations",
  robots: "noimageindex",

  openGraph: {
    title: "Seller Creations Test",
    description: "Test for Seller Creations",
    // Change this link after testing
    url: "https://arells.com/test/seller-created", 
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner-prototype.jpg"
      }
    ]
  },

  twitter: {
    title: "Seller Creations Test",
    description: "Test for Seller Creations",
    // Change this link after testing
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner-prototype.jpg"
      }
    ]
  }
}

const SellerCreatedPageTest = () => {

  return (
    <>
      <SignerProvider>  
        <div id="prototype-seller-created-wrapper">
            <SellerCreatedTest/>
        </div>
      </SignerProvider>    
    </>
  );
}

export default SellerCreatedPageTest;

