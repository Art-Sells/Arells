import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/export/export.css';


import Export from '../../components/Export/Export';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Export",
  description: "Bitcoin investments never lose value. Import bitcoin and never lose money selling.",
  robots: "noimageindex",
  openGraph: {
    title: "Export",
    description: "Bitcoin investments never lose value. Import bitcoin and never lose money selling.",
    url: "https://arells.com/export",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
      }
    ]
  },
  twitter: {
    title: "Export",
    description: "Bitcoin investments never lose value. Import bitcoin and never lose money selling.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
      }
    ]
  }
};

const ExportPage = () => {
  

  return (
    <>

      <div id="export-wrapper">
            <Export/>
      </div>
    </>
  );
}

export default ExportPage;