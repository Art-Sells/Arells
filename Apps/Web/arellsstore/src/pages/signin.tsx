import '../app/css/signinup.css';

import SignInPage from '../components/SignIn/SignInPage';

import { SignerProvider } from '../state/signer';
import { ApolloWrapper } from '../lib/apollo-provider';
import React from 'react';
import Head from 'next/head';


const SignIn = () => {
  return (
    <>
    <Head>
        <title>Sign In</title>
        <meta name="description" content="Sign In to buy art that never loses value." />
        <meta property="og:title" content="Sign In" />
        <meta property="og:description" content="Render bear markets obsolete with Arells." />
        <meta property="og:url" content={"https://arells.com"} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={"https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread.jpg"} 
        />
        <meta name="twitter:title" content="Sign In" />
        <meta name="twitter:description" content="Sign In to buy art that never loses value." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={"https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread.jpg"} 
      />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <div id="signinup-wrapper">
      <SignerProvider>
        <ApolloWrapper>
            <SignInPage providers={null}/>
        </ApolloWrapper>      
      </SignerProvider>
    </div>  
    </>
  );
}

export default SignIn;