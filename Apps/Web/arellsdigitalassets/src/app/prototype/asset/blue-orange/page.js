import '../../../css/prototype/asset/blue-orange.css';

import BlueOrange from '../../../../components/prototype/asset/BlueOrange';
import Head from 'next/head';

const BlueOrangePage = () => {

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
      <div id="blue-orange-wrapper">
       <BlueOrange/>
      </div>
    </>
  );
}

export default BlueOrangePage;

export const metadata = {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    title: "Blue Orange Prototype",
    description: "Prototype for Blue Orange",
    google: "nositelinkssearchbox",
    keywords: ["Arells"],
    author: "Arells",
    // Change below link after test  
    linkCanonical: "/prototype/asset/blue-orange",
    og: {
      site_name: "Arells",
      type: "website",
      title: "Blue Orange Prototype",
      // Change below link after test    
      url: "/prototype/asset/blue-orange",
      description: "Prototype for Blue Orange",
    },
    twitter: {
      title: "Blue Orange Prototype",
      // Change below link after test
      url: "/prototype/asset/blue-orange",
      card: "summary_large_image",
      description: "Prototype for Blue Orange"
    }
  };