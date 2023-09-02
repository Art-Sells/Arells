import '../../../css/prototype/asset/beach-houses.css';

import BeachHouses from '../../../../components/prototype/asset/BeachHouses';
import Head from 'next/head';

const BeachHousesPage = () => {

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
      <div id="beach-houses-wrapper">
       <BeachHouses/>
      </div>
    </>
  );
}

export default BeachHousesPage;

export const metadata = {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    title: "Beach Houses Prototype",
    description: "Prototype for Beach Houses",
    google: "nositelinkssearchbox",
    keywords: ["Arells"],
    author: "Arells",
    // Change below link after test  
    linkCanonical: "/prototype/asset/beach-houses",
    og: {
      site_name: "Arells",
      type: "website",
      title: "Beach Houses Prototype",
      // Change below link after test    
      url: "/prototype/asset/beach-houses",
      description: "Prototype for Beach Houses",
    },
    twitter: {
      title: "Beach Houses Prototype",
      // Change below link after test
      url: "/prototype/asset/beach-houses",
      card: "summary_large_image",
      description: "Prototype for Beach Houses"
    }
  };