import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/loginsignup/loginsignup.css';


import Confirm from '../../components/LoginSignup/Confirm';

import type { Metadata } from 'next';
export const metadata: Metadata = {
    title: "Confirm Account",
    description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
    robots: "noimageindex",
    openGraph: {
      title: "Confirm Account",
      description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
      url: "https://arells.com/confirm",
      type: "website",
      images: [
        {
          url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
        }
      ]
    },
    twitter: {
      title: "Confirm Account",
      description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
      card: "summary_large_image",
      images: [
        {
          url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
        }
      ]
    }
  };

const ConfirmPage = () => {
  

  return (
    <>

      <div id="login-wrapper">
            <Confirm/>
      </div>
    </>
  );
}

export default ConfirmPage;