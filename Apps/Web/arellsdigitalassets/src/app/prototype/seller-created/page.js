import '../../css/prototype/seller-created.css';

import PrototypeSellerCreated from '../../../components/prototype/SellerCreated';
import Head from 'next/head';

const SellerCreatedPage = () => {

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
      <div id="prototype-seller-created-wrapper">
       <PrototypeSellerCreated/>
      </div>
    </>
  );
}

export default SellerCreatedPage;

export const metadata = {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    title: "Seller Creations Prototype",
    description: "Prototype for Seller Creations",
    google: "nositelinkssearchbox",
    keywords: ["Arells"],
    author: "Arells",
    // Change below link after test  
    linkCanonical: "/prototype/seller-created",
    og: {
      site_name: "Arells",
      type: "website",
      title: "Seller Creations Prototype",
      // Change below link after test    
      url: "/prototype/seller-created",
      description: "Prototype for Seller Creations",
    },
    twitter: {
      title: "Seller Creations Prototype",
      // Change below link after test
      url: "/prototype/seller-created",
      card: "summary_large_image",
      description: "Prototype for Seller Creations"
    }
  };