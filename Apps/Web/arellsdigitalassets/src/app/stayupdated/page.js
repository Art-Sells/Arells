// Change below link after test
import '../css/stayupdated.css';

import StayUpdated from '../../components/StayUpdated';
import Head from 'next/head';

const StayUpdatedPage = () => {

  return (
    <>
      <Head>
        <meta property="og:image" content="<generated>" />
        <meta property="og:image:type" content="<generated>" />
        <meta property="og:image:width" content="<generated>" />
        <meta property="og:image:height" content="<generated>" />
        <meta name="twitter:image" content="<generated>" />
        <meta name="twitter:image:type" content="<generated>" />
        <meta name="twitter:image:width" content="<generated>" />
        <meta name="twitter:image:height" content="<generated>" />
      </Head>
      <div id="wrapper">
       <StayUpdated/>
      </div>
    </>
  );
}

export default StayUpdatedPage;

export const metadata = {
  robots: "noimageindex",
  httpEquiv: {
    "X-UA-Compatible": "IE=edge"
  },
  charSet: "UTF-8",
  title: "Stay Updated",
  description: "Stay updated on our development.",
  google: "nositelinkssearchbox",
  keywords: ["Arells"],
  author: "Arells",
  //change below link after test
  linkCanonical: "/stayupdated",
  og: {
    site_name: "Arells",
    type: "website",
    title: "Stay Updated",
//change below link after test 
    url: "/stayupdated",
    description: "Stay updated on our development.",
  },
  twitter: {
    title: "Stay Updated",
// Change below link after test
    url: "/stayupdated",
    card: "summary_large_image",
    description: "Stay updated on our development."
  }
};