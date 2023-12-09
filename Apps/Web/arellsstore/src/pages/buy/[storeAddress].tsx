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
    }
  };

  useEffect(() => {
    if (storeAddressFromURL) {
      // Updating the document title
      document.title = "Buy Art";
  
      // Updating meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", "Buy art that never loses value");
      }
  
      // Updating Open Graph metadata
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogDescription = document.querySelector('meta[property="og:description"]');
      const ogUrl = document.querySelector('meta[property="og:url"]');
      const ogImage = document.querySelector('meta[property="og:image"]');
  
      if (ogTitle) {
        ogTitle.setAttribute("content", "Buy Art");
      }
      if (ogDescription) {
        ogDescription.setAttribute("content", "Buy art that never loses value.");
      }
      if (ogUrl) {
        ogUrl.setAttribute("content", `https://arells.com/buy/${storeAddressFromURL}`);
      }
      if (ogImage) {
        ogImage.setAttribute("content", "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Banner.jpg");
      }
  
      // Updating Twitter metadata
      const twitterTitle = document.querySelector('meta[name="twitter:title"]');
      const twitterDescription = document.querySelector('meta[name="twitter:description"]');
      const twitterImage = document.querySelector('meta[name="twitter:image"]');
  
      if (twitterTitle) {
        twitterTitle.setAttribute("content", "Buy Art");
      }
      if (twitterDescription) {
        twitterDescription.setAttribute("content", "Buy art that never loses value.");
      }
      if (twitterImage) {
        twitterImage.setAttribute("content", "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Banner.jpg");
      }
    }
  }, [storeAddressFromURL]);
  

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
        <meta property="og:image" content={
          latestImageUpdate.imageUrl 
          || "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Banner.jpg"} />
        <meta name="twitter:title" content="Buy Art" />
        <meta name="twitter:description" content="Buy art that never loses value." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={
          latestImageUpdate.imageUrl 
          || "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/Default-Banner.jpg"} />
        {/* Add more meta tags as needed */}
      </Head>

      <div id="prototype-seller-created-wrapper">
        <SignerProvider>
          <ApolloWrapper>
            <Selling />
          </ApolloWrapper>
        </SignerProvider>
      </div>
    </>
  );
}

export default SellingPage;




