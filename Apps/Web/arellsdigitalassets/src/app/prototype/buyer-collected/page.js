import '../../css/prototype/buyer-collected.css';

import PrototypeBuyerCollected from '../../../components/prototype/BuyerCollected';
import Head from 'next/head';

const BuyerCollectedPage = () => {

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
      <div id="prototype-buyer-collected-wrapper">
       <PrototypeBuyerCollected/>
      </div>
    </>
  );
}

export default BuyerCollectedPage;

export const metadata = {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    title: "Buyer Collections Prototype",
    description: "Prototype for Buyer Collections",
    google: "nositelinkssearchbox",
    keywords: ["Arells"],
    author: "Arells",
    // Change below link after test  
    linkCanonical: "/prototype/buyer-collected",
    og: {
      site_name: "Arells",
      type: "website",
      title: "Buyer Collections Prototype",
      // Change below link after test    
      url: "/prototype/buyer-collected",
      description: "Prototype for Buyer Collections",
    },
    twitter: {
      title: "Buyer Collections Prototype",
      // Change below link after test
      url: "/prototype/buyer-collected",
      card: "summary_large_image",
      description: "Prototype for Buyer Collections"
    }
  };