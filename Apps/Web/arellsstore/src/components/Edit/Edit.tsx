"use client";

import { SessionProvider } from "next-auth/react";
import EditModule from "./Modules/EditModule";
import React from 'react';

const Edit = () => {  

  return (
    <>
      <SessionProvider>
        <EditModule/>
      </SessionProvider>
    </>
  );
}

export default Edit;