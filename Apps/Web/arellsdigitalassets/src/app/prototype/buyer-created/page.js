import '../../css/prototype/buyer-created.css';

import PrototypeBuyerCreated from '../../../components/prototype/BuyerCreated';

export async function generateMetadata({}) {
  let title = "Buyer Creations Prototype";
  let description = "Prototype for Buyer Creations";

  let openGraph = {
    site_name: "Arells",
    title: title,
    description: description,
    // Change this link after testing
    url: "/prototype/buyer-creations", 
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
    url: "/prototype/buyer-creations",
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
    linkCanonical: "/prototype/buyer-creations",
    title,
    description,
    openGraph,
    twitter
  };
}

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