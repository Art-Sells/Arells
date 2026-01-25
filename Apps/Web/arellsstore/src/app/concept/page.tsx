import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/import/import.css';


import HPMconcept from '../../components/Vavity/HPMconcept';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Concept",
  description: "Ethereum investments that never lose value. Import ethereum and never lose money selling.",
  robots: "noimageindex",
  openGraph: {
    title: "Concept",
    description: "Ethereum investments that never lose value. Import ethereum and never lose money selling.",
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
    description: "Ethereum investments that never lose value. Import ethereum and never lose money selling.",
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
            <HPMconcept/>
      </div>
    </>
  );
}

export default HPMConceptPage;