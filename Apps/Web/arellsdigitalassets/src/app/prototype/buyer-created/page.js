import '../../css/prototype/buyer-created.css';

import PrototypeBuyerCreated from '../../../components/prototype/BuyerCreated';

const BuyerCreatedPage = () => {

  return (
    <>
      <div id="prototype-buyer-created-wrapper">
       <PrototypeBuyerCreated/>
      </div>
    </>
  );
}

export default BuyerCreatedPage;

export const metadata = {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    title: "Buyer Creations Prototype",
    description: "Prototype for Buyer Creations",
    google: "nositelinkssearchbox",
    keywords: ["Arells"],
    author: "Arells",
    // Change below link after test  
    linkCanonical: "https://arells.com/prototype/buyer-creations",
    og: {
      site_name: "Arells",
      type: "website",
      title: "Buyer Creations Prototype",
      // Change below link after test    
      url: "https://arells.com/prototype/buyer-creations",
      description: "Prototype for Buyer Creations",
    },
    twitter: {
      title: "Buyer Creations Prototype",
      // Change below link after test
      url: "https://arells.com/prototype/buyer-creations",
      card: "summary_large_image",
      description: "Prototype for Buyer Creations"
    }
  };