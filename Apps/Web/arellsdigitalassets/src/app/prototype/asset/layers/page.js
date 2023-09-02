import '../../../css/prototype/asset/layers.css';

import Layers from '../../../../components/prototype/asset/Layers';

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

export const metadata = {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    title: "Layers Prototype",
    description: "Prototype for Layers",
    google: "nositelinkssearchbox",
    keywords: ["Arells"],
    author: "Arells",
    // Change below link after test  
    linkCanonical: "/prototype/asset/layers",
    og: {
      site_name: "Arells",
      type: "website",
      title: "Layers Prototype",
      // Change below link after test    
      url: "/prototype/asset/layers",
      description: "Prototype for Layers",
    },
    twitter: {
      title: "Layers Prototype",
      // Change below link after test
      url: "/prototype/asset/layers",
      description: "Prototype for Layers"
    }
  };