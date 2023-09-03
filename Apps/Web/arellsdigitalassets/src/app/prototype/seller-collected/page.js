import '../../css/prototype/seller-collected.css';

import PrototypeSellerCollected from '../../../components/prototype/SellerCollected';

export async function generateMetadata({}) {
  let title = "Seller Collections Prototype";
  let description = "Prototype for Seller Collections";

  let openGraph = {
    site_name: "Arells",
    title: title,
    description: description,
    // Change this link after testing
    url: "/prototype/seller-collected", 
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons%26images/metadata-images/twitter-image.jpg"
      }
    ]
  };

  let twitter = {
    title: title,
    // Change this link after testing
    url: "/prototype/seller-collected",
    card: "summary_large_image",
    description: description,
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons%26images/metadata-images/twitter-image.jpg"
      }
    ]
  };

  return {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    linkCanonical: "/prototype/seller-collected",
    title,
    description,
    openGraph,
    twitter
  };
}

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