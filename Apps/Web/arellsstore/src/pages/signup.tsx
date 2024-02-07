"use client";

import '../app/css/signinup.css';

import { SessionProvider } from "next-auth/react";
import SignUpModule from "../components/SignIn/Modules/SignUpModule";
import React from 'react';
import { getProviders } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';

type Provider = ReturnType<typeof getProviders> extends Promise<infer R> ? R : never;

type SignUpProps = {
  providers: Provider;
};

export default function SignUp({ providers }: SignUpProps) {
  return (
    <>
    <Head>
        <title>Sign Up</title>
        <meta name="description" content="Sign Up to buy that never loses value." />
        <meta property="og:title" content="Sign Up" />
        <meta property="og:description" content="Render bear markets obsolete with Arells." />
        <meta property="og:url" content={"https://arells.com"} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={"https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread.jpg"} 
        />
        <meta name="twitter:title" content="Sign Up" />
        <meta name="twitter:description" content="Render bear markets obsolete with Arells." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={"https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread.jpg"} 
      />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <div id="signinup-wrapper">
      <SessionProvider>
        {providers ? <SignUpModule providers={providers}/> 
        : 
        <div></div>}
      </SessionProvider>
    </div>  
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
    const providers = await getProviders();
    return {
      props: { providers }, // This is correctly provided
    };
};