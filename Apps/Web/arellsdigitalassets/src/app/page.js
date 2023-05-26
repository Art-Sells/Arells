
// Change below link after test
import './css/Home.css';
import Link from 'next/link';
import Head from 'next/head'

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