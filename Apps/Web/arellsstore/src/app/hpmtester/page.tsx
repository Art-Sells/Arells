import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/import/import.css';


import HPMTester from '../../components/HPM/HPMTester';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "HPM Tester",
  description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
  robots: "noimageindex",
  openGraph: {
    title: "HPM Tester",
    description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
    url: "https://arells.com/hpmtester",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  },
  twitter: {
    title: "HPM Tester",
    description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
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