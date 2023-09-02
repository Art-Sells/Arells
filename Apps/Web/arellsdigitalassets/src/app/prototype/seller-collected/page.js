import '../../css/prototype/seller-collected.css';

import PrototypeSellerCollected from '../../../components/prototype/SellerCollected';
import Head from 'next/head';

const SellerCollectedPage = () => {

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
      <div id="prototype-seller-collected-wrapper">
       <PrototypeSellerCollected/>
      </div>
    </>
  );
}

export default SellerCollectedPage;

export const metadata = {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    title: "Seller Collections Prototype",
    description: "Prototype for Seller Collections",
    google: "nositelinkssearchbox",
    keywords: ["Arells"],
    author: "Arells",
    // Change below link after test  
    linkCanonical: "/prototype/seller-collected",
    og: {
      site_name: "Arells",
      type: "website",
      title: "Seller Collections Prototype",
      // Change below link after test    
      url: "/prototype/seller-collected",
      description: "Prototype for Seller Collections",
    },
    twitter: {
      title: "Seller Collections Prototype",
      // Change below link after test
      url: "/prototype/seller-collected",
      card: "summary_large_image",
      description: "Prototype for Seller Collections"
    }
  };