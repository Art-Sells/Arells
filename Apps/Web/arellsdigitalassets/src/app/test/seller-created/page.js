import '../../css/prototype/seller-created.css';

import React from "react";

import {SignerProvider} from "../../../../state/signer";

import SellerCreatedTest from '../../../components/test/SellerCreatedTest.js';

export const metadata = {
  title: "Seller Creations Test",
  description: "Test for Seller Creations",
  robots: "noimageindex",
  httpEquiv: {
    "X-UA-Compatible": "IE=edge"
  },
  charSet: "UTF-8",
  //change link below after test
  linkCanonical: "https://arells.com/test/seller-created",

  openGraph: {
    site_name: "Arells",
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
    url: "https://arells.com/test/seller-created",
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
        <div id="prototype-seller-created-wrapper">
          <SignerProvider>  
            <SellerCreatedTest/>
          </SignerProvider>  
        </div>
    </>
  );
}

export default SellerCreatedPageTest;


