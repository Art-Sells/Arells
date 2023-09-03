 import '../app/css/error-style.css';
 
import PageError from '../components/error/404/PageError';

export async function generateMetadata({}) {
    let title = "Page Not Found";
    let description = "This page cannot be found.";
  
    let openGraph = {
      site_name: "Arells",
      title: title,
      description: description,
      // Change this link after testing
      url: "/", 
      type: "website",
      images: [
        {
          url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons%26images/metadata-images/twitter-image.jpg"
        }
      ]
    };
  
    let twitter = {
      title: title,
      description: description,
      // Change this link after testing
      url: "/",
      card: "summary_large_image",
      images: [
        {
          url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons%26images/metadata-images/twitter-image.jpg"
        }
      ]
    };
  
    return {
      robots: "noimageindex",httpEquiv: {"X-UA-Compatible": "IE=edge"},
      charSet: "UTF-8", linkCanonical: "/", title, description, 
      openGraph, twitter
    };
  }

export default function Custom404() {
      return (
        <>
            <div id="error-overlay">
                <PageError/>
            </div>
        </>
        );
  }
  
  
  
  