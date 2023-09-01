import '../../css/Home.css';

import IndexTest from '../components/IndexTest';

const HomeTest = () => {

  return (
    <>
      <div id="overlayy">
       <IndexTest/>
      </div>
    </>
  );
}

export default HomeTest;

export const metadata = {
  metadataBase: new URL("https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg"),
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