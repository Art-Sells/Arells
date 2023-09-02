import '../../../css/prototype/asset/paint-rain.css';

import PaintRain from '../../../../components/prototype/asset/PaintRain';
import Head from 'next/head';

const PaintRainPage = () => {

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
      <div id="paint-rain-wrapper">
       <PaintRain/>
      </div>
    </>
  );
}

export default PaintRainPage;

export const metadata = {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    title: "Paint Rain Prototype",
    description: "Prototype for Paint Rain",
    google: "nositelinkssearchbox",
    keywords: ["Arells"],
    author: "Arells",
    // Change below link after test  
    linkCanonical: "/prototype/asset/paint-rain",
    og: {
      site_name: "Arells",
      type: "website",
      title: "Paint Rain Prototype",
      // Change below link after test    
      url: "/prototype/asset/paint-rain",
      description: "Prototype for Paint Rain",
    },
    twitter: {
      title: "Paint Rain Prototype",
      // Change below link after test
      url: "/prototype/asset/paint-rain",
      card: "summary_large_image",
      description: "Prototype for Paint Rain"
    }
  };