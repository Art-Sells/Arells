// Change below link after test
import './css/error.css';

import Error from '../components/error/Error';
import { useNavigation } from 'next/navigation';

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

const router = useNavigation();
    
  //change below link after test
const currentURL = `https://jeremyakatsa.com${router.asPath}`;

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
  linkCanonical: currentURL,
  og: {
    site_name: "Arells",
    type: "website",
    title: "Arells",
    url: currentURL,
    description: "Never lose money selling art.",
  },
  twitter: {
    title: "Arells",
    url: currentURL,
    card: "summary_large_image",
    description: "Never lose money selling art."
  }
};