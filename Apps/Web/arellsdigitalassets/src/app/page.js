
// Change below link after test
import './css/Home.css';

import Index from '../components/Index';

const Home = () => {

  return (
    <>
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
  //change below link after test
  linkCanonical: "/",
  og: {
    site_name: "Arells",
    type: "website",
    title: "Arells",
//change below link after test 
    url: "/",
    description: "Never lose money selling art.",
  },
  twitter: {
    title: "Arells",
// Change below link after test
    url: "/",
    card: "summary_large_image",
    description: "Never lose money selling art.",
    image: "https://d2d7sp5ao0zph4.cloudfront.net/metadata-images/twitter-image.jpg",
  }
};