import '../css/stayupdated.css';
import { useState } from 'react';

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

	const [showEnterInformation, setEnterInformation] = useState(false);
	const [showSubmitted, setSubmitted] = useState(false);

	const signUp = () => {
		if (typeof window !== 'undefined') {  // Check if we're in the browser
		  const emailInput = document.getElementById('email-input').value;
		  const firstNameInput = document.getElementById('first-input').value;
		  const lastNameInput = document.getElementById('last-input').value;
	  
		  if (emailInput === "" || firstNameInput === "" || lastNameInput === "") {
			setEnterInformation(true);
		  } else {
			$.ajax({
				url:"https://api.apispreadsheets.com/data/uAv9KS8S9kojekky/",
				type:"post",
				data:$("#myForm").serializeArray(),
				headers:{
					accessKey: "c492c5cefcf9fdde44bbcd84a97465f1",
					secretKey: "ac667f2902e4e472c82aff475a4a7a07"}
			});					
			document.getElementById('email-input').value = "";
			document.getElementById('first-input').value = "";
			document.getElementById('last-input').value = "";					
			setSubmitted(true);	
		  }
		}
	  };
	
    return (
        <>

		{showEnterInformation && (
			<div id="enterInformation">
				<div className="modal-content">
					<p>ENTER INFORMATION</p>
					<button className="close" onClick={closeEnterInformation}>OK</button>	
				</div>
			</div>
		)}

		{showSubmitted && (
			<div id="submitted">
				<div className="submitted-content">
					<p id="submitted-words">SUBMITTED</p>
					<button className="close" onClick={closeSubmitted}>OK</button>
				</div>
			</div>
		)}

		<div id="wrapper">
			
			<p id="stay-updated">STAY UPDATED</p> 
			
			
			<br/>				
						
			
            <div id="sign-up">   
				
				<form id="myForm">
					<div id="enter-content">
						<label id="label">EMAIL</label>		
						<br/>
						<input name="email" type="email" 
						id="email-input" ></input>
					</div>	
					<div id="enter-content">
						<label id="label">FIRST NAME</label>
						<br/>
						<input name="first_name" type="text" 
						id="first-input" ></input>
					</div>
					<div id="enter-content">
						<label id="label">LAST NAME</label>
						<br/>
						<input name="last_name" type="text" 
						id="last-input" ></input>
					</div>														
					<br/>
				    <a id="submit"  
				    onClick={signUp()}>SUBMIT</a>
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