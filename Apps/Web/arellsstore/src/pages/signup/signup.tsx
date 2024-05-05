import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Import other necessary components and hooks
import '../../app/css/prototype/seller-created.css';


import Signup from '../../components/Signup';



const SignUpPage = () => {
  

  return (
    <>
      <Head>
        <title>Sign Up</title>
        <meta name="description" content="Never lose money selling cryptocurrencies." />
        <meta property="og:title" content="Never lose money selling cryptocurrencies." />
        <meta property="og:description" content="Render bear markets obsolete with Arells." />
        <meta property="og:url" content={`https://arells.com/signup`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={"https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"} 
        />
        <meta name="twitter:title" content="Never lose money selling cryptocurrencies." />
        <meta name="twitter:description" content="Render bear markets obsolete with Arells." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={"https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread-Pivot.jpg"} 
      />
      <link rel="icon" href="/favicon.ico" />
      </Head>

      <div id="prototype-seller-created-wrapper">
            <Signup/>
      </div>
    </>
  );
}

export default SignUpPage;