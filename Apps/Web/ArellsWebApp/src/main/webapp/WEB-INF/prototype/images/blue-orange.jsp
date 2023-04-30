<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
	<head>
		
				<!-- Change below links after test -->
		<link rel="stylesheet" type="text/css" href="css/prototype/images/blue-orange.css">	
		<link rel="stylesheet" type="text/css" href="css/prototype/modals/copiedlink.css" />	
		<link rel="stylesheet" type="text/css" href="css/prototype/modals/connect-wallet.css" />
		<link rel="stylesheet" type="text/css" href="css/prototype/modals/coming-soon.css" />
			
		<meta charset="UTF-8">
		
<!-- Below information for social media sharing and search-engine/browser optimization -->		
		<meta name="title" content="Arells">
		<meta name="description" content="Art Sells">
		<meta name="google" content="nositelinkssearchbox">
		<meta name="keywords" content="Arells">
		<meta name="author" content="Arells">
		<meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" >
	
		<link rel="icon" type="image/x-icon" href="/icons&images/Arells-Ico.ico" sizes="156x156">
				<!-- Change below link after test -->
		<link rel="canonical" href="https://arells.com/prototype-blue-orange">
		
		<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">	
		<meta property="og:site_name" content="Arells">	
		<meta property="og:type" content="object">				
		<meta property="og:title" content="Arells">
				<!-- Change below link after test -->
		<meta propety="og:url" content="https://arells.com/prototype-blue-orange">
		<meta property="og:description" content="Art Sells">
		<meta property="og:image:type" content="image/jpg">
		<meta property="og:image:width" content="700">
		<meta property="og:image:height" content="400">
		
		<meta name="twitter:title" content="Art Sells">
		<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">
				<!-- Change below link after test -->
		<meta name="twitter:url" content="https://arells.com/prototype-blue-orange">
		<meta name="twitter:card" content="summary_large_image">
		<meta name="twitter:description" content="Arells">
		<meta name="description" content="Arells">
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
		
		document.getElementById('cart-link-blue-orange').style.display = "none";
		document.getElementById('cart-link-connected-blue-orange').style.display = "inline-block";
		
		document.getElementById('wallet-connected-div-blue-orange').style.display = "block";
				
		
		document.getElementById('blue-orange-add-to-cart-blue-orange').style.display = "none";
		document.getElementById('blue-orange-add-to-cart-connected-blue-orange').style.display = "block";

		sessionStorage.setItem('walletConnectedSession', 'true'); 
	}	
	
	const walletConnectedSession = sessionStorage.getItem('walletConnectedSession');
	
	function walletConnectedLoader() {	
	    
		//Add To Cart Functions
	    if (walletConnectedSession === 'true') {			
			document.getElementById('cart-link-blue-orange').style.display = "none";
			document.getElementById('cart-link-connected-blue-orange').style.display = "inline-block";
			
			document.getElementById('wallet-connected-div-blue-orange').style.display = "block";			
			
			document.getElementById('blue-orange-add-to-cart-blue-orange').style.display = "none";
			document.getElementById('blue-orange-add-to-cart-connected-blue-orange').style.display = "block";
	 	}	
	}
	document.addEventListener('DOMContentLoaded', walletConnectedLoader);	
<!-- Connect Wallet script above-->


<!--  Add To Cart script below-->

		function addBlueOrangeToCart() {
			document.getElementById('blue-orange-add-to-cart-connected-blue-orange').style.display = "none";
			document.getElementById('blue-orange-added-blue-orange').style.display = "block";
			
			document.getElementById('cart-link-connected-blue-orange').style.display = "none";			
			document.getElementById('cart-link-full-blue-orange').style.display = "inline-block";
			
			//cart functions
			sessionStorage.setItem('blueOrangeAdded', 'true');
		}
	
<!--  Add To Cart script up-->	

<!-- Added/Completed-Purchase script/s down-->

	    const blueOrangePurchased = sessionStorage.getItem('blueOrangePurchased');
	    
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
				document.getElementById('cart-link-connected-blue-orange').style.display = "none";
				document.getElementById('cart-link-full-blue-orange').style.display = "inline-block";		
		 	}	
		}
		document.addEventListener('DOMContentLoaded', itemsAddedLoader);		
		
		function blueOrangeFunc() {
		    if (blueOrangeAdded === 'true') {
				document.getElementById('blue-orange-add-to-cart-blue-orange').style.display = "none";
		 		document.getElementById('blue-orange-add-to-cart-connected-blue-orange').style.display = "none";
		 		document.getElementById('blue-orange-added-blue-orange').style.display = "block";
		 		 		
		 	}
		    if (blueOrangePurchased === 'true') {	
		    	document.getElementById('blue-orange-prices-before-blue-orange').style.display = "none";
		    	document.getElementById('blue-orange-prices-after-blue-orange').style.display = "block";
		    	
		    	document.getElementById('owned-by-creator-blue-orange').style.display = "none";
		    	document.getElementById('owned-by-buyer-blue-orange').style.display = "block";
			
				document.getElementById('blue-orange-add-to-cart-connected-blue-orange').style.display = "none";
				document.getElementById('blue-orange-add-to-cart-blue-orange').style.display = "none";
				document.getElementById('blue-orange-added-blue-orange').style.display = "none";
				document.getElementById('blue-orange-collected-blue-orange').style.display = "block";
				
		    }
		}
		document.addEventListener('DOMContentLoaded', blueOrangeFunc);	

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

	<div id="header-blue-orange">
	
	<!-- Change below link after test -->
		<a id="icon-link-blue-orange" href="/">
			<img id="arells-icon-blue-orange" src="/icons&images/prototype/Arells-Icon-Home.png"/>
		</a>		
		<button id="cart-link-blue-orange" onClick="connectWallet()" style="display: inline-block;">
			<img id="cart-icon-blue-orange" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</button>
		<a id="cart-link-connected-blue-orange" href="/prototype-cart" style="display: none;">
			<img id="cart-icon-blue-orange" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</a>	
		<a id="cart-link-full-blue-orange" href="/prototype-cart" style="display: none;">
			<img id="cart-icon-full-blue-orange" src="/icons&images/prototype/shopping-cart-full.png"/>
		</a>
	</div>
	<img id="word-logo-blue-orange" src="/icons&images/Arells-Logo-Ebony.png">	
	<p id="slogan-blue-orange">ART SELLS</p>
	<div id="wallet-connected-div-blue-orange" style="display: none;">
		<hr id="connected-line-blue-orange">
		<p id="wallet-connected-blue-orange" >
		WALLET CONNECTED</p>
		<hr id="connected-line-blue-orange">
	</div>

  	<div id="blue-orange">
  		<img id="photo-blue-orange" src="/icons&images/prototype/1.jpg"/>
  		<h3 id="name-blue-orange">Blue Orange</h3> 
  		<div id="share-div">
			<p id="share-div-desc">SHARE</p>
	  		<button id="copy-link-blue-orange"
			onClick="copyLink()">
				<img id="copy-link-icon-blue-orange" src="/icons&images/prototype/link.png"/>
				COPY LINK
			</button>	
		</div>
     	<div id="created-by-blue-orange">
     		<p id="creator-owner-desc-blue-orange">Created By</p>
     		<a id="creator-owner-link-blue-orange" href="/prototype-seller-created-test">
     			Abstract Kadabra
     		</a>
     	</div>
     	<div id="owned-by-creator-blue-orange" style="display: block;">
     		<p id="creator-owner-desc-blue-orange">Owned By</p> 
     		<a id="creator-owner-link-blue-orange" href="/prototype-seller-created-test">
     			Abstract Kadabra</a>
     	</div>
     	<div id="owned-by-buyer-blue-orange" style="display: none;">
     		<p id="creator-owner-desc-blue-orange">Owned By</p> 
     		<a id="creator-owner-link-blue-orange" href="/prototype-buyer-collected-test">
     			0x71C7656E...
     		</a>
     	</div>
     	<hr id="line-blue-orange">
		<div id="blue-orange-prices-before-blue-orange" style="display: block;">
	  		<p id="PAP-blue-orange">Price After Purchase</p>
	  		<p id="PAP-blue-orange-before-blue-orange">$60,000</p>
	  		<hr id="priceline-blue-orange">
	  		<p id="yourprice-blue-orange">Price</p>
	     	<p id="price-blue-orange-before-blue-orange">$1,200</p>
  		</div>	
  		<div id="blue-orange-prices-after-blue-orange" style="display: none;">
	  		<p id="PAP-blue-orange">Price After Purchase</p>
	  		<p id="PAP-blue-orange-after-blue-orange">$3,000,000</p>
	  		<hr id="priceline-blue-orange">
	  		<p id="yourprice-blue-orange">Price</p>
	     	<p id="price-blue-orange-after-blue-orange">$60,000</p>
  		</div>	
    	<button id="blue-orange-add-to-cart-blue-orange" onClick="connectWallet()"
    		style="display: block;">
    		ADD TO CART</button>
    	<button id="blue-orange-add-to-cart-connected-blue-orange" onClick="addBlueOrangeToCart()"
    		style="display: none;">
    		ADD TO CART</button>
    	<button id="blue-orange-added-blue-orange" style="display: none;">
    		ADDED</button>	
    	<button id="blue-orange-collected-blue-orange" style="display: none;">
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