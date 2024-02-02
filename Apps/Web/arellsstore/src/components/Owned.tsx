"use client";

import { SessionProvider } from "next-auth/react";
import OwnedModule from "./OwnedModule";
import React from 'react';

const Owned = () => {  

  return (
    <>
      <SessionProvider>
        <OwnedModule/>
      </SessionProvider>
    </>
  );
}

export default Owned;