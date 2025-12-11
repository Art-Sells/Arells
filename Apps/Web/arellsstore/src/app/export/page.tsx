import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/export/export.css';


import Export from '../../components/Export/Export';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Export",
  description: "Bitcoin investments that never lose value. Psychologically prevents investments from bear market losses.",
  robots: "noimageindex",
  openGraph: {
    title: "Export",
    description: "Bitcoin investments that never lose value. Psychologically prevents investments from bear market losses.",
    url: "https://arells.com/export",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  },
  twitter: {
    title: "Export",
    description: "Bitcoin investments that never lose value. Psychologically prevents investments from bear market losses.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
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