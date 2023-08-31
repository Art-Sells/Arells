import '../../css/Home.css';

import Index from '../components/Index';
import Head from 'next/head';

const Home = () => {

  return (
    <>
      <Head>
        <meta name="robots" content="noimageindex" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta charSet="UTF-8" />
        <title>Arells</title>
        <meta name="description" content="Never lose money selling art." />
        <meta name="google" content="nositelinkssearchbox" />
        <meta name="keywords" content="Arells" />
        <meta name="author" content="Arells" />
        <meta name="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" id="viewport" />
        <link rel="canonical" href="https://arells.com/test/meta-test" />
        
        {/* OpenGraph tags */}
        <meta property="og:image" content="https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg" />
        <meta property="og:site_name" content="Arells" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Arells" />
        <meta property="og:url" content="https://arells.com/test/meta-test" />
        <meta property="og:description" content="Never lose money selling art." />
        <meta property="og:image:type" content="image/jpg" />
        <meta property="og:image:width" content="700" />
        <meta property="og:image:height" content="400" />

        {/* Twitter tags */}
        <meta name="twitter:title" content="Arells" />
        <meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg" />
        <meta name="twitter:url" content="https://arells.com/test/meta-test" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:description" content="Never lose money selling art." />
      </Head>
      <div id="overlayy">
       <Index/>
      </div>
    </>
  );
}

export default Home;

// export const metadata = {
//   robots: "noimageindex",
//   httpEquiv: {
//     "X-UA-Compatible": "IE=edge"
//   },
//   charSet: "UTF-8",
//   title: "Arells",
//   description: "Never lose money selling art.",
//   google: "nositelinkssearchbox",
//   keywords: "Arells",
//   author: "Arells",
//   viewport: {
//     content: "width=device-width,user-scalable=yes,initial-scale=1",
//     id: "viewport"
//   },
// // Change below link after test  
//   linkCanonical: "https://arells.com/test/meta-test",
//   og: {
//     image: "https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg",
//     site_name: "Arells",
//     type: "website",
//     title: "Arells",
// // Change below link after test    
//     url: "https://arells.com/test/meta-test",
//     description: "Never lose money selling art.",
//     imageType: "image/jpg",
//     imageWidth: "700",
//     imageHeight: "400"
//   },
//   twitter: {
//     title: "Arells",
//     image: "https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg",
// // Change below link after test
//     url: "https://arells.com/test/meta-test",
//     card: "summary_large_image",
//     description: "Never lose money selling art."
//   }
// };