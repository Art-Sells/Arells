import '../../css/prototype/asset/blue-orange.css';

import React from "react";

import {SignerProvider} from "../../../../state/signer";

import CreateArtTest from '../../../components/test/CreationPage/CreateArtTest';

export const metadata = {
  title: "Create Test",
  description: "Test for Creating",
  robots: "noimageindex",
  httpEquiv: {
    "X-UA-Compatible": "IE=edge"
  },
  charSet: "UTF-8",
  //change link below after test
  linkCanonical: "https://arells.com/test/create",

  openGraph: {
    site_name: "Arells",
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
    url: "https://arells.com/test/create",
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
      <div id="blue-orange-wrapper">
        <SignerProvider>
          <CreateArtTest/>
        </SignerProvider>
      </div>
    </>
  );
}

export default CreateTest;

