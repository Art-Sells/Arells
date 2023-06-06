
// Change below link after test
import './css/Home.css';

import Link from 'next/link';
 
export const metadata = {
  title: 'Arells',
  metaTags: {
    standard: {
      robots: 'noimageindex',
      charset: 'UTF-8',
      'X-UA-Compatible': 'IE=edge',
      title: 'Arells',
      description: 'Art Sells',
      google: 'nositelinkssearchbox',
      keywords: 'Arells',
      author: 'Arells',
      viewport: 'width=device-width,user-scalable=yes,initial-scale=1',
      canonical: 'https://arells.com'
    },
    openGraph: {
      image: 'https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg',
      site_name: 'Arells',
      type: 'object',
      title: 'Arells',
      url: 'https://arells.com',
      description: 'Art Sells',
      'image:type': 'image/jpg',
      'image:width': '700',
      'image:height': '400'
    },
    twitter: {
      title: 'Arells',
      image: 'https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg',
      url: 'https://arells.com',
      card: 'summary_large_image',
      description: 'Art Sells'
    }
  }
};

const Home = () => {
  return (
    <>
      <div id="overlayy">
  
        <img id="arells-iconn" src="/icons&images/Arells-Icon.png"/>
      
        <br/>
        
        <img id="word-logoo" src="/icons&images/Arells-Logo-Ebony.png"/>	
        
        <br/>
        
        <p id="slogann">ART SELLS</p>
        
        <hr id="black-liner"/>
        
        <p id="descriptioner">
          AN NFT STORE THAT FINANCIALLY EMPOWERS ARTISTS
        </p>
        
        <hr id="black-liner"/>
        
        <p id="coming-soonn">COMING SOON</p>
    
        {/*<!-- Change below link after test -->*/}
        <Link legacyBehavior href="/stayupdated" >
          <a id="updatess">STAY UPDATED</a>
        </Link>			
        
        <div id="prototype-spacer">
          {/*<!-- Change below link after test -->*/}
          <Link legacyBehavior href="/prototype-seller-created">
            <a id="prototype">PROTOTYPE</a>
          </Link>	        
        </div>

        <div id="footerr">	
          <a href="https://twitter.com/arellsofficial"
              target="_blank"
              id="contactt">
              <img id="twitterr" src="/icons&images/Twitter.png"/>
          </a>  		
        </div>             
    
      </div>		       
    </>
  );
}

export default Home;