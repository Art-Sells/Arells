import '../../../css/prototype/asset/beach-houses.css';

import BeachHouses from '../../../../components/prototype/asset/BeachHouses';
import Head from 'next/head';

export function generateMetadata({}) {
  let title = "Beach Houses Prototype";
  let description = "Prototype for Beach Houses";

  let openGraph = {
    site_name: "Arells",
    title: title,
    description: description,
    // Change this link after testing
    url: "/prototype/asset/beach-houses", 
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/twitter-image.jpg"
      }
    ]
  };

  let twitter = {
    title: title,
    // Change this link after testing
    url: "/prototype/asset/beach-houses",
    card: "summary_large_image",
    description: description,
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/twitter-image.jpg"
      }
    ]
  };

  return {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    linkCanonical: "/prototype/asset/beach-houses",
    title,
    description,
    openGraph,
    twitter
  };
}

const BeachHousesPage = () => {
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
      <div id="beach-houses-wrapper">
       <BeachHouses/>
      </div>
    </>
  );
}

export default BeachHousesPage;