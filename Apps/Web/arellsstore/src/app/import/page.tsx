import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/import/import.css';


import Import from '../../components/Import/Import';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Import",
  description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
  robots: "noimageindex",
  openGraph: {
    title: "Import",
    description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
    url: "https://arells.com/import",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  },
  twitter: {
    title: "Import",
    description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  }
};

const ImportPage = () => {
  

  return (
    <>

      <div id="import-wrapper">
            <Import/>
      </div>
    </>
  );
}

export default ImportPage;