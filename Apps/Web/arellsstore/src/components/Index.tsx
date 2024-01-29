"use client";

import { SessionProvider } from "next-auth/react";
import IndexModule from "./IndexModule";
import React from 'react';

const Index = () => {  

  return (
    <>
      <SessionProvider>
        <IndexModule/>
      </SessionProvider>
    </>
  );
}

export default Index;