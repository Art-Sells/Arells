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
    viewport: {
      content: "width=device-width,user-scalable=yes,initial-scale=1",
      id: "viewport"
    },
    // Change below link after test  
    linkCanonical: "https://arells.com/prototype-seller-created",
    og: {
        image: [
            {
              url:"https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg",
              width:700,
              height:400,
            }
          ],
      site_name: "Arells",
      type: "website",
      title: "Seller Creations Prototype",
      // Change below link after test    
      url: "https://arells.com/prototype-seller-created",
      description: "Prototype for Seller Creations",
      imageType: "image/jpg",
      imageWidth: "700",
      imageHeight: "400"
    },
    twitter: {
      title: "Seller Creations Prototype",
      image: [
        {
          url:"https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg",
          width:700,
          height:400,
        }
      ],
      // Change below link after test
      url: "https://arells.com/prototype-seller-created",
      card: "summary_large_image",
      description: "Prototype for Seller Creations"
    }
  };