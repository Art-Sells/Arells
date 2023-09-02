import '../../../css/prototype/asset/colour-glass.css';

import ColourGlass from '../../../../components/prototype/asset/ColourGlass';
import Head from 'next/head';

const ColourGlassPage = () => {

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
      <div id="colour-glass-wrapper">
       <ColourGlass/>
      </div>
    </>
  );
}

export default ColourGlassPage;

export const metadata = {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    title: "Colour Glass Prototype",
    description: "Prototype for Colour Glass",
    google: "nositelinkssearchbox",
    keywords: ["Arells"],
    author: "Arells",
    // Change below link after test  
    linkCanonical: "/prototype/asset/colour-glass",
    og: {
      site_name: "Arells",
      type: "website",
      title: "Colour Glass Prototype",
      // Change below link after test    
      url: "/prototype/asset/colour-glass",
      description: "Prototype for Colour Glass",
    },
    twitter: {
      title: "Colour Glass Prototype",
      // Change below link after test
      url: "/prototype/asset/colour-glass",
      card: "summary_large_image",
      description: "Prototype for Colour Glass"
    }
  };