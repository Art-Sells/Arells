
//change link after testing
import '../../../app/css/prototype/asset/asset.css';

import React, { useMemo } from "react";

//change link after testing
import AssetView from '../../../components/Asset/AssetView';
import { SignerProvider } from '../../../state/signer';
import { ApolloWrapper } from '../../../lib/apollo-provider';
import Head from 'next/head';



const AssetPage = () => {

  return (
    <>
      <Head>
        <title>Buy</title>
        <meta name="description" content="Buy art that never loses value." />
        <meta property="og:title" content="Buy Art" />
        <meta property="og:description" content="Render bear markets obsolete with Arells." />
        <meta property="og:url" content={"https://arells.com"} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={"https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread.jpg"} 
        />
        <meta name="twitter:title" content="Buy Art" />
        <meta name="twitter:description" content="Render bear markets obsolete with Arells." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={"https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Spread.jpg"} 
      />
      <link rel="icon" href="/favicon.ico" />
      </Head>
      <div id="asset-view-wrapper">
        <SignerProvider>
          <ApolloWrapper>
            <AssetView/>
          </ApolloWrapper>      
        </SignerProvider>
      </div>
    </>
  );
}

export default AssetPage;


