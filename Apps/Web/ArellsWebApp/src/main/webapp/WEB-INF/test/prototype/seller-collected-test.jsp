<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
	<head>
	<meta name="robots" content="noimageindex"/>
		
				<!-- Change below links after test -->
		<link rel="stylesheet" type="text/css" href="css/prototype/seller-collecteds.css">	
		<link rel="stylesheet" type="text/css" href="css/prototype/modals/copiedlink.css" />	
		<link rel="stylesheet" type="text/css" href="css/prototype/modals/connect-wallet.css" />
			
		<meta http-equiv="X-UA-Compatible" content="IE=edge">	
		<meta charset="UTF-8">
		
<!-- Below information for social media sharing and search-engine/browser optimization -->		
		<meta name="title" content="Seller Collections Prototype Test">
		<meta name="description" content="Prototype for Seller Collections Test">
		<meta name="google" content="nositelinkssearchbox">
		<meta name="keywords" content="Arells">
		<meta name="author" content="Arells">
		<meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" >
	
		<link rel="icon" type="image/x-icon" href="/icons&images/Arells-Ico.ico" sizes="156x156">
				<!-- Change below link after test -->
		<link rel="canonical" href="https://arells.com/prototype-seller-collected">
		
		<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">	
		<meta property="og:site_name" content="Arells">	
		<meta property="og:type" content="website">				
		<meta property="og:title" content="Seller Collections Prototype Test">
				<!-- Change below link after test -->
		<meta property="og:url" content="https://arells.com/prototype-seller-collected">
		<meta property="og:description" content="Prototype for Seller Collections Test">
		<meta property="og:image:type" content="image/jpg">
		<meta property="og:image:width" content="700">
		<meta property="og:image:height" content="400">
		
		<meta name="twitter:title" content="Seller Collections Prototype Test">
		<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">
				<!-- Change below link after test -->
		<meta name="twitter:url" content="https://arells.com/prototype-seller-collected">
		<meta name="twitter:card" content="summary_large_image">
		<meta name="twitter:description" content="Prototype for Seller Collections Test">
<!-- Above information for social media sharing and search-engine/browser optimization -->	


		<script>

<!-- Modal script below-->
			function copyLink() {
			// Open copyLink
			  document.getElementById('copiedLink').style.display = "block";			
				
			  // Get the link to be copied
			  var link = window.location.href;

			  // Create a temporary input element to copy the link
			  var input = document.createElement('input');
			  input.setAttribute('value', link);
			  document.body.appendChild(input);

			  // Select the input element and copy the link
			  input.select();
			  document.execCommand('copy');

			  // Remove the temporary input element
			  document.body.removeChild(input);
			  
			}	
			
			
			function closeCopiedLink() {
				document.getElementById('copiedLink').style.display = "none";
			}			
<!-- Modal script above-->	



<!-- Connect Wallet script below-->

			function connectWallet() {
				document.getElementById('connectWalletBuy').style.display = "block";			
				  
			}	
			function walletConnected() {
				document.getElementById('connectWalletBuy').style.display = "none";
				
				document.getElementById('wallet-connected-div-seller-collected').style.display = "block";
				
				document.getElementById('cart-link-seller-collected').style.display = "none";
				document.getElementById('wallet-connected-div-seller-collected').style.display = "block";
				
				document.getElementById('cart-link-connected-seller-collected').style.display = "inline-block";
			 
				sessionStorage.setItem('walletConnectedSession', 'true'); 
			}	
			
			const walletConnectedSession = sessionStorage.getItem('walletConnectedSession');	
			function walletConnectedLoader() {	
			    
				//Add To Cart Functions
			    if (walletConnectedSession === 'true') {	
					document.getElementById('cart-link-seller-collected').style.display = "none";
					document.getElementById('cart-link-connected-seller-collected').style.display = "inline-block";		
					
					document.getElementById('wallet-connected-div-seller-collected').style.display = "block";
			 	}	
			}
			document.addEventListener('DOMContentLoaded', walletConnectedLoader);	
			
<!-- Connect Wallet script above-->
			
<!-- Added/Completed-Purchase script/s down-->

			const blueOrangeAdded = sessionStorage.getItem('blueOrangeAdded');
			function blueOrangeLoader() {
				//Add To Cart Functions
				if (blueOrangeAdded === 'true') {	
					document.getElementById('cart-link-connected-seller-collected').style.display = "none";
					document.getElementById('cart-link-full-seller-collected').style.display = "inline-block";
				}	
			}
			document.addEventListener('DOMContentLoaded', blueOrangeLoader);
			
			const beachHousesAdded = sessionStorage.getItem('beachHousesAdded');		
			function beachHousesLoader() {	
				//Add To Cart Functions
			    if (beachHousesAdded === 'true') {    	
					document.getElementById('cart-link-connected-seller-collected').style.display = "none";
					document.getElementById('cart-link-full-seller-collected').style.display = "inline-block"; 		
			 	}	
			}
			document.addEventListener('DOMContentLoaded', beachHousesLoader);
			
			const colourGlassAdded = sessionStorage.getItem('colourGlassAdded');
			function colourGlassLoader() {	
				//Add To Cart Functions
			    if (colourGlassesAdded === 'true') {    	
					document.getElementById('cart-link-connected-seller-collected').style.display = "none";
					document.getElementById('cart-link-full-seller-collected').style.display = "inline-block"; 		
			 	}	
			}
			document.addEventListener('DOMContentLoaded', colourGlassLoader);
			
			const layersAdded = sessionStorage.getItem('layersAdded');
			function layersLoader() {	
				//Add To Cart Functions
			    if (layersAdded === 'true') {    	
					document.getElementById('cart-link-connected-seller-collected').style.display = "none";
					document.getElementById('cart-link-full-seller-collected').style.display = "inline-block"; 		
			 	}	
			}
			document.addEventListener('DOMContentLoaded', layersLoader);
			
			const succinctDropAdded = sessionStorage.getItem('succinctDropAdded');
			function succinctDropLoader() {	
				//Add To Cart Functions
			    if (succinctDropAdded === 'true') {    	
					document.getElementById('cart-link-connected-seller-collected').style.display = "none";
					document.getElementById('cart-link-full-seller-collected').style.display = "inline-block"; 		
			 	}	
			}
			document.addEventListener('DOMContentLoaded', succinctDropLoader);
			
			const paintRainAdded = sessionStorage.getItem('paintRainAdded');
			function paintRainLoader() {	
				//Add To Cart Functions
			    if (paintRainAdded === 'true') {    	
					document.getElementById('cart-link-connected-seller-collected').style.display = "none";
					document.getElementById('cart-link-full-seller-collected').style.display = "inline-block"; 		
			 	}	
			}
			document.addEventListener('DOMContentLoaded', paintRainLoader);

<!-- Added/Completed-Purchase script/s up-->	
			
		
		</script>	
		
		

		<title>Prototype</title>
	
	</head>
	
<body>

	<!-- Modal/s below -->
	
		<div id="copiedLink" style="display: none;">
		  <div class="modal-content">
			<p>LINK COPIED</p>
	    	<button class="close"
		    	onClick="closeCopiedLink()">OK</button>	
		  </div>
		</div>	
	
		<div id="connectWalletBuy" style="display: none;">
		  <div class="connect-wallet-content">
			<p id="connect-wallet-words">CONNECT WALLET</p>
	    	<button id="connectWallet"
		    	onClick="walletConnected()">
		    	<img id="wallet-icon" src="/icons&images/prototype/coinbase-wallet-logo.png"/>
		    </button>		
		  </div>
		</div>	
	<!-- Modal/s above -->	

	<div id="header-seller-collected">
	
	<!-- Change below link after test -->
		<a id="icon-link-seller-collected" href="/test">
			<img id="arells-icon-seller-collected" src="/icons&images/prototype/Arells-Icon-Home.png"/>
		</a>		
		<button id="cart-link-seller-collected" onClick="connectWallet()" style="display: inline-block;">
			<img id="cart-icon-seller-collected" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</button>
		<a id="cart-link-connected-seller-collected" href="/prototype-cart-test" style="display: none;">
			<img id="cart-icon-seller-collected" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</a>
		<a id="cart-link-full-seller-collected" href="/prototype-cart-test" style="display: none;">
			<img id="cart-icon-full-seller-collected" src="/icons&images/prototype/shopping-cart-full.png"/>
		</a>			
	</div>
	<img id="word-logo-seller-collected" src="/icons&images/Arells-Logo-Ebony.png">	
	<p id="slogan-seller-collected">ART SELLS</p>
	<div id="wallet-connected-div-seller-collected" style="display: none;">
		<hr id="connected-line-seller-collected">
		<p id="wallet-connected-seller-collected" >
		WALLET CONNECTED</p>
		<hr id="connected-line-seller-collected">
	</div>
    <div id="profile-img-container-seller-collected">
		<img id="profile-photo-seller-collected" src="/icons&images/prototype/proto-banner.jpg">
	</div>	 
	<h1 id="name-seller-collected">Abstract Kadabra</h1>  
	<p id="description-seller-collected">Here rests life's abstractions captured in majestic endeavors.</p> 
	<div id="share-div">
		<p id="share-div-desc">SHARE</p>
		<button id="copy-link-seller-collected"
			onClick="copyLink()">
			<img id="copy-link-icon-seller-collected" src="/icons&images/prototype/link.png"/>
			COPY LINK</button>	
	</div>
	<hr id="profileline-seller-collected">
	<div id="created-collected-seller-collected">
<!-- Change below link after test -->
		<a id="created-seller-collected" href="/prototype-seller-created-test">Created</a>	
		<a id="collected-seller-collected">Collected</a>	
	</div>
	<p id="no-art-seller-collected">
		no art collected
		<img id="cart-icon-collected-seller-collected" src="/icons&images/prototype/shopping-cart-empty.png"/>
	</p>
			<p id="prototype">PROTOTYPE</p>
</body>
</html>