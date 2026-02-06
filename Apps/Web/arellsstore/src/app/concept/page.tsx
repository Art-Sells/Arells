import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/import/import.css';



import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Concept",
  description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
  robots: "noimageindex",
  openGraph: {
    title: "Concept",
    description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
    url: "https://arells.com/concept",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  },
  twitter: {
    title: "Concept",
    description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  }
};

const HPMConceptPage = () => {
  

  return (
    <>

      <div id="import-wrapper-concept">
        <div style={{ padding: '24px', color: '#fff' }}>Concept page is unavailable.</div>
      </div>
    </>
  );
}

export default HPMConceptPage;