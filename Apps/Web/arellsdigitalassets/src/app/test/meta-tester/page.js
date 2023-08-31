import '../../css/Home.css';

import Index from '../components/Index';
import Head from 'next/head';

const Home = () => {

  return (
    <>
    <Head>
      <meta name="robots" content="noimageindex"/>
      <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
      <meta charset="UTF-8"/>
      <meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" />
      <meta property="og:image" content="https://user-images.githubusercontent.com/51394348/223035337-47c28406-e5f5-4dcd-acb6-f3acd0646646.jpg"/>
      <meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/223035337-47c28406-e5f5-4dcd-acb6-f3acd0646646.jpg"/>
    </Head>

      <div id="overlayy">
       <Index/>
      </div>
    </>
  );
}

export default Home;

export const metadata = {
  robots: "noimageindex",
  httpEquiv: {
    "X-UA-Compatible": "IE=edge"
  },
  charSet: "UTF-8",
  title: "Arells",
  description: "Never lose money selling art.",
  google: "nositelinkssearchbox",
  keywords: ["Arells"],
  author: "Arells",
  viewport: {
    content: "width=device-width,user-scalable=yes,initial-scale=1",
    id: "viewport"
  },
// Change below link after test  
  linkCanonical: "https://arells.com/test/meta-test",
  og: {
    image: [
      {
        url:"https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg",
        width:700,
        height:400,
      }
    ],
    site_name: "Arells",
    type: "website",
    title: "Arells",
// Change below link after test    
    url: "https://arells.com/test/meta-test",
    description: "Never lose money selling art.",
  },
  twitter: {
    title: "Arells",
    image: [
      {
        url:"https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg",
        width:700,
        height:400,
      }
    ],
// Change below link after test
    url: "https://arells.com/test/meta-test",
    card: "summary_large_image",
    description: "Never lose money selling art."
  }
};