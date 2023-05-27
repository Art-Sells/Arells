<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
	<head>
		<meta name="robots" content="noimageindex"/>	
		
				<!-- Change below links after test -->
		<link rel="stylesheet" type="text/css" href="css/prototype/images/paint-rain.css">	
		<link rel="stylesheet" type="text/css" href="css/prototype/modals/copiedlink.css" />	
		<link rel="stylesheet" type="text/css" href="css/prototype/modals/connect-wallet.css" />
		<link rel="stylesheet" type="text/css" href="css/prototype/modals/coming-soon.css" />
			
				<meta http-equiv="X-UA-Compatible" content="IE=edge">	
		<meta http-equiv="Content-type" content="text/html; charset=UTF-8">
		<meta charset="UTF-8">
		
<!-- Below information for social media sharing and search-engine/browser optimization -->		
		<meta name="title" content="Paint Rain Prototype Test">
		<meta name="description" content="Prototype Paint Rain Test">
		<meta name="google" content="nositelinkssearchbox">
		<meta name="keywords" content="Arells">
		<meta name="author" content="Arells">
		<meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" >
	
		<link rel="icon" type="image/x-icon" href="/icons&images/Arells-Ico.ico" sizes="156x156">
				<!-- Change below link after test -->
		<link rel="canonical" href="https://arells.com/prototype-paint-rain">
		
		<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">	
		<meta property="og:site_name" content="Arells">	
		<meta property="og:type" content="object">				
		<meta property="og:title" content="Paint Rain Prototype Test">
				<!-- Change below link after test -->
		<meta propety="og:url" content="https://arells.com/prototype-paint-rain">
		<meta property="og:description" content="Prototype Paint Rain Test">
		<meta property="og:image:type" content="image/jpg">
		<meta property="og:image:width" content="700">
		<meta property="og:image:height" content="400">
		
		<meta name="twitter:title" content="Paint Rain Prototype Test">
		<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">
				<!-- Change below link after test -->
		<meta name="twitter:url" content="https://arells.com/prototype-paint-rain">
		<meta name="twitter:card" content="summary_large_image">
		<meta name="twitter:description" content="Prototype Paint Rain Test">
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
			
			document.getElementById('cart-link-paint-rain').style.display = "none";
			document.getElementById('wallet-connected-div-paint-rain').style.display = "block";
			
			document.getElementById('cart-link-connected-paint-rain').style.display = "inline-block";
			
			document.getElementById('paint-rain-add-to-cart-paint-rain').style.display = "none";
			document.getElementById('paint-rain-add-to-cart-connected-paint-rain').style.display = "block";
		
			sessionStorage.setItem('walletConnectedSession', 'true'); 
		}	
		
		const walletConnectedSession = sessionStorage.getItem('walletConnectedSession');
		
		function walletConnectedLoader() {	
		    
			//Add To Cart Functions
		    if (walletConnectedSession === 'true') {				
				document.getElementById('cart-link-paint-rain').style.display = "none";
				document.getElementById('cart-link-connected-paint-rain').style.display = "inline-block";
				
				document.getElementById('wallet-connected-div-paint-rain').style.display = "block";
				
				document.getElementById('paint-rain-add-to-cart-paint-rain').style.display = "none";
				document.getElementById('paint-rain-add-to-cart-connected-paint-rain').style.display = "block";
		 	}	
		}
		document.addEventListener('DOMContentLoaded', walletConnectedLoader);	
		
<!-- Connect Wallet script above-->


<!--  Add To Cart script below-->

		function addPaintRainToCart() {
			document.getElementById('paint-rain-add-to-cart-connected-paint-rain').style.display = "none";
			document.getElementById('paint-rain-added-paint-rain').style.display = "block";
			
			document.getElementById('cart-link-connected-paint-rain').style.display = "none";
			document.getElementById('cart-link-full-paint-rain').style.display = "inline-block";			
			
			//cart functions
			sessionStorage.setItem('paintRainAdded', 'true');
		}

<!--  Add To Cart script up-->	

