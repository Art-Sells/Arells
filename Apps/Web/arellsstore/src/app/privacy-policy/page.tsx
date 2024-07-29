import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../../app/css/loginsignup/loginsignup.css';


import PrivacyPolicy from '../../components/privacy/PrivacyPolicy';

import type { Metadata } from 'next';
export const metadata: Metadata = {
    title: "Policy",
    description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
    robots: "noimageindex",
    openGraph: {
      title: "Policy",
      description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
      url: "https://arells.com/privacy-policy",
      type: "website",
      images: [
        {
          url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
        }
      ]
    },
    twitter: {
      title: "Policy",
      description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
      card: "summary_large_image",
      images: [
        {
          url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
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