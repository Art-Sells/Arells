import '../../../css/prototype/asset/succinct-drop.css';

import SuccinctDrop from '../../../../components/prototype/asset/SuccinctDrop';

const SuccinctDropPage = () => {

  return (
    <>
      <div id="succinct-drop-wrapper">
       <SuccinctDrop/>
      </div>
    </>
  );
}

export default SuccinctDropPage;

export const metadata = {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    title: "Succinct Drop Prototype",
    description: "Prototype for Succinct Drop",
    google: "nositelinkssearchbox",
    keywords: ["Arells"],
    author: "Arells",
    // Change below link after test  
    linkCanonical: "/prototype/asset/succinct-drop",
    og: {
      site_name: "Arells",
      type: "website",
      title: "Succinct Drop Prototype",
      // Change below link after test    
      url: "/prototype/asset/succinct-drop",
      description: "Prototype for Succinct Drop",
    },
    twitter: {
      title: "Succinct Drop Prototype",
      // Change below link after test
      url: "/prototype/asset/succinct-drop",
      description: "Prototype for Succinct Drop"
    }
  };