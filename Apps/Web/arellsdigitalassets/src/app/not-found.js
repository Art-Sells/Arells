// Change below link after test
import './css/error.css';

import Error from '../components/error/Error';

const NotFound = () => {

  return (
    <>
      <div id="error-overlay">
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
  linkCanonical: "/",
  og: {
    site_name: "Arells",
    type: "website",
    title: "Arells",
    url: "/",
    description: "Never lose money selling art.",
  },
  twitter: {
    title: "Arells",
    url: "/",
    card: "summary_large_image",
    description: "Never lose money selling art."
  }
};