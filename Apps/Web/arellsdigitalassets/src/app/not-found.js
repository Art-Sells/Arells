// Change below link after test
import './css/Home.css';

import Error from '../components/error/Error';

const NotFound = () => {

  return (
    <>
      <div id="overlayy">
       <Error/>
      </div>
    </>
  );
}

export default NotFound;

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
  linkCanonical: "https://jeremyakatsa.com",
  og: {
    site_name: "Arells",
    type: "website",
    title: "Arells",
//change below link after test 
    url: "https://jeremyakatsa.com",
    description: "Never lose money selling art.",
  },
  twitter: {
    title: "Arells",
// Change below link after test
    url: "https://jeremyakatsa.com",
    card: "summary_large_image",
    description: "Never lose money selling art."
  }
};