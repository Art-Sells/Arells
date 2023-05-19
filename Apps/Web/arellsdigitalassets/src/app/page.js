
// Change below link after test
import './css/Home.css';
import Link from 'next/link';
import Head from 'next/head';

const Home = () => {
  return (
    <>
      <Head>	
                                                        
        <meta name="robots" content="noimageindex"/>
            
          <meta charset="UTF-8"/>

          {/*<!-- Below information for social media sharing and search-engine/browser optimization -->*/}		
          <meta name="title" content="Arells"/>
          <meta name="description" content="Art Sells"/>
          <meta name="google" content="nositelinkssearchbox"/>
          <meta name="keywords" content="Arells"/>
          <meta name="author" content="Arells"/>
          <meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" />

              {/*<!-- Change below link after test -->*/}
          <link rel="canonical" href="https://arells.com"/>

          <meta property="og:image" content="https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg"/>	
          <meta property="og:site_name" content="Arells"/>	
          <meta property="og:type" content="object"/>				
          <meta property="og:title" content="Arells"/>
              {/*<!-- Change below link after test -->*/}
          <meta propety="og:url" content="https://arells.com"/>
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
        {/*<!-- Above information for social media sharing and search-engine/browser optimization -->*/}	
        
        <title>Arells</title>

        {/* body styling element */}
          <style>
          {`
          body {
            text-align: center;
            font-family: Arial;
            margin-top: 0%;
            margin-left: 0%;
            margin-right: 0%;
            margin-bottom: 0%;
              background: white;
            }
          `}
          </style>        


      </Head>    
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
          <Link href="/stayupdated" 
          id="updatess">
                STAY UPDATED
          </Link>			
          
          <div id="prototype-spacer">
            {/*<!-- Change below link after test -->*/}
            <Link href="/prototype-seller-created" 
            id="prototype">
                  PROTOTYPE
            </Link>	        
          </div>
      
        </div>		
      
      
        <div id="footerr">	
          <a href="https://twitter.com/arellsofficial"
              target="_blank"
              id="contactt">
              <img id="twitterr" src="/icons&images/Twitter.png"/>
          </a>  		
        </div>          
    </>
  );
}

export default Home;