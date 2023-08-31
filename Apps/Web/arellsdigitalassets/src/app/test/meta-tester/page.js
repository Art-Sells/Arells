import '../../css/Base.css';

import Index from '../components/Index';

const Home = () => {

  return (
    <>
      <div id="base">
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
  keywords: "Arells",
  author: "Arells",
  viewport: {
    content: "width=device-width,user-scalable=yes,initial-scale=1",
    id: "viewport"
  },
// Change below link after test  
  linkCanonical: "https://arells.com/test/meta-test",
  og: {
    image: "https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg",
    site_name: "Arells",
    type: "website",
    title: "Arells",
// Change below link after test    
    url: "https://arells.com/test/meta-test",
    description: "Never lose money selling art.",
    imageType: "image/jpg",
    imageWidth: "700",
    imageHeight: "400"
  },
  twitter: {
    title: "Arells",
    image: "https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg",
// Change below link after test
    url: "https://arells.com/test/meta-test",
    card: "summary_large_image",
    description: "Never lose money selling art."
  }
};