import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Import other necessary components and hooks
import '../../app/css/prototype/seller-created.css';
import Selling from '../../components/Selling';
import { SignerProvider } from '../../state/signer';
import { ApolloWrapper } from '../../lib/apollo-provider';



const SellingPage = () => {
  const router = useRouter();
  const storeAddressFromURL = useMemo(() => {
    const address = Array.isArray(router.query.storeAddress)
        ? router.query.storeAddress[0]
        : router.query.storeAddress;
    return address ? address.toLowerCase() : null;
  }, [router.query.storeAddress]);
  

  return (
    <>
      <Head>
        <title>Buy Art</title>
        <meta name="description" content="Buy art that never loses value." />
        <meta property="og:title" content="Buy art that never loses value." />
        <meta property="og:description" content="Render bear markets obsolete with Arells." />
        <meta property="og:url" content={`https://arells.com/buy/${storeAddressFromURL}`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={"https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread.jpg"} 
        />
        <meta name="twitter:title" content="Buy art that never loses value." />
        <meta name="twitter:description" content="Render bear markets obsolete with Arells." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={"https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread.jpg"} 
      />
      <link rel="icon" href="/favicon.ico" />
      </Head>

      <div id="prototype-seller-created-wrapper">
        <SignerProvider>
          <ApolloWrapper>
            <Selling/>
          </ApolloWrapper>
        </SignerProvider>
      </div>
    </>
  );
}

export default SellingPage;




