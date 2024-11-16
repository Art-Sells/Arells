import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/loginsignup/loginsignup.css';


import Login from '../../components/LoginSignup/Login';

import type { Metadata } from 'next';
export const metadata: Metadata = {
    title: "Login",
    description: "Bitcoin investments never lose value. Import small amounts of bitcoin and never lose money selling them.",
    robots: "noimageindex",
    openGraph: {
      title: "Login",
      description: "Bitcoin investments never lose value. Import small amounts of bitcoin and never lose money selling them.",
      url: "https://arells.com/login",
      type: "website",
      images: [
        {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerTwo.jpg"
        }
      ]
    },
    twitter: {
      title: "Login",
      description: "Bitcoin investments never lose value. Import small amounts of bitcoin and never lose money selling them.",
      card: "summary_large_image",
      images: [
        {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerTwo.jpg"
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