import { useRouteError } from "react-router-dom";
import "./css/error.css";
import { HelmetProvider} from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Favicon from "react-favicon";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <>
    <Favicon url="favicon.ico"/>
    <HelmetProvider>	
              
    {/*<!-- Change below links after test -->*/}
		<link rel="stylesheet" type="text/css" href="css/homers.css"/>	
			
		<meta charset="UTF-8"/>
		<meta name="robots" content="noimageindex"/>
		
{/*<!-- Below information for social media sharing and search-engine/browser optimization -->*/}		
		<meta name="title" content="Arells"/>
		<meta name="description" content="Art Sells"/>
		<meta name="google" content="nositelinkssearchbox"/>
		<meta name="keywords" content="Arells"/>
		<meta name="author" content="Arells"/>
		<meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" />
	
		<link rel="icon" type="image/x-icon" href="/icons&images/Arells-Ico.ico" sizes="156x156"/>
				{/*<!-- Change below link after test -->*/}
		<link rel="canonical" href="https://arells.com"/>
		
		<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg">	
		<meta property="og:site_name" content="Arells"/>	
		<meta property="og:type" content="object"/>				
		<meta property="og:title" content="Arells"/>
				{/*<!-- Change below link after test -->*/}
		<meta propety="og:url" content="https://arells.com"/>
		<meta property="og:description" content="Art Sells"/>
		<meta property="og:image:type" content="image/jpg"/>
		<meta property="og:image:width" content="700"/>
		<meta property="og:image:height" content="400"/>
		
		<meta name="twitter:title" content="Art Sells">
		<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg"/>
				{/*<!-- Change below link after test -->*/}
		<meta name="twitter:url" content="https://arells.com"/>
		<meta name="twitter:card" content="summary_large_image"/>
		<meta name="twitter:description" content="Arells"/>
		<meta name="description" content="Arells"/>
{/*<!-- Above information for social media sharing and search-engine/browser optimization -->*/}	

        <title>Oops!</title>


      {/* body styling element */}
      <style>
      {`
        body {
          text-align: center;
          font-family: 'MyWebFont', Arial;
          margin-left: 0%;
          margin-right: 0%;
          background-color: #f8f8fc;
          margin-bottom: 0%;
          margin-top: 0%;
          padding: 100px;
          border-radius: 10px;
        }
      `}
      </style>              
    </HelmetProvider>    

    <div id="container">
        <div id="welcome-section">
          <Link to="/">
            <img id="oops-img" src="/icons&images/appIcon.png"/>
          </Link>          
          <h1 id="oops">Oops!</h1>
          <p id="oops-name">An error has occurred.</p>
          <i id="oops-message">{error.statusText || error.message}</i>
        </div>
    </div>
    </>


  );
}