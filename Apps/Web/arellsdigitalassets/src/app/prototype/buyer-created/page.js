import '../../css/prototype/buyer-created.css';

import PrototypeBuyerCreated from '../../../components/prototype/BuyerCreated';
import Head from 'next/head';

const BuyerCreatedPage = () => {

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
      <div id="prototype-buyer-created-wrapper">
       <PrototypeBuyerCreated/>
      </div>
    </>
  );
}

export default BuyerCreatedPage;

export const metadata = {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    title: "Buyer Creations Prototype",
    description: "Prototype for Buyer Creations",
    google: "nositelinkssearchbox",
    keywords: ["Arells"],
    author: "Arells",
    // Change below link after test  
    linkCanonical: "/prototype/buyer-creations",
    og: {
      site_name: "Arells",
      type: "website",
      title: "Buyer Creations Prototype",
      // Change below link after test    
      url: "/prototype/buyer-creations",
      description: "Prototype for Buyer Creations",
    },
    twitter: {
      title: "Buyer Creations Prototype",
      // Change below link after test
      url: "/prototype/buyer-creations",
      card: "summary_large_image",
      description: "Prototype for Buyer Creations"
    }
  };