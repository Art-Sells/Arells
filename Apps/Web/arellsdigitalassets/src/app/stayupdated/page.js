"use client";

import Head from 'next/head'
// Change below link after test
import '../css/stayupdated.css';
import '../css/modals/stayupdated-modal.css';
import { useState } from 'react';
import $ from 'jquery';
import Image from 'next/image';

const stayUpdated = () => {

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

	const closeEnterInformation = () => {
		setEnterInformation(false);
	};

	const closeSubmitted = () => {
		setSubmitted(false);
	};
	
    return (
        <>

		<Head>
			<meta name="robots" content="noimageindex"/>
			<meta http-equiv="X-UA-Compatible" content="IE=edge"/>

			<meta charset="UTF-8"/>

			<meta name="title" content="Stay Updated"/>
			<meta name="description" content="Stay updated on our development"/>
			<meta name="google" content="nositelinkssearchbox"/>
			<meta name="keywords" content="Arells"/>
			<meta name="author" content="Arells"/>
			<meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" />
			{/*<!-- Change below link after test -->*/}
			<link rel="canonical" href="https://arells.com/stayupdated"/>

			<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/223035337-47c28406-e5f5-4dcd-acb6-f3acd0646646.jpg"/>
			<meta property="og:site_name" content="Arells"/>
			<meta property="og:type" content="website"/>
			<meta property="og:title" content="Stay Updated"/>

			{/*<!-- Change below link after test -->*/}
			<meta property="og:url" content="https://arells.com/stayupdated"/>
			<meta property="og:description" content="Stay updated on our development"/>
			<meta property="og:image:type" content="image/jpg"/>
			<meta property="og:image:width" content="700"/>
			<meta property="og:image:height" content="400"/>

			<meta name="twitter:title" content="Stay Updated"/>
			<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/223035337-47c28406-e5f5-4dcd-acb6-f3acd0646646.jpg"/>
			{/*<!-- Change below link after test -->*/}
			<meta name="twitter:url" content="https://arells.com/stayupdated"/>
			<meta name="twitter:card" content="summary_large_image"/>
			<meta name="twitter:description" content="Stay updated on our development"/>
		</Head>	

		<title>Stay Updated</title>	

		{showEnterInformation && (
			<div className="RWmodal">
				<div className="RWmodal-content">
					<p>ENTER INFORMATION</p>
					<button className="RWclose" onClick={closeEnterInformation}>OK</button>	
				</div>
			</div>
		)}

		{showSubmitted && (
			<div className="RWmodal">
				<div className="RWmodal-content">
					<p>SUBMITTED</p>
					<button className="RWclose" onClick={closeSubmitted}>OK</button>
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
				    onClick={signUp}>SUBMIT</a>
				</form>
            </div>
            
            <div id="footer">
                <a href="https://twitter.com/arellsofficial"
                    target="_blank"
                    id="contact">
                    <Image alt="" id="twitter" src="/icons&images/Twitter.png"/>
                </a>  		
            </div>               
		
		</div>			
		     
        </>
    );
}

export default stayUpdated;