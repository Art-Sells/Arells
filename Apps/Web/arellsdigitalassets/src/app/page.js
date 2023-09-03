
// Change below link after test
import './css/Home.css';

import Index from '../components/Index';
// import Head from 'next/head';

export async function generateMetadata({}) {
    let title = "Arells";
    let description = "Never lose money selling art.";
  
    let openGraph = {
      site_name: "Arells",
      title: title,
      description: description,
      // Change this link after testing
      url: "https://jeremyakatsa.com", 
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
      url: "https://jeremyakatsa.com",
      card: "summary_large_image",
      images: [
        {
          url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons%26images/metadata-images/twitter-image.jpg"
        }
      ]
    };
  
    return {
      robots: "noimageindex",httpEquiv: {"X-UA-Compatible": "IE=edge"},
      charSet: "UTF-8", linkCanonical: "https://jeremyakatsa.com", 
      title, description, 
      openGraph, twitter
    };
  }

const Home = () => {

  return (
    <>
      <div id="overlayy">
       <Index/>
      </div>
    </>
  );
}

export default Home;