"use client";

import { SessionProvider } from "next-auth/react";
import CreateArtModule from "./CreateArtModule";
import React from 'react';

const CreateArt = () => {  

  return (
    <>
      <SessionProvider>
        <CreateArtModule/>
      </SessionProvider>
    </>
  );
}

export default CreateArt;