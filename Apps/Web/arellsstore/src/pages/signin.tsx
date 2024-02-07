"use client";

import '../app/css/signinup.css';

import { SessionProvider } from "next-auth/react";
import SignInModule from "../components/SignIn/Modules/SignInModule";
import React from 'react';
import { getProviders } from 'next-auth/react';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';

type Provider = ReturnType<typeof getProviders> extends Promise<infer R> ? R : never;

type SignInProps = {
  providers: Provider;
};

export default function SignIn({ providers }: SignInProps) {
  return (
    <>
    <Head>
        <title>Sign In</title>
        <meta name="description" content="Sign In to buy that never loses value." />
        <meta property="og:title" content="Sign In" />
        <meta property="og:description" content="Render bear markets obsolete with Arells." />
        <meta property="og:url" content={"https://arells.com"} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={"https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread.jpg"} 
        />
        <meta name="twitter:title" content="Sign In" />
        <meta name="twitter:description" content="Sign In to buy that never loses value." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={"https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread.jpg"} 
      />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <div id="signinup-wrapper">
      <SessionProvider>
        {providers ? <SignInModule providers={providers}/> 
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