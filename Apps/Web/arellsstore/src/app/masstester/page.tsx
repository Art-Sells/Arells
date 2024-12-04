import React, { useEffect, useMemo, useState } from 'react';

// Import other necessary components and hooks
import '../css/import/import.css';

import MASSTester from '../../components/MASS/MASSTester';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "MASS Tester",
  description: "Bitcoin investments that never lose value. Import bitcoin and never lose value on your investment.",
  robots: "noimageindex",
  openGraph: {
    title: "MASS Tester",
  description: "Bitcoin investments that never lose value. Import bitcoin and never lose value on your investment.",
    url: "https://arells.com/masstester",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  },
  twitter: {
    title: "MASS Tester",
    description: "Bitcoin investments that never lose value. Import bitcoin and never lose value on your investment.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  }
};

const MASSTesterPage = () => {
  

  return (
    <>

      <div id="import-wrapper">
            <MASSTester/>
      </div>
    </>
  );
}

export default MASSTesterPage;