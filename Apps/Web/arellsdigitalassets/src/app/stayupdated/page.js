// Change below link after test
import '../css/stayupdated.css';

import StayUpdated from '../../components/StayUpdated';

export async function generateMetadata({}) {
  let title = "Stay Updated";
  let description = "Stay updated on our development.";

  let openGraph = {
    site_name: "Arells",
    title: title,
    description: description,
    // Change this link after testing
    url: "https://jeremyakatsa.com/stayupdated", 
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
    url: "https://jeremyakatsa.com/stayupdated",
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
    linkCanonical: "https://jeremyakatsa.com/stayupdated",
    title,
    description,
    openGraph,
    twitter
  };
}

const StayUpdatedPage = () => {

  return (
    <>
      <div id="wrapper">
       <StayUpdated/>
      </div>
    </>
  );
}

export default StayUpdatedPage;