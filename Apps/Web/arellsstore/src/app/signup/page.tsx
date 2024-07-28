import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../../app/css/loginsignup/loginsignup.css';


import Signup from '../../components/LoginSignup/Signup';

import type { Metadata } from 'next';
export const metadata: Metadata = {
    title: "Sign Up",
    description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
    robots: "noimageindex",
    openGraph: {
      title: "Sign Up",
      description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
      url: "https://arells.com/signup",
      type: "website",
      images: [
        {
          url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
        }
      ]
    },
    twitter: {
      title: "Sign Up",
      description: "Always sell Bitcoin for profits. Buy small amounts of bitcoin and always sell them for profits.",
      card: "summary_large_image",
      images: [
        {
          url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBanner.jpg"
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