import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../css/loginsignup/loginsignup.css';


import Login from '../../components/LoginSignup/Login';

import type { Metadata } from 'next';
export const metadata: Metadata = {
    title: "Log In",
    description: "Never lose money selling cryptocurrencies.",
    robots: "noimageindex",
    openGraph: {
      title: "Log In",
      description: "Never lose money selling cryptocurrencies.",
      url: "https://arells.com/login",
      type: "website",
      images: [
        {
          url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
        }
      ]
    },
    twitter: {
      title: "Log In",
      description: "Never lose money selling cryptocurrencies.",
      card: "summary_large_image",
      images: [
        {
          url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
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