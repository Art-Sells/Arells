"use client";

import '../../app/css/signinup.css';

import { ClientSafeProvider, SessionProvider } from "next-auth/react";
import SignInModule from "./Modules/SignInModule";
import React from 'react';
import { getProviders } from 'next-auth/react';
import type { GetServerSideProps } from 'next';

type SignInProps = {
  providers?: Record<string, ClientSafeProvider>;
};
export default function SignIn({ providers }: SignInProps) {
  return (
    <>
      <SessionProvider>
        <SignInModule providers={providers}/> 
      </SessionProvider> 
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
    const providers = await getProviders();
    return {
      props: { providers }, // This is correctly provided
    };
};