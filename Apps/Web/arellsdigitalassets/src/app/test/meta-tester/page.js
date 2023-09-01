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
  //change below link after test
  metadataBase: new URL('https://jeremyakatsa.com/'),
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
  linkCanonical: "https://jeremyakatsa.com/test/meta-test",
  og: {
    site_name: "Arells",
    type: "website",
    title: "Arells",
// Change below link after test   
//change below link after test 
    url: "https://jeremyakatsa.com/test/meta-test",
    description: "Never lose money selling art.",
  },
  twitter: {
    title: "Arells",
// Change below link after test
    url: "https://jeremyakatsa.com/test/meta-test",
    card: "summary_large_image",
    description: "Never lose money selling art."
  }
};