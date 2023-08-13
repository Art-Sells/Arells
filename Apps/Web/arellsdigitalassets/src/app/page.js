"use client";


// Change below link after test
import './css/Home.css';

import { useEffect } from 'react';
import Head from 'next/head'
import Link from 'next/link';
import Image from 'next/image';

const Index = () => {
  useEffect(() => {
    function resetPrototype() {
      sessionStorage.removeItem('walletConnectedSession'); 

      sessionStorage.removeItem('blueOrangeAdded');
      sessionStorage.removeItem('blueOrangePurchased');

      sessionStorage.removeItem('beachHousesAdded');
      sessionStorage.removeItem('beachHousesPurchased');

      sessionStorage.removeItem('colourGlassAdded');
      sessionStorage.removeItem('colourGlassPurchased');

      sessionStorage.removeItem('layersAdded');
      sessionStorage.removeItem('layersPurchased');

      sessionStorage.removeItem('succinctDropAdded');
      sessionStorage.removeItem('succinctDropPurchased');

      sessionStorage.removeItem('paintRainAdded');
      sessionStorage.removeItem('paintRainPurchased');
    }
    
    resetPrototype();
  }, []);

  return (
    <>
      <Head>
        <meta name="robots" content="noimageindex"/>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
        <meta charSet="UTF-8"/>

        <meta name="title" content="Arells"/>
        <meta name="description" content="Art Sells"/>
        <meta name="google" content="nositelinkssearchbox"/>
        <meta name="keywords" content="Arells"/>
        <meta name="author" content="Arells"/>
        <meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1"/>
        {/*<!-- Change below link after test -->*/}
        <link rel="canonical" href="https://arells.com"/>
        <meta property="og:image" content="https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg"/>
        <meta property="og:site_name" content="Arells"/>
        <meta property="og:type" content="website"/>
        <meta property="og:title" content="Arells"/>
        {/*<!-- Change below link after test -->*/}
        <meta property="og:url" content="https://arells.com"/>
        <meta property="og:description" content="Art Sells"/>
        <meta property="og:image:type" content="image/jpg"/>
        <meta property="og:image:width" content="700"/>
        <meta property="og:image:height" content="400"/>

        <meta name="twitter:title" content="Arells"/>
        <meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg"/>
        {/*<!-- Change below link after test -->*/}
        <meta name="twitter:url" content="https://arells.com"/>
        <meta name="twitter:card" content="summary_large_image"/>
        <meta name="twitter:description" content="Art Sells"/>
      </Head>    
		  <title>Arells</title>	    

      <div id="overlayy">
  
        <Image alt="" id="arells-iconn" src="/icons&images/Arells-Icon.png"/>
      
        <br/>
        
        <Image alt="" id="word-logoo" src="/icons&images/Arells-Logo-Ebony.png"/>	
        
        <br/>
        
        <p id="slogann">ART SELLS</p>
        
        <hr id="black-liner"/>
        
        <p id="descriptioner">
          NEVER LOSE MONEY ON NFT SALES
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
              <Image alt="" id="twitterr" src="/icons&images/Twitter.png"/>
          </a>  		
        </div>             
    
      </div>		       
    </>
  );
}

export default Index;