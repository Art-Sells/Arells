import '../../../css/prototype/asset/beach-houses.css';

import BeachHouses from '../../../../components/prototype/asset/BeachHouses';

export async function generateMetadata({}) {
  let title = "Beach Houses Prototype";
  let description = "Prototype for Beach Houses";

  let openGraph = {
    site_name: "Arells",
    title: title,
    description: description,
    // Change this link after testing
    url: "/prototype/asset/beach-houses", 
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
    url: "/prototype/asset/beach-houses",
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
    linkCanonical: "/prototype/asset/beach-houses",
    title,
    description,
    openGraph,
    twitter
  };
}

const BeachHousesPage = () => {

  return (
    <>
      <div id="beach-houses-wrapper">
       <BeachHouses/>
      </div>
    </>
  );
}

export default BeachHousesPage;