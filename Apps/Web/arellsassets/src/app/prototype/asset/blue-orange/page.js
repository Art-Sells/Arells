import '../../../css/prototype/asset/blue-orange.css';
import React from 'react';

import BlueOrange from '../../../../components/prototype/asset/BlueOrange';
import Head from 'next/head';

export function generateMetadata({}) {
  let title = "Blue Orange Prototype";
  let description = "Prototype for Blue Orange";

  let openGraph = {
    site_name: "Arells",
    title: title,
    description: description,
    // Change this link after testing
    url: "https://arells.com/prototype/asset/blue-orange", 
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner-prototype.jpg"
      }
    ]
  };

  let twitter = {
    title: title,
    // Change this link after testing
    url: "https://arells.com/prototype/asset/blue-orange",
    card: "summary_large_image",
    description: description,
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner-prototype.jpg"
      }
    ]
  };

  return {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    //change below link after test
    linkCanonical: "https://arells.com/prototype/asset/blue-orange",
    title,
    description,
    openGraph,
    twitter
  };
}

const BlueOrangePage = () => {
  const metadata = generateMetadata({});

  return (
    <>
      <Head>
        <meta name="robots" content={metadata.robots} />
        <meta httpEquiv="X-UA-Compatible" content={metadata.httpEquiv} />
        <meta charSet={metadata.charSet} />
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="canonical" href={metadata.linkCanonical} />
        
        {/* Open Graph Metadata */}
        <meta property="og:site_name" content={metadata.openGraph.site_name} />
        <meta property="og:title" content={metadata.openGraph.title} />
        <meta property="og:description" content={metadata.openGraph.description} />
        <meta property="og:url" content={metadata.openGraph.url} />
        <meta property="og:type" content={metadata.openGraph.type} />
        {metadata.openGraph.images.map((image, index) => (
            <meta key={index} property="og:image" content={image.url} />
        ))}
        
        {/* Twitter Card Metadata */}
        <meta name="twitter:title" content={metadata.twitter.title} />
        <meta name="twitter:description" content={metadata.twitter.description} />
        <meta name="twitter:url" content={metadata.twitter.url} />
        <meta name="twitter:card" content={metadata.twitter.card} />
        {metadata.twitter.images.map((image, index) => (
            <meta key={index} name="twitter:image" content={image.url} />
        ))}
      </Head>  
      <div id="blue-orange-wrapper">
       <BlueOrange/>
      </div>
    </>
  );
}

export default BlueOrangePage;