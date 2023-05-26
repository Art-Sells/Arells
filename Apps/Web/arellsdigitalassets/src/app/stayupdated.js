import './css/stayupdated.css';
import Head from 'next/head'

const StayUpdated = () => {
    return (
        <>
		<Head>
			<meta name="robots" content="noimageindex"/>

			<meta charset="UTF-8"/>

			{/*<!-- Below information for social media sharing and search-engine/browser optimization -->*/}		
			<meta name="title" content="Arells"/>
			<meta name="description" content="Stay Updated"/>
			<meta name="google" content="nositelinkssearchbox"/>
			<meta name="keywords" content="Arells"/>
			<meta name="author" content="Arells"/>
			<meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" />

				{/*<!-- Change below link after test -->*/}
			<link rel="canonical" href="https://arells.com/stayupdated"/>

			<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg"/>	
			<meta property="og:site_name" content="Arells"/>	
			<meta property="og:type" content="object"/>				
			<meta property="og:title" content="Arells"/>
				{/*<!-- Change below link after test -->*/}
			<meta propety="og:url" content="https://arells.com/stayupdated"/>
			<meta property="og:description" content="Stay Updated"/>
			<meta property="og:image:type" content="image/jpg"/>
			<meta property="og:image:width" content="700"/>
			<meta property="og:image:height" content="400"/>

			<meta name="twitter:title" content="Arells"/>
			<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg"/>
				{/*<!-- Change below link after test -->*/}
			<meta name="twitter:url" content="https://arells.com/stayupdated"/>
			<meta name="twitter:card" content="summary_large_image"/>
			<meta name="twitter:description" content="Stay Updated"/>
			{/*<!-- Above information for social media sharing and search-engine/browser optimization -->*/}	          

		</Head>		
		<div id="wrapper">
			
			<p id="stay-updated">STAY UPDATED</p> 
			
			
			<br/>				
						
			
            <div id="sign-up">   
				
				<form id="myForm">
					<div id="enter-content">
						<label id="label">EMAIL</label>		
						<br/>
						<input name="email" type="email" 
						id="email-input" 
						class=".form-control"></input>
					</div>	
					<div id="enter-content">
						<label id="label">FIRST NAME</label>
						<br/>
						<input name="first_name" type="text" 
						id="first-input" 
						class=".form-control"></input>
					</div>
					<div id="enter-content">
						<label id="label">LAST NAME</label>
						<br/>
						<input name="last_name" type="text" 
						id="last-input" 
						class=".form-control"></input>
					</div>														
					<br/>
				    <a id="submit"  
				    onclick="signUp()">SUBMIT</a>
				</form>
            </div>
            
            <div id="footer">
                <a href="https://twitter.com/arellsofficial"
                    target="_blank"
                    id="contact">
                    <img id="twitter" src="/icons&images/Twitter.png"/>
                </a>  		
            </div>               
		
		</div>			
		     
        </>
    );
}

export default StayUpdated;