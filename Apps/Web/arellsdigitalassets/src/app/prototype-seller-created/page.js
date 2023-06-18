"use client";

import Head from 'next/head'
// Change below link after test
import '../css/stayupdated.css';
import '../css/modals/stayupdated-modal.css';
import { useState } from 'react';
import $ from 'jquery';

const prototypeSellerCreated = () => {

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

		<div id="prototype-seller-created-wrapper">
				<div id="header-seller-created">
			
			{/*<!-- Change below link after test -->*/}
				<a id="icon-link-seller-created" href="/">
					<img id="arells-icon-seller-created" src="/icons&images/prototype/Arells-Icon-Home.png"/>
				</a>		
				<button id="cart-link-seller-created" onClick="connectWallet()" style="display: inline-block;">
					<img id="cart-icon-seller-created" src="/icons&images/prototype/shopping-cart-empty.png"/>
				</button>
				<a id="cart-link-connected-seller-created" href="/prototype-cart" style="display: none;">
					<img id="cart-icon-seller-created" src="/icons&images/prototype/shopping-cart-empty.png"/>
				</a>	
				
				<a id="cart-link-full-seller-created" href="/prototype-cart" style="display: none;">
					<img id="cart-icon-seller-created" src="/icons&images/prototype/shopping-cart-full.png"/>
				</a>
			</div>
			<img id="word-logo-seller-created" src="/icons&images/Arells-Logo-Ebony.png"/>	
			<p id="slogan-seller-created">ART SELLS</p>
			<div id="wallet-connected-div-seller-created" style="display: none;">
				<hr id="connected-line-seller-created"/>
				<p id="wallet-connected-seller-created" >
				WALLET CONNECTED</p>
				<hr id="connected-line-seller-created"/>
			</div>
			<div id="profile-img-container-seller-created">
				<img id="profile-photo-seller-created" src="/icons&images/prototype/proto-banner.jpg"/>
			</div>	 
			<h1 id="name-seller-created">Abstract Kadabra</h1>  
			<p id="description-seller-created">Here rests life's abstractions captured in majestic endeavors.</p> 
			<div id="share-div">
				<p id="share-div-desc">SHARE</p>
				<button id="copy-link-seller-created"
				onClick="copyLink()">
				<img id="copy-link-icon-seller-created" src="/icons&images/prototype/link.png"/>
				COPY LINK</button>	
			</div>
			<hr id="profileline-seller-created"/>
			<div id="created-collected-seller-created">
				<a id="created-seller-created">Created</a>	
			{/*<!-- Change below link after test -->*/}		
				<a id="collected-seller-created" href="/prototype-seller-collected">Collected</a>	
			</div>
			<div id="container-seller-created">
					<div id="blue-orange-seller-created">
					{/*<!-- Change below link after test -->*/}
						<a href="/prototype-blue-orange" target="_self" id="photo-link-seller-created">
							<img id="photo-seller-created" src="/icons&images/prototype/1.jpg"/>
						</a>
						<div id="blue-orange-prices-before-seller-created" style="display: block;">
							<p id="PAP-seller-created">Price After Purchase</p>
							<p id="PAP-blue-orange-before-seller-created">$60,000</p>
							<hr id="priceline-seller-created"/>
							<p id="yourprice-seller-created">Price</p>
							<p id="price-blue-orange-before-seller-created">$1,200</p>
						</div>	
						<div id="blue-orange-prices-after-seller-created" style="display: none;">
							<p id="PAP-seller-created">Price After Purchase</p>
							<p id="PAP-blue-orange-after-seller-created">$3,000,000</p>
							<hr id="priceline-seller-created"/>
							<p id="yourprice-seller-created">Price</p>
							<p id="price-blue-orange-after-seller-created">$60,000</p>
						</div>	
						<button id="blue-orange-add-to-cart-seller-created" onClick="connectWallet()"
						style="display: block;">
						ADD TO CART</button>
						<button id="blue-orange-add-to-cart-connected-seller-created" onClick="addBlueOrangeToCart()"
						style="display: none;">
						ADD TO CART</button>
						<button id="blue-orange-added-seller-created" style="display: none;">
						ADDED</button>	
						<button id="blue-orange-collected-seller-created" style="display: none;">
						COLLECTED</button>	
					</div>
					<div id="beach-houses-seller-created">
					{/*<!-- Change below link after test -->*/}
						<a href="/prototype-beach-houses" target="_self" id="photo-link-seller-created">
							<img id="photo-seller-created" src="/icons&images/prototype/2.jpg"/>
						</a>
						<div id="beach-houses-prices-before-seller-created" style="display: block;">
							<p id="PAP-seller-created">Price After Purchase</p>
							<p id="PAP-beach-houses-before-seller-created">$10,000</p>
							<hr id="priceline-seller-created"/>
							<p id="yourprice-seller-created">Price</p>
							<p id="price-beach-houses-before-seller-created">$200</p>
						</div>
						<div id="beach-houses-prices-after-seller-created" style="display: none;">
							<p id="PAP-seller-created">Price After Purchase</p>
							<p id="PAP-beach-houses-after-seller-created">$500,000</p>
							<hr id="priceline-seller-created"/>
							<p id="yourprice-seller-created">Price</p>
							<p id="price-beach-houses-after-seller-created">$10,000</p>
						</div>
						<button id="beach-houses-add-to-cart-seller-created" onClick="connectWallet()" 
						style="display: block;">
						ADD TO CART</button>
						<button id="beach-houses-add-to-cart-connected-seller-created" onClick="addBeachHousesToCart()" 
						style="display: none;">
						ADD TO CART</button>
						<button id="beach-houses-added-seller-created" style="display: none;">
						ADDED</button>	
						<button id="beach-houses-collected-seller-created" style="display: none;">
						COLLECTED</button>			     	
					</div>
					<div id="colour-glass-seller-created">
					{/*<!-- Change below link after test -->*/}
						<a href="/prototype-colour-glass" target="_self" id="photo-link-seller-created">
							<img id="photo-seller-created" src="/icons&images/prototype/3.jpg"/>
						</a>
						<div id="colour-glass-prices-before-seller-created" style="display: block;">
							<p id="PAP-seller-created">Price After Purchase</p>
							<p id="PAP-colour-glass-before-seller-created">$725,000</p>
							<hr id="priceline-seller-created"/>
							<p id="yourprice-seller-created">Price</p>
							<p id="price-colour-glass-before-seller-created">$14,500</p>
						</div>
						<div id="colour-glass-prices-after-seller-created" style="display: none;">
							<p id="PAP-seller-created">Price After Purchase</p>
							<p id="PAP-colour-glass-after-seller-created">$36,250,000</p>
							<hr id="priceline-seller-created"/>
							<p id="yourprice-seller-created">Price</p>
							<p id="price-colour-glass-after-seller-created">$725,000</p>
						</div>
						<button id="colour-glass-add-to-cart-seller-created" onClick="connectWallet()"
						style="display: block;">
						ADD TO CART</button>
						<button id="colour-glass-add-to-cart-connected-seller-created" onClick="addColourGlassToCart()"
						style="display: none;">
						ADD TO CART</button>
						<button id="colour-glass-added-seller-created" style="display: none;">
						ADDED</button>		
						<button id="colour-glass-collected-seller-created" style="display: none;">
						COLLECTED</button>			     	
					</div>
					<div id="layers-seller-created">
					{/*<!-- Change below link after test -->*/}
						<a href="/prototype-layers" target="_self" id="photo-link-seller-created">
							<img id="photo-seller-created" src="/icons&images/prototype/4.jpg"/>
						</a>
						<div id="layers-prices-before-seller-created" style="display: block;">
							<p id="PAP-seller-created">Price After Purchase</p>
							<p id="PAP-layers-before-seller-created">$20,000,000</p>
							<hr id="priceline-seller-created"/>
							<p id="yourprice-seller-created">Price</p>
							<p id="price-layers-before-seller-created">$400,000</p>
						</div>
						<div id="layers-prices-after-seller-created" style="display: none;">
							<p id="PAP-seller-created">Price After Purchase</p>
							<p id="PAP-layers-after-seller-created">$1,000,000,000</p>
							<hr id="priceline-seller-created"/>
							<p id="yourprice-seller-created">Price</p>
							<p id="price-layers-after-seller-created">$20,000,000</p>
						</div>
						<button id="layers-add-to-cart-seller-created" onClick="connectWallet()"
						style="display: block;">
						ADD TO CART</button>
						<button id="layers-add-to-cart-connected-seller-created" onClick="addLayersToCart()"
						style="display: none;">
						ADD TO CART</button>	
						<button id="layers-added-seller-created" style="display: none;">
						ADDED</button>	
						<button id="layers-collected-seller-created" style="display: none;">
						COLLECTED</button>	
					</div>
					<div id="succinct-drop-seller-created">
					{/*<!-- Change below link after test -->*/}
						<a href="/prototype-succinct-drop" target="_self" id="photo-link-seller-created">
							<img id="photo-seller-created" src="/icons&images/prototype/5.jpg"/>
						</a>
						<div id="succinct-drop-prices-before-seller-created" style="display: block;">
							<p id="PAP-seller-created">Price After Purchase</p>
							<p id="PAP-succinct-drop-before-seller-created">$5,000</p>
							<hr id="priceline-seller-created"/>
							<p id="yourprice-seller-created">Price</p>
							<p id="price-succinct-drop-before-seller-created">$100</p>
						</div>
						<div id="succinct-drop-prices-after-seller-created" style="display: none;">
							<p id="PAP-seller-created">Price After Purchase</p>
							<p id="PAP-succinct-drop-after-seller-created">$250,000</p>
							<hr id="priceline-seller-created"/>
							<p id="yourprice-seller-created">Price</p>
							<p id="price-succinct-drop-after-seller-created">$5,000</p>
						</div>
						<button id="succinct-drop-add-to-cart-seller-created" onClick="connectWallet()"
						style="display: block;">
						ADD TO CART</button>
						<button id="succinct-drop-add-to-cart-connected-seller-created" onClick="addSuccinctDropToCart()"
						style="display: none;">
						ADD TO CART</button>
						<button id="succinct-drop-added-seller-created" style="display: none;">
						ADDED</button>	
						<button id="succinct-drop-collected-seller-created" style="display: none;">
						COLLECTED</button>				     	
					</div>
					<div id="paint-rain-seller-created">
					{/*<!-- Change below link after test -->*/}
						<a href="/prototype-paint-rain" target="_self" id="photo-link-seller-created">
							<img id="photo-seller-created" src="/icons&images/prototype/6.jpg"/>
						</a>
						<div id="paint-rain-prices-before-seller-created" style="display: block;">
							<p id="PAP-seller-created">Price After Purchase</p>
							<p id="PAP-paint-rain-before-seller-created">$600,000</p>
							<hr id="priceline-seller-created"/>
							<p id="yourprice-seller-created">Price</p>
							<p id="price-paint-rain-before-seller-created">$12,000</p>
						</div>
						<div id="paint-rain-prices-after-seller-created" style="display: none;">
							<p id="PAP-seller-created">Price After Purchase</p>
							<p id="PAP-paint-rain-after-seller-created">$30,000,000</p>
							<hr id="priceline-seller-created"/>
							<p id="yourprice-seller-created">Price</p>
							<p id="price-paint-rain-after-seller-created">$600,000</p>
						</div>
						<button id="paint-rain-add-to-cart-seller-created" onClick="connectWallet()"
						style="display: block;">
						ADD TO CART</button>
						<button id="paint-rain-add-to-cart-connected-seller-created" onClick="addPaintRainToCart()"
						style="display: none;">
						ADD TO CART</button>
						<button id="paint-rain-added-seller-created" style="display: none;">
						ADDED</button>	
						<button id="paint-rain-collected-seller-created" style="display: none;">
						COLLECTED</button>				     	
					</div>
			</div>
				<p id="prototype">PROTOTYPE</p>
		</div>			
		     
        </>
    );
}

export default prototypeSellerCreated;