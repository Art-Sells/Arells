import '../../css/prototype/seller-created.css';

import PrototypeSellerCreatedTest from '../components/prototype/SellerCreatedTest';

const SellerCreatedPageTest = () => {

  return (
    <>
      <div id="prototype-seller-created-wrapper">
       <PrototypeSellerCreatedTest/>
      </div>
    </>
  );
}

export default SellerCreatedPageTest;

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
    linkCanonical: "https://jeremyakatsa.com/test/prototype",
    og: {
      site_name: "Arells",
      type: "website",
      title: "Seller Creations Prototype",
      // Change below link after test    
      url: "https://jeremyakatsa.com/test/prototype",
      description: "Prototype for Seller Creations",
    },
    twitter: {
      title: "Seller Creations Prototype",
      // Change below link after test
      url: "https://jeremyakatsa.com/test/prototype",
      card: "summary_large_image",
      description: "Prototype for Seller Creations"
    }
  };