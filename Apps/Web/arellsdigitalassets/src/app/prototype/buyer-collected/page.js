import '../../css/prototype/buyer-collected.css';

import PrototypeBuyerCollected from '../../../components/prototype/BuyerCollected';

export async function generateMetadata({}) {
  let title = "Buyer Collections Prototype";
  let description = "Prototype for Buyer Collections";

  let openGraph = {
    site_name: "Arells",
    title: title,
    description: description,
    // Change this link after testing
    url: "/prototype/buyer-collected", 
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
    url: "/prototype/buyer-collected",
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
    linkCanonical: "/prototype/buyer-collected",
    title,
    description,
    openGraph,
    twitter
  };
}

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