"use client";

import { SessionProvider } from "next-auth/react";
import AssetModule from "./Modules/AssetModule";
import React from 'react';

const Asset = () => {  

  return (
    <>
      <SessionProvider>
        <AssetModule/>
      </SessionProvider>
    </>
  );
}

export default Asset;