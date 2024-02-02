"use client";

import { SessionProvider } from "next-auth/react";
import AssetViewModule from "./Modules/AssetViewModule";
import React from 'react';

const AssetView = () => {  

  return (
    <>
      <SessionProvider>
        <AssetViewModule/>
      </SessionProvider>
    </>
  );
}

export default AssetView;