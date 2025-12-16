import React, { useEffect, useMemo, useState } from 'react';


// Import other necessary components and hooks
import '../../app/css/loginsignup/loginsignup.css';


import Signup from '../../components/LoginSignup/Signup';

import type { Metadata } from 'next';
export const metadata: Metadata = {
    title: "Sign Up",
    description: "Sign Up to ensure your Ethereum investments never lose value.",
    robots: "noimageindex",
    openGraph: {
      title: "Sign Up",
      description: "Sign Up to ensure your Ethereum investments never lose value.",
      url: "https://arells.com/signup",
      type: "website",
      images: [
        {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
        }
      ]
    },
    twitter: {
      title: "Sign Up",
      description: "Sign Up to ensure your Ethereum investments never lose value.",
      card: "summary_large_image",
      images: [
        {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/ArellsBitcoinBannerThree.jpg"
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