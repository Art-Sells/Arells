<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
	<head>
	<meta name="robots" content="noimageindex"/>
		
				<!-- Change below links after test -->
		<link rel="stylesheet" type="text/css" href="css/prototype/images/beach-houses.css">	
		<link rel="stylesheet" type="text/css" href="css/prototype/modals/copiedlink.css" />	
		<link rel="stylesheet" type="text/css" href="css/prototype/modals/connect-wallet.css" />
		<link rel="stylesheet" type="text/css" href="css/prototype/modals/coming-soon.css" />
			
				<meta http-equiv="X-UA-Compatible" content="IE=edge">	
		<meta http-equiv="Content-type" content="text/html; charset=UTF-8">
		<meta charset="UTF-8">
		
<!-- Below information for social media sharing and search-engine/browser optimization -->		
		<meta name="title" content="Beach Houses Prototype Test">
		<meta name="description" content="Prototype Beach Houses Test">
		<meta name="google" content="nositelinkssearchbox">
		<meta name="keywords" content="Arells">
		<meta name="author" content="Arells">
		<meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" >
	
		<link rel="icon" type="image/x-icon" href="/icons&images/Arells-Ico.ico" sizes="156x156">
				<!-- Change below link after test -->
		<link rel="canonical" href="https://arells.com/prototype-beach-houses">
		
		<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">	
		<meta property="og:site_name" content="Arells">	
		<meta property="og:type" content="website">				
		<meta property="og:title" content="Beach Houses Prototype Test">
				<!-- Change below link after test -->
		<meta propety="og:url" content="https://arells.com/prototype-beach-houses">
		<meta property="og:description" content="Prototype Beach Houses Test">
		<meta property="og:image:type" content="image/jpg">
		<meta property="og:image:width" content="700">
		<meta property="og:image:height" content="400">
		
		<meta name="twitter:title" content="Beach Houses Prototype Test">
		<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">
				<!-- Change below link after test -->
		<meta name="twitter:url" content="https://arells.com/prototype-beach-houses">
		<meta name="twitter:card" content="summary_large_image">
		<meta name="twitter:description" content="Prototype Beach Houses Test">
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
			
			
			function comingSoon() {
				  document.getElementById('comingSoon').style.display = "block";			
				  
			}	
			function closeComingSoon() {
				document.getElementById('comingSoon').style.display = "none";
			}	
<!-- Modal script above-->	



<!-- Connect Wallet script below-->
	function connectWallet() {
		document.getElementById('connectWalletBuy').style.display = "block";			
		  
	}	
	function walletConnected() {
		document.getElementById('connectWalletBuy').style.display = "none";
		
		document.getElementById('cart-link-beach-houses').style.display = "none";
		document.getElementById('wallet-connected-div-beach-houses').style.display = "block";
		
		document.getElementById('cart-link-connected-beach-houses').style.display = "inline-block";
		
		document.getElementById('beach-houses-add-to-cart-beach-houses').style.display = "none";
		document.getElementById('beach-houses-add-to-cart-connected-beach-houses').style.display = "block";

		sessionStorage.setItem('walletConnectedSession', 'true'); 
	}	
	
	const walletConnectedSession = sessionStorage.getItem('walletConnectedSession');
	
	function walletConnectedLoader() {	
	    
		//Add To Cart Functions
	    if (walletConnectedSession === 'true') {
			
			document.getElementById('cart-link-beach-houses').style.display = "none";		
			document.getElementById('cart-link-connected-beach-houses').style.display = "inline-block";
			
			document.getElementById('wallet-connected-div-beach-houses').style.display = "block";			
			
			document.getElementById('beach-houses-add-to-cart-beach-houses').style.display = "none";
			document.getElementById('beach-houses-add-to-cart-connected-beach-houses').style.display = "block";
	 	}	
	}
	document.addEventListener('DOMContentLoaded', walletConnectedLoader);		
<!-- Connect Wallet script above-->


<!--  Add To Cart script below-->

		function addBeachHousesToCart() {
			document.getElementById('beach-houses-add-to-cart-connected-beach-houses').style.display = "none";
			document.getElementById('beach-houses-added-beach-houses').style.display = "block";
			
			document.getElementById('cart-link-connected-beach-houses').style.display = "none";			
			document.getElementById('cart-link-full-beach-houses').style.display = "inline-block";			
			
			//cart functions
			sessionStorage.setItem('beachHousesAdded', 'true');
		}

<!--  Add To Cart script up-->	

<!-- Added/Completed-Purchase script/s down-->

	    const beachHousesPurchased = sessionStorage.getItem('beachHousesPurchased');
	    
		const blueOrangeAdded = sessionStorage.getItem('blueOrangeAdded');
		const beachHousesAdded = sessionStorage.getItem('beachHousesAdded');
		const colourGlassAdded = sessionStorage.getItem('colourGlassAdded');
		const layersAdded = sessionStorage.getItem('layersAdded');
		const paintRainAdded = sessionStorage.getItem('paintRainAdded');
		const succinctDropAdded = sessionStorage.getItem('succinctDropAdded');
		
		function itemsAddedLoader() {	
			//Add To Cart Functions
		    if (blueOrangeAdded === 'true' || beachHousesAdded === 'true'
		    	|| colourGlassAdded === 'true' || layersAdded === 'true'
		    	|| paintRainAdded === 'true' || succinctDropAdded == 'true') {    	
				document.getElementById('cart-link-connected-beach-houses').style.display = "none";
				document.getElementById('cart-link-full-beach-houses').style.display = "inline-block";		
		 	}	
		}
		document.addEventListener('DOMContentLoaded', itemsAddedLoader);		    
	    
		function beachHousesLoader() {
		    if (beachHousesAdded === 'true') {
				document.getElementById('beach-houses-add-to-cart-beach-houses').style.display = "none";
		 		document.getElementById('beach-houses-add-to-cart-connected-beach-houses').style.display = "none";
		 		document.getElementById('beach-houses-added-beach-houses').style.display = "block";
		 		 		
		 	}
		    if (beachHousesPurchased === 'true') {
		    	document.getElementById('beach-houses-prices-before-beach-houses').style.display = "none";
		    	document.getElementById('beach-houses-prices-after-beach-houses').style.display = "block";
		    	
		    	document.getElementById('owned-by-creator-beach-houses').style.display = "none";
		    	document.getElementById('owned-by-buyer-beach-houses').style.display = "block";
			
				document.getElementById('beach-houses-add-to-cart-connected-beach-houses').style.display = "none";
				document.getElementById('beach-houses-add-to-cart-beach-houses').style.display = "none";
				document.getElementById('beach-houses-added-beach-houses').style.display = "none";
				document.getElementById('beach-houses-collected-beach-houses').style.display = "block";
				
		    }
		}
		document.addEventListener('DOMContentLoaded', beachHousesLoader);	

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
		
		<div id="comingSoon" style="display: none;">
		  <div class="modal-content">
			<p>COMING SOON</p>
	    	<button class="close"
		    	onClick="closeComingSoon()">OK</button>	
		  </div>
		</div>			
	<!-- Modal/s above -->	

	<div id="header-beach-houses">
	
	<!-- Change below link after test -->
		<a id="icon-link-beach-houses" href="/test">
			<img id="arells-icon-beach-houses" src="/icons&images/prototype/Arells-Icon-Home.png"/>
		</a>		
		<button id="cart-link-beach-houses" onClick="connectWallet()" style="display: inline-block;">
			<img id="cart-icon-beach-houses" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</button>
		<a id="cart-link-connected-beach-houses" href="/prototype-cart-test" style="display: none;">
			<img id="cart-icon-beach-houses" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</a>
		<a id="cart-link-full-beach-houses" href="/prototype-cart-test" style="display: none;">
			<img id="cart-icon-full-beach-houses" src="/icons&images/prototype/shopping-cart-full.png"/>
		</a>	
	</div>
	<img id="word-logo-beach-houses" src="/icons&images/Arells-Logo-Ebony.png">	
	<p id="slogan-beach-houses">ART SELLS</p>
	<div id="wallet-connected-div-beach-houses" style="display: none;">
		<hr id="connected-line-beach-houses">
		<p id="wallet-connected-beach-houses" >
		WALLET CONNECTED</p>
		<hr id="connected-line-beach-houses">
	</div>

  	<div id="beach-houses">
  		<img id="photo-beach-houses" src="/icons&images/prototype/2.jpg"/>
  		<h3 id="name-beach-houses">Beach Houses</h3> 
  		<div id="share-div">
			<p id="share-div-desc">SHARE</p>
	  		<button id="copy-link-beach-houses"
			onClick="copyLink()">
				<img id="copy-link-icon-beach-houses" src="/icons&images/prototype/link.png"/>
				COPY LINK
			</button>	
		</div>
     	<div id="created-by-beach-houses">
     		<p id="creator-owner-desc-beach-houses">Created By</p>
     		<a id="creator-owner-link-beach-houses" href="/prototype-seller-created-test">
     			Abstract Kadabra
     		</a>
     	</div>
     	<div id="owned-by-creator-beach-houses" style="display: block;">
     		<p id="creator-owner-desc-beach-houses">Owned By</p> 
     		<a id="creator-owner-link-beach-houses" href="/prototype-seller-created-test">
     			Abstract Kadabra</a>
     	</div>
     	<div id="owned-by-buyer-beach-houses" style="display: none;">
     		<p id="creator-owner-desc-beach-houses">Owned By</p> 
     		<a id="creator-owner-link-beach-houses" href="/prototype-buyer-collected-test">
     			0x71C7656E...
     		</a>
     	</div>
     	<hr id="line-beach-houses">
		<div id="beach-houses-prices-before-beach-houses" style="display: block;">
	  		<p id="PAP-beach-houses">Price After Purchase</p>
	  		<p id="PAP-beach-houses-before-beach-houses">$10,000</p>
	  		<hr id="priceline-beach-houses">
	  		<p id="yourprice-beach-houses">Price</p>
	     	<p id="price-beach-houses-before-beach-houses">$200</p>
     	</div>
     	<div id="beach-houses-prices-after-beach-houses" style="display: none;">
	  		<p id="PAP-beach-houses">Price After Purchase</p>
	  		<p id="PAP-beach-houses-after-beach-houses">$500,000</p>
	  		<hr id="priceline-beach-houses">
	  		<p id="yourprice-beach-houses">Price</p>
	     	<p id="price-beach-houses-after-beach-houses">$10,000</p>
     	</div>
    	<button id="beach-houses-add-to-cart-beach-houses" onClick="connectWallet()"
    		style="display: block;">
    		ADD TO CART</button>
    	<button id="beach-houses-add-to-cart-connected-beach-houses" onClick="addBeachHousesToCart()"
    		style="display: none;">
    		ADD TO CART</button>
    	<button id="beach-houses-added-beach-houses" style="display: none;">
    		ADDED</button>	
    	<button id="beach-houses-collected-beach-houses" style="display: none;">
    		COLLECTED</button>				     	
    		
    	<div id="fingerprints">
    		<p id="digital-fingerprints">DIGITAL FINGERPRINTS</p>
    		<span>
		  		<button id="fingerprints-button"
				onClick="comingSoon()">
					<img id="fingerprints-icon" src="/icons&images/prototype/etherscan-logo.png"/>
				</button>	
    		</span>
    		<span>
		  		<button id="fingerprints-button"
				onClick="comingSoon()">
					<img id="fingerprints-icon" src="/icons&images/prototype/ipfs.png"/>
				</button>	
    		</span>
    		<span>
		  		<button id="fingerprints-button"
				onClick="comingSoon()">
					<img id="fingerprints-icon" src="/icons&images/prototype/ipfslite.png"/>
				</button>	
    		</span>
    	</div>	
    	
    </div>
		<p id="prototype">PROTOTYPE</p>
</body>
</html>