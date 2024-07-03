import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/import/import.css';


import Import from '../../components/Import/Import';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Import",
  description: "Never lose money selling cryptocurrencies.",
  robots: "noimageindex",
  openGraph: {
    title: "Import",
    description: "Never lose money selling cryptocurrencies.",
    url: "https://arells.com/import",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
      }
    ]
  },
  twitter: {
    title: "Import",
    description: "Never lose money selling cryptocurrencies.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
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