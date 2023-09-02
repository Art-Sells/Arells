import '../../../css/prototype/asset/layers.css';

import Layers from '../../../../components/prototype/asset/Layers';
import Head from 'next/head';
const LayersPage = () => {

  return (
    <>
      <Head>
        <meta property="og:image" content="<generated>" />
        <meta property="og:image:type" content="<generated>" />
        <meta property="og:image:width" content="<generated>" />
        <meta property="og:image:height" content="<generated>" />
        <meta name="twitter:image" content="<generated>" />
        <meta name="twitter:image:type" content="<generated>" />
        <meta name="twitter:image:width" content="<generated>" />
        <meta name="twitter:image:height" content="<generated>" />
      </Head>    
      <div id="layers-wrapper">
       <Layers/>
      </div>
    </>
  );
}

export default LayersPage;

export const metadata = {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    title: "Layers Prototype",
    description: "Prototype for Layers",
    google: "nositelinkssearchbox",
    keywords: ["Arells"],
    author: "Arells",
    // Change below link after test  
    linkCanonical: "/prototype/asset/layers",
    og: {
      site_name: "Arells",
      type: "website",
      title: "Layers Prototype",
      // Change below link after test    
      url: "/prototype/asset/layers",
      description: "Prototype for Layers",
    },
    twitter: {
      title: "Layers Prototype",
      // Change below link after test
      url: "/prototype/asset/layers",
      card: "summary_large_image",
      description: "Prototype for Layers"
    }
  };