import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../../app/css/loginsignup/loginsignup.css';


import PrivacyPolicy from '../../components/privacy/PrivacyPolicy';

import type { Metadata } from 'next';
export const metadata: Metadata = {
    title: "Policy",
    description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
    robots: "noimageindex",
    openGraph: {
      title: "Policy",
      description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
      url: "https://arells.com/privacy-policy",
      type: "website",
      images: [
        {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
        }
      ]
    },
    twitter: {
      title: "Policy",
      description: "Bitcoin investments that never lose value. Import bitcoin and never lose money selling.",
      card: "summary_large_image",
      images: [
        {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
        }
      ]
    }
  };

const PrivacyPolicyPage = () => {
  

  return (
    <>

      <div id="signup-wrapper">
            <PrivacyPolicy/>
      </div>
    </>
  );
}

export default PrivacyPolicyPage;