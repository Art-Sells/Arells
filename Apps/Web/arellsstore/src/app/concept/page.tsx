import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/import/import.css';


import HPMconcept from '../../components/HPM/HPMconcept';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Concept",
  description: "Always sell Bitcoin for profits. Import small amounts of bitcoin and always sell them for profits.",
  robots: "noimageindex",
  openGraph: {
    title: "Concept",
    description: "Always sell Bitcoin for profits. Import small amounts of bitcoin and always sell them for profits.",
    url: "https://arells.com/concept",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
      }
    ]
  },
  twitter: {
    title: "Concept",
    description: "Always sell Bitcoin for profits. Import small amounts of bitcoin and always sell them for profits.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
      }
    ]
  }
};

const HPMConceptPage = () => {
  

  return (
    <>

      <div id="import-wrapper-concept">
            <HPMconcept/>
      </div>
    </>
  );
}

export default HPMConceptPage;