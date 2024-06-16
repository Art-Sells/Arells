import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../../app/css/loginsignup/loginsignup.css';


import Signup from '../../components/LoginSignup/Signup';

import type { Metadata } from 'next';
export const metadata: Metadata = {
    title: "Sign Up",
    description: "Never lose money selling cryptocurrencies.",
    robots: "noimageindex",
    openGraph: {
      title: "Sign Up",
      description: "Never lose money selling cryptocurrencies.",
      url: "https://arells.com/signup",
      type: "website",
      images: [
        {
          url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
        }
      ]
    },
    twitter: {
      title: "Sign Up",
      description: "Never lose money selling cryptocurrencies.",
      card: "summary_large_image",
      images: [
        {
          url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"
        }
      ]
    }
  };

const SignUpPage = () => {
  

  return (
    <>

      <div id="signup-wrapper">
            <Signup/>
      </div>
    </>
  );
}

export default SignUpPage;