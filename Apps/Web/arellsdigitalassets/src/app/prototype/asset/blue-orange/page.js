import '../../../css/prototype/asset/blue-orange.css';

import BlueOrange from '../../../../components/prototype/asset/BlueOrange';

export async function generateMetadata({}) {
  let title = "Blue Orange Prototype";
  let description = "Prototype for Blue Orange";

  let openGraph = {
    site_name: "Arells",
    title: title,
    description: description,
    // Change this link after testing
    url: "/prototype/asset/blue-orange", 
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
    url: "/prototype/asset/blue-orange",
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
    linkCanonical: "/prototype/asset/blue-orange",
    title,
    description,
    openGraph,
    twitter
  };
}

const BlueOrangePage = () => {

  return (
    <>
      <div id="blue-orange-wrapper">
       <BlueOrange/>
      </div>
    </>
  );
}

export default BlueOrangePage;