import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/import/import.css';


import HPMTester from '../../components/HPM/HPMTester';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "HPM Tester",
  description: "Always sell Bitcoin for profits. Import small amounts of bitcoin and always sell them for profits.",
  robots: "noimageindex",
  openGraph: {
    title: "HPM Tester",
    description: "Always sell Bitcoin for profits. Import small amounts of bitcoin and always sell them for profits.",
    url: "https://arells.com/hpmtester",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
      }
    ]
  },
  twitter: {
    title: "HPM Tester",
    description: "Always sell Bitcoin for profits. Import small amounts of bitcoin and always sell them for profits.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
      }
    ]
  }
};

const HPMTesterPage = () => {
  

  return (
    <>

      <div id="import-wrapper">
            <HPMTester/>
      </div>
    </>
  );
}

export default HPMTesterPage;