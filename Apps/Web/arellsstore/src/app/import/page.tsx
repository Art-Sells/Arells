import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/import/import.css';


import Import from '../../components/Import/Import';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Import",
  description: "Bitcoin investments that never lose value. Psychologically prevents investments from bear market losses.",
  robots: "noimageindex",
  openGraph: {
    title: "Import",
    description: "Bitcoin investments that never lose value. Psychologically prevents investments from bear market losses.",
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
    description: "Bitcoin investments that never lose value. Psychologically prevents investments from bear market losses.",
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