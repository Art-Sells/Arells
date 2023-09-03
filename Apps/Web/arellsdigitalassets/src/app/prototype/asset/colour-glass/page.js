import '../../../css/prototype/asset/colour-glass.css';

import ColourGlass from '../../../../components/prototype/asset/ColourGlass';

export async function generateMetadata({}) {
  let title = "Colour Glass Prototype";
  let description = "Prototype for Colour Glass";

  let openGraph = {
    site_name: "Arells",
    title: title,
    description: description,
    // Change this link after testing
    url: "/prototype/asset/colour-glass", 
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
    url: "/prototype/asset/colour-glass",
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
    linkCanonical: "/prototype/asset/colour-glass",
    title,
    description,
    openGraph,
    twitter
  };
}

const ColourGlassPage = () => {

  return (
    <>
      <div id="colour-glass-wrapper">
       <ColourGlass/>
      </div>
    </>
  );
}

export default ColourGlassPage;