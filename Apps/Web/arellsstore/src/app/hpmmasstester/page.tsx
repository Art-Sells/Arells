import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/import/import.css';


import HPMMASSTester from '../../components/Vavity/HPMMASSTester';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "HPM & MASS Tester",
  description: "Wrapped Bitcoin investments that never lose value. Import Wrapped Bitcoin and never lose value on your investment.",
  robots: "noimageindex",
  openGraph: {
    title: "HPM & MASS Tester",
    description: "Wrapped Bitcoin investments that never lose value. Import Wrapped Bitcoin and never lose value on your investment.",
    url: "https://arells.com/hpmmasstester",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  },
  twitter: {
    title: "HPM & MASS Tester",
    description: "Wrapped Bitcoin investments that never lose value. Import Wrapped Bitcoin and never lose value on your investment.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  }
};

const HPMMASSTesterPage = () => {
  

  return (
    <>

      <div id="import-wrapper">
            <HPMMASSTester/>
      </div>
    </>
  );
}

export default HPMMASSTesterPage;