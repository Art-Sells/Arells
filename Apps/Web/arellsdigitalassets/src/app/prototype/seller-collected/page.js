import '../../css/prototype/seller-collected.css';

import PrototypeSellerCollected from '../../../components/prototype/SellerCollected';

const SellerCollectedPage = () => {

  return (
    <>
      <div id="prototype-seller-collected-wrapper">
       <PrototypeSellerCollected/>
      </div>
    </>
  );
}

export default SellerCollectedPage;

export const metadata = {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    title: "Seller Collections Prototype",
    description: "Prototype for Seller Collections",
    google: "nositelinkssearchbox",
    keywords: ["Arells"],
    author: "Arells",
    // Change below link after test  
    linkCanonical: "https://jeremyakatsa.com/prototype/seller-collected",
    og: {
      site_name: "Arells",
      type: "website",
      title: "Seller Collections Prototype",
      // Change below link after test    
      url: "https://jeremyakatsa.com/prototype/seller-collected",
      description: "Prototype for Seller Collections",
    },
    twitter: {
      title: "Seller Collections Prototype",
      // Change below link after test
      url: "https://jeremyakatsa.com/prototype/seller-collected",
      card: "summary_large_image",
      description: "Prototype for Seller Collections"
    }
  };