"use client";

import '../../app/css/signinup.css';

import { ClientSafeProvider, SessionProvider } from "next-auth/react";
import SignUpModule from "./Modules/SignUpModule";
import React from 'react';
import { getProviders } from 'next-auth/react';
import type { GetServerSideProps } from 'next';

type SignUpProps = {
  providers?: Record<string, ClientSafeProvider>;
};

export default function SignUpPage({ providers }: SignUpProps) {
  return (
    <>
      <SessionProvider>
        <SignUpModule providers={providers}/> 
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

