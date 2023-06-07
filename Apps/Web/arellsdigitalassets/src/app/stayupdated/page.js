import '../css/stayupdated.css';
import '../../../scripts/stayupdated.js';
import '../../../scripts/RWmodal.min.js';

export const metadata = {
	title: 'Stay Updated',
	metaTags: {
	  standard: {
		robots: 'noimageindex',
		'X-UA-Compatible': 'IE=edge',
		charset: 'UTF-8',
		title: 'Stay Updated',
		description: 'Stay updated on our development',
		google: 'nositelinkssearchbox',
		keywords: 'Arells',
		author: 'Arells',
		viewport: 'width=device-width,user-scalable=yes,initial-scale=1',
		canonical: 'https://arells.com/stayupdated'
	  },
	  openGraph: {
		image: 'https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg',
		site_name: 'Arells',
		type: 'website',
		title: 'Stay Updated',
		url: 'https://arells.com/stayupdated',
		description: 'Stay updated on our development',
		'image:type': 'image/jpg',
		'image:width': '700',
		'image:height': '400'
	  },
	  twitter: {
		title: 'Stay Updated',
		image: 'https://user-images.githubusercontent.com/51394348/227811567-244af8ad-d592-40f9-9188-6d225fffe46f.jpg',
		url: 'https://arells.com/stayupdated',
		card: 'summary_large_image',
		description: 'Stay updated on our development'
	  }
	}
  };

const stayupdated = () => {
    return (
        <>
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

export default stayupdated;