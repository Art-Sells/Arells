 import '../app/css/error-style.css';

 import Error from '../components/error/Error';

export default function Custom404() {
      return (
        <>
            <div id="error-overlay">
                <Error/>
            </div>
        </>
        );
  }

  export async function getStaticProps() {
  
    const metadata = {
        robots: "noimageindex",
        httpEquiv: {
          "X-UA-Compatible": "IE=edge"
        },
        charSet: "UTF-8",
        title: "Page Not Found",
        description: "This page doesn't exist.",
        google: "nositelinkssearchbox",
        keywords: ["Arells"],
        author: "Arells",
        //change below link after test
        linkCanonical: "/",
        og: {
          site_name: "Arells",
          type: "website",
          title: "Page Not Found",
      //change below link after test 
          url: "/",
          description: "This page doesn't exist.",
        },
        twitter: {
          title: "Page Not Found",
      // Change below link after test
          url: "/",
          card: "summary_large_image",
          description: "This page doesn't exist.",
        }
    };
  
    return {
      props: {
        metadata
      }
    };
  }
  
  
  
  