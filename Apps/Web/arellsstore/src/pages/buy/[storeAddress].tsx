import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Import other necessary components and hooks
import '../../app/css/prototype/seller-created.css';
import Selling from '../../components/Selling';
import { SignerProvider } from '../../state/signer';
import { ApolloWrapper } from '../../lib/apollo-provider';

interface ImageUpdateInfo {
  imageUrl: string;
  timestamp: number;
}

const SellingPage = () => {
  const router = useRouter();
  const { storeAddress, v } = router.query;
  const storeAddressFromURL = useMemo(() => {
    const address = Array.isArray(router.query.storeAddress)
        ? router.query.storeAddress[0]
        : router.query.storeAddress;
    return address ? address.toLowerCase() : null;
  }, [router.query.storeAddress]);


  const [latestImageUpdate, setLatestImageUpdate] = useState<ImageUpdateInfo>({ imageUrl: "", timestamp: 0 });

  const handleImageUpdate = (updateInfo: ImageUpdateInfo) => {
    if (updateInfo.timestamp > latestImageUpdate.timestamp) {
      setLatestImageUpdate(updateInfo);
      const newVersion = new Date().getTime();
      router.replace(`/buy/${storeAddress}?v=${newVersion}`, undefined, { shallow: true });
    }
  };

  useEffect(() => {
    const fetchedImageUrl = latestImageUpdate.imageUrl ;
    setLatestImageUpdate((prev) => ({ ...prev, imageUrl: fetchedImageUrl }));
  }, [v, storeAddress]);
  
  console.log("Fetched Image: ", latestImageUpdate.imageUrl);
  return (
    <>
      {/* Using Next.js Head for metadata (Solution #5) */}
      <Head>
        <title>Buy Art</title>
        <meta name="description" content="Buy art that never loses value." />
        <meta property="og:title" content="Buy Art" />
        <meta property="og:description" content="Buy art that never loses value." />
        <meta property="og:url" content={`https://arells.com/buy/${storeAddressFromURL}`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={latestImageUpdate.imageUrl} 
        />
        <meta name="twitter:title" content="Buy Art" />
        <meta name="twitter:description" content="Buy art that never loses value." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={latestImageUpdate.imageUrl} 
      />
        {/* Add more meta tags as needed */}
      </Head>

      <div id="prototype-seller-created-wrapper">
        <SignerProvider>
          <ApolloWrapper>
            <Selling onImageUpdate={handleImageUpdate}/>
          </ApolloWrapper>
        </SignerProvider>
      </div>
    </>
  );
}

export default SellingPage;




