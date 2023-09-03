import '../../../css/prototype/asset/paint-rain.css';

import PaintRain from '../../../../components/prototype/asset/PaintRain';

export async function generateMetadata({}) {
  let title = "Paint Rain Prototype";
  let description = "Prototype for Paint Rain";

  let openGraph = {
    site_name: "Arells",
    title: title,
    description: description,
    // Change this link after testing
    url: "/prototype/asset/paint-rain", 
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
    url: "/prototype/asset/paint-rain",
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
    linkCanonical: "/prototype/asset/paint-rain",
    title,
    description,
    openGraph,
    twitter
  };
}

const PaintRainPage = () => {

  return (
    <> 
      <div id="paint-rain-wrapper">
       <PaintRain/>
      </div>
    </>
  );
}

export default PaintRainPage;