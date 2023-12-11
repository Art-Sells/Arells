import '../css/prototype/asset/asset.css';

import React from "react";
import CreateArt from '../../components/Create/CreateArt';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Create Art",
  description: "Create art that never loses value.",
  robots: "noimageindex",
  openGraph: {
    title: "Create Art That Never Loses Value.",
    description: "Render bear markets obsolete with Arells.",
    url: "https://arells.com/create",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default.jpg"
      }
    ]
  },
  twitter: {
    title: "Create Art That Never Loses Value.",
    description: "Render bear markets obsolete with Arells.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default.jpg"
      }
    ]
  }
};

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