<!-- Added/Completed-Purchase script/s down-->

		const paintRainPurchased = sessionStorage.getItem('paintRainPurchased');
		
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
				document.getElementById('cart-link-connected-paint-rain').style.display = "none";
				document.getElementById('cart-link-full-paint-rain').style.display = "inline-block";		
		 	}	
		}
		document.addEventListener('DOMContentLoaded', itemsAddedLoader);		
		
		function paintRainFunc() {
		    if (paintRainAdded === 'true') {
				document.getElementById('paint-rain-add-to-cart-paint-rain').style.display = "none";
		 		document.getElementById('paint-rain-add-to-cart-connected-paint-rain').style.display = "none";
		 		document.getElementById('paint-rain-added-paint-rain').style.display = "block";
		 		 		
		 	}
		    if (paintRainPurchased === 'true') {	
		    	document.getElementById('paint-rain-prices-before-paint-rain').style.display = "none";
		    	document.getElementById('paint-rain-prices-after-paint-rain').style.display = "block";
		    	
		    	document.getElementById('owned-by-creator-paint-rain').style.display = "none";
		    	document.getElementById('owned-by-buyer-paint-rain').style.display = "block";
			
				document.getElementById('paint-rain-add-to-cart-connected-paint-rain').style.display = "none";
				document.getElementById('paint-rain-add-to-cart-paint-rain').style.display = "none";
				document.getElementById('paint-rain-added-paint-rain').style.display = "none";
				document.getElementById('paint-rain-collected-paint-rain').style.display = "block";
				
		    }
		}
		document.addEventListener('DOMContentLoaded', paintRainFunc);	

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

	<div id="header-paint-rain">
	
	<!-- Change below link after test -->
		<a id="icon-link-paint-rain" href="/test">
			<img id="arells-icon-paint-rain" src="/icons&images/prototype/Arells-Icon-Home.png"/>
		</a>		
		<button id="cart-link-paint-rain" onClick="connectWallet()" style="display: inline-block;">
			<img id="cart-icon-paint-rain" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</button>
		<a id="cart-link-connected-paint-rain" href="/prototype-cart-test" style="display: none;">
			<img id="cart-icon-paint-rain" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</a>
		<a id="cart-link-full-paint-rain" href="/prototype-cart-test" style="display: none;">
			<img id="cart-icon-full-paint-rain" src="/icons&images/prototype/shopping-cart-full.png"/>
		</a>			
	</div>
	<img id="word-logo-paint-rain" src="/icons&images/Arells-Logo-Ebony.png">	
	<p id="slogan-paint-rain">ART SELLS</p>
	<div id="wallet-connected-div-paint-rain" style="display: none;">
		<hr id="connected-line-paint-rain">
		<p id="wallet-connected-paint-rain" >
		WALLET CONNECTED</p>
		<hr id="connected-line-paint-rain">
	</div>

  	<div id="paint-rain">
  		<img id="photo-paint-rain" src="/icons&images/prototype/6.jpg"/>
  		<h3 id="name-paint-rain">Paint Rain</h3> 
  		<div id="share-div">
			<p id="share-div-desc">SHARE</p>		
	  		<button id="copy-link-paint-rain"
			onClick="copyLink()">
				<img id="copy-link-icon-paint-rain" src="/icons&images/prototype/link.png"/>
				COPY LINK
			</button>	
		</div>
     	<div id="created-by-paint-rain">
     		<p id="creator-owner-desc-paint-rain">Created By</p>
     		<a id="creator-owner-link-paint-rain" href="/prototype-seller-created-test">
     			Abstract Kadabra
     		</a>
     	</div>
     	<div id="owned-by-creator-paint-rain" style="display: block;">
     		<p id="creator-owner-desc-paint-rain">Owned By</p> 
     		<a id="creator-owner-link-paint-rain" href="/prototype-seller-created-test">
     			Abstract Kadabra</a>
     	</div>
     	<div id="owned-by-buyer-paint-rain" style="display: none;">
     		<p id="creator-owner-desc-paint-rain">Owned By</p> 
     		<a id="creator-owner-link-paint-rain" href="/prototype-buyer-collected-test">
     			0x71C7656E...
     		</a>
     	</div>
     	<hr id="line-paint-rain">
		<div id="paint-rain-prices-before-paint-rain" style="display: block;">
	  		<p id="PAP-paint-rain">Price After Purchase</p>
	  		<p id="PAP-paint-rain-before-paint-rain">$600,000</p>
	  		<hr id="priceline-paint-rain">
	  		<p id="yourprice-paint-rain">Price</p>
	     	<p id="price-paint-rain-before-paint-rain">$12,000</p>
     	</div>
     	<div id="paint-rain-prices-after-paint-rain" style="display: none;">
	  		<p id="PAP-paint-rain">Price After Purchase</p>
	  		<p id="PAP-paint-rain-after-paint-rain">$30,000,000</p>
	  		<hr id="priceline-paint-rain">
	  		<p id="yourprice-paint-rain">Price</p>
	     	<p id="price-paint-rain-after-paint-rain">$600,000</p>
     	</div>
    	<button id="paint-rain-add-to-cart-paint-rain" onClick="connectWallet()"
    		style="display: block;">
    		ADD TO CART</button>
    	<button id="paint-rain-add-to-cart-connected-paint-rain" onClick="addPaintRainToCart()"
    		style="display: none;">
    		ADD TO CART</button>
    	<button id="paint-rain-added-paint-rain" style="display: none;">
    		ADDED</button>	
    	<button id="paint-rain-collected-paint-rain" style="display: none;">
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