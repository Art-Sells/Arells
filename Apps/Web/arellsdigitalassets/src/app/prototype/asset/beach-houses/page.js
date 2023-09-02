import '../../../css/prototype/asset/beach-houses.css';

import BeachHouses from '../../../../components/prototype/asset/BeachHouses';

const BeachHousesPage = () => {

  return (
    <>
      <div id="beach-houses-wrapper">
       <BeachHouses/>
      </div>
    </>
  );
}

export default BeachHousesPage;

export const metadata = {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    title: "Beach Houses Prototype",
    description: "Prototype for Beach Houses",
    google: "nositelinkssearchbox",
    keywords: ["Arells"],
    author: "Arells",
    // Change below link after test  
    linkCanonical: "https://arells.com/prototype/asset/beach-houses",
    og: {
      site_name: "Arells",
      type: "website",
      title: "Beach Houses Prototype",
      // Change below link after test    
      url: "https://arells.com/prototype/asset/beach-houses",
      description: "Prototype for Beach Houses",
    },
    twitter: {
      title: "Beach Houses Prototype",
      // Change below link after test
      url: "https://arells.com/prototype/asset/beach-houses",
      description: "Prototype for Beach Houses"
    }
  };