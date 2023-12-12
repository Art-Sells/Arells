
//change link after testing
import '../../app/css/prototype/seller-created.css';

import React, { useMemo } from "react";

//change link after testing
import Owned from '../../components/Owned';
import { SignerProvider } from '../../state/signer';
import { ApolloWrapper } from '../../lib/apollo-provider';
import Head from 'next/head';
import { useRouter } from 'next/router';


const OwnedPage = () => {
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
        <title>Own Art</title>
        <meta name="description" content="Own art that never loses value." />
        <meta property="og:title" content="Own art that never loses value." />
        <meta property="og:description" content="Render bear markets obsolete with Arells." />
        <meta property="og:url" content={`https://arells.com/own/${storeAddressFromURL}`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={"https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread.jpg"} 
        />
        <meta name="twitter:title" content="Own art that never loses value." />
        <meta name="twitter:description" content="Render bear markets obsolete with Arells." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={"https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread.jpg"} 
      />
      <link rel="icon" href="/favicon.ico" />
      </Head>
          <div id="prototype-seller-created-wrapper">
            <SignerProvider>
              <ApolloWrapper>
                <Owned/>
              </ApolloWrapper>      
            </SignerProvider>
          </div>
    </>
  );
}

export default OwnedPage;


