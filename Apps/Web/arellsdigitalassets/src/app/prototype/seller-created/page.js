import '../../css/prototype/seller-created.css';

import PrototypeSellerCreated from '../components/prototype/SellerCreated';

const SellerCreatedPage = () => {

  return (
    <>
      <div id="prototype-seller-created-wrapper">
       <PrototypeSellerCreated/>
      </div>
    </>
  );
}

export default SellerCreatedPage;

export const metadata = {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    title: "Seller Creations Prototype",
    description: "Prototype for Seller Creations",
    google: "nositelinkssearchbox",
    keywords: ["Arells"],
    author: "Arells",
    // Change below link after test  
    linkCanonical: "https://arells.com/prototype/seller-created",
    og: {
      site_name: "Arells",
      type: "website",
      title: "Seller Creations Prototype",
      // Change below link after test    
      url: "https://jeremyakatsa.com/prototype/seller-created",
      description: "Prototype for Seller Creations",
    },
    twitter: {
      title: "Seller Creations Prototype",
      // Change below link after test
      url: "https://jeremyakatsa.com/prototype/seller-created",
      card: "summary_large_image",
      description: "Prototype for Seller Creations"
    }
  };