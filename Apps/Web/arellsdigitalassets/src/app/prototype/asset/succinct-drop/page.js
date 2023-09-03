import '../../../css/prototype/asset/succinct-drop.css';

import SuccinctDrop from '../../../../components/prototype/asset/SuccinctDrop';

export async function generateMetadata({}) {
  let title = "Succinct Drop Prototype";
  let description = "Prototype for Succinct Drop";

  let openGraph = {
    site_name: "Arells",
    title: title,
    description: description,
    // Change this link after testing
    url: "/prototype/asset/succinct-drop", 
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/twitter-image.jpg"
      }
    ]
  };

  let twitter = {
    title: title,
    // Change this link after testing
    url: "/prototype/asset/succinct-drop",
    card: "summary_large_image",
    description: description,
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/twitter-image.jpg"
      }
    ]
  };

  return {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    linkCanonical: "/prototype/asset/succinct-drop",
    title,
    description,
    openGraph,
    twitter
  };
}

const SuccinctDropPage = () => {

  return (
    <> 
      <div id="succinct-drop-wrapper">
       <SuccinctDrop/>
      </div>
    </>
  );
}

export default SuccinctDropPage;