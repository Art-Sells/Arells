import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/loginsignup/loginsignup.css';


import Login from '../../components/LoginSignup/Login';

import type { Metadata } from 'next';
export const metadata: Metadata = {
    title: "Login",
    description: "Login to ensure your Bitcoin investments never experience bear market losses.",
    robots: "noimageindex",
    openGraph: {
      title: "Login",
    description: "Login to ensure your Bitcoin investments never experience bear market losses.",
      url: "https://arells.com/login",
      type: "website",
      images: [
        {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerFour.jpg"
        }
      ]
    },
    twitter: {
      title: "Login",
    description: "Login to ensure your Bitcoin investments never experience bear market losses.",
      card: "summary_large_image",
      images: [
        {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerFour.jpg"
        }
      ]
    }
  };

const LogInPage = () => {
  

  return (
    <>

      <div id="login-wrapper">
            <Login/>
      </div>
    </>
  );
}

export default LogInPage;
