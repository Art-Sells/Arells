"use client";

import { SessionProvider } from "next-auth/react";
import SellingModule from "./SellingModule";
import React from 'react';

const Selling = () => {  

  return (
    <>
      <SessionProvider>
        <SellingModule/>
      </SessionProvider>
    </>
  );
}

export default Selling;