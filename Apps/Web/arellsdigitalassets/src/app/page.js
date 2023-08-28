import Head from 'next/head'
import Index from '../components/Index';


const Home = () => {

  return (
    <>
      <Head>
        <meta name="robots" content="noimageindex"/>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
        <meta charSet="UTF-8"/>

        <meta name="title" content="Arells"/>
        <meta name="description" content="Never lose money selling art."/>
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
        <meta property="og:description" content="Never lose money selling art."/>
        <meta property="og:image:type" content="image/jpg"/>
        <meta property="og:image:width" content="700"/>
        <meta property="og:image:height" content="400"/>

        <meta name="twitter:title" content="Arells"/>
        <meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg"/>
        {/*<!-- Change below link after test -->*/}
        <meta name="twitter:url" content="https://arells.com"/>
        <meta name="twitter:card" content="summary_large_image"/>
        <meta name="twitter:description" content="Never lose money selling art."/>
      </Head>    
		  <title>Arells</title>	  
      
      <Index/>
      
    </>
  );
}

export default Home;