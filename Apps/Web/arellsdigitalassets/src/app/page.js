
// Change below link after test
import './css/Home.css';

import Index from '../components/Index';
import Head from 'next/head';

const Home = () => {

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
      <div id="overlayy">
       <Index/>
      </div>
    </>
  );
}

export default Home;

const metadata = generateMetadata({});

export function generateMetadata({}) {
  let title = "Arells";
  let description = "Never lose money selling art. With Arells, bear markets don't exist. Create and buy Digital Assets and always sell them at a profit.";

  let openGraph = {
    site_name: "Arells",
    title: title,
    description: description,
    // Change this link after testing
    url: "https://arells.com", 
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner.jpg"
      }
    ]
  };

  let twitter = {
    title: title,
    description: description,
    // Change this link after testing
    url: "https://arells.com",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner.jpg"
      }
    ]
  };

  return {
    robots: "noimageindex",httpEquiv: {"X-UA-Compatible": "IE=edge"},
    charSet: "UTF-8", linkCanonical: "https://arells.com", 
    title, description, 
    openGraph, twitter
  };
}