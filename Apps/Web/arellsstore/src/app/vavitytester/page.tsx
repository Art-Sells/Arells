import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/connect/connect.css';


import VavityTester from '../../components/Vavity/VavityTester';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Vavity Tester",
  description: "Are you ready to let go of bear markets? Connect your investments.",
  robots: "noimageindex",
  openGraph: {
    title: "Vavity Tester",
    description: "Are you ready to let go of bear markets? Connect your investments.",
    url: "https://arells.com/vavitytester",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  },
  twitter: {
    title: "Vavity Tester",
    description: "Are you ready to let go of bear markets? Connect your investments.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
      }
    ]
  }
};

const VavityTesterPage = () => {
  

  return (
    <>

      <div id="connect-wrapper">
            <VavityTester/>
      </div>
    </>
  );
}

export default VavityTesterPage;