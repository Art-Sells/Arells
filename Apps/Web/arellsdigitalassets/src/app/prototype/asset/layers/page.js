import '../../../css/prototype/asset/layers.css';

import Layers from '../../../../components/prototype/asset/Layers';

export async function generateMetadata({}) {
  let title = "Layers Prototype";
  let description = "Prototype for Layers";

  let openGraph = {
    site_name: "Arells",
    title: title,
    description: description,
    // Change this link after testing
    url: "/prototype/asset/layers", 
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
    url: "/prototype/asset/layers",
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
    linkCanonical: "/prototype/asset/layers",
    title,
    description,
    openGraph,
    twitter
  };
}

const LayersPage = () => {

  return (
    <>
      <div id="layers-wrapper">
       <Layers/>
      </div>
    </>
  );
}

export default LayersPage;