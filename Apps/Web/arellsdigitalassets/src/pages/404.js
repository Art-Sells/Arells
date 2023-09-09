 import '../app/css/error-style.css';
 
import PageError from '../components/error/404/PageError';

export default function Custom404() {
  return (
    <>
      <div id="error-overlay">
        <PageError/>
      </div>
    </>
  );
}

export function generateMetadata({}) {
  let title = "Page Not Found";
  let description = "This page cannot be found.";

  let openGraph = {
    site_name: "Arells",
    title: title,
    description: description,
    // Change this link after testing
    url: "https://arells.com", 
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner.jpg"
      }
    ]
  };

  let twitter = {
    title: title,
    description: description,
    // Change this link after testing
    url: "https://arells.com",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner.jpg"
      }
    ]
  };

  return {
    robots: "noimageindex",httpEquiv: {"X-UA-Compatible": "IE=edge"},
    charSet: "UTF-8", linkCanonical: "/", title, description, 
    openGraph, twitter
  };
}
  
  
  
  