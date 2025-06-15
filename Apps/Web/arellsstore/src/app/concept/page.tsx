import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/import/import.css';


import HPMconcept from '../../components/HPM/HPMconcept';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Concept",
  description: "Investments immune to bear markets.",
  robots: "noimageindex",
  openGraph: {
    title: "Concept",
    description: "Investments immune to bear markets.",
    url: "https://arells.com/concept",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerFour.jpg"
      }
    ]
  },
  twitter: {
    title: "Concept",
    description: "Investments immune to bear markets.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerFour.jpg"
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
