// Change below link after test
import '../css/stayupdated.css';

import StayUpdated from '../../components/StayUpdated';

const StayUpdatedPage = () => {

  return (
    <>
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