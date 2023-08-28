import Index from '../components/Index';
import Head from 'next/head';


const Home = () => {

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
      </Head>
      <Index/>
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
  keywords: "Arells",
  author: "Arells",
  viewport: {
    content: "width=device-width,user-scalable=yes,initial-scale=1",
    id: "viewport"
  },
  linkCanonical: "https://arells.com",
  og: {
    image: "https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg",
    site_name: "Arells",
    type: "website",
    title: "Arells",
    url: "https://arells.com",
    description: "Never lose money selling art.",
    imageType: "image/jpg",
    imageWidth: "700",
    imageHeight: "400"
  },
  twitter: {
    title: "Arells",
    image: "https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg",
    url: "https://arells.com",
    card: "summary_large_image",
    description: "Never lose money selling art."
  }
};