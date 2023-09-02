import '../../css/prototype/buyer-collected.css';

import PrototypeBuyerCollected from '../../../components/prototype/BuyerCollected';

const BuyerCollectedPage = () => {

  return (
    <>
      <div id="prototype-buyer-collected-wrapper">
       <PrototypeBuyerCollected/>
      </div>
    </>
  );
}

export default BuyerCollectedPage;

export const metadata = {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    title: "Buyer Collections Prototype",
    description: "Prototype for Buyer Collections",
    google: "nositelinkssearchbox",
    keywords: ["Arells"],
    author: "Arells",
    // Change below link after test  
    linkCanonical: "https://arells.com/prototype/buyer-collected",
    og: {
      site_name: "Arells",
      type: "website",
      title: "Buyer Collections Prototype",
      // Change below link after test    
      url: "https://arells.com/prototype/buyer-collected",
      description: "Prototype for Buyer Collections",
    },
    twitter: {
      title: "Buyer Collections Prototype",
      // Change below link after test
      url: "https://arells.com/prototype/buyer-collected",
      card: "summary_large_image",
      description: "Prototype for Buyer Collections"
    }
  };