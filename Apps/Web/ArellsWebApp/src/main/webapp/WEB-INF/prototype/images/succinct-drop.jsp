<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
	<head>
		
				<!-- Change below links after test -->
		<link rel="stylesheet" type="text/css" href="css/prototype/images/succinct-drop.css">	
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
		<link rel="canonical" href="https://arells.com/prototype-succinct-drop">
		
		<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">	
		<meta property="og:site_name" content="Arells">	
		<meta property="og:type" content="object">				
		<meta property="og:title" content="Arells">
				<!-- Change below link after test -->
		<meta propety="og:url" content="https://arells.com/prototype-succinct-drop">
		<meta property="og:description" content="Art Sells">
		<meta property="og:image:type" content="image/jpg">
		<meta property="og:image:width" content="700">
		<meta property="og:image:height" content="400">
		
		<meta name="twitter:title" content="Art Sells">
		<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">
				<!-- Change below link after test -->
		<meta name="twitter:url" content="https://arells.com/prototype-succinct-drop">
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
			
			document.getElementById('cart-link-succinct-drop').style.display = "none";
			document.getElementById('wallet-connected-div-succinct-drop').style.display = "block";
			
			document.getElementById('cart-link-connected-succinct-drop').style.display = "inline-block";
			
			document.getElementById('succinct-drop-add-to-cart-succinct-drop').style.display = "none";
			document.getElementById('succinct-drop-add-to-cart-connected-succinct-drop').style.display = "block";
		
			sessionStorage.setItem('walletConnectedSession', 'true'); 
		}	
		
		const walletConnectedSession = sessionStorage.getItem('walletConnectedSession');
		
		function walletConnectedLoader() {	
		    
			//Add To Cart Functions
		    if (walletConnectedSession === 'true') {				
				document.getElementById('cart-link-succinct-drop').style.display = "none";
				document.getElementById('cart-link-connected-succinct-drop').style.display = "inline-block";
				
				document.getElementById('wallet-connected-div-succinct-drop').style.display = "block";
				
				document.getElementById('succinct-drop-add-to-cart-succinct-drop').style.display = "none";
				document.getElementById('succinct-drop-add-to-cart-connected-succinct-drop').style.display = "block";
		 	}	
		}
		document.addEventListener('DOMContentLoaded', walletConnectedLoader);	

<!-- Connect Wallet script above-->


<!--  Add To Cart script below-->

		function addSuccinctDropToCart() {
			document.getElementById('succinct-drop-add-to-cart-connected-succinct-drop').style.display = "none";
			document.getElementById('succinct-drop-added-succinct-drop').style.display = "block";
			
			document.getElementById('cart-link-connected-succinct-drop').style.display = "none";					
			document.getElementById('cart-link-full-succinct-drop').style.display = "inline-block";
			
			//cart functions
			sessionStorage.setItem('succinctDropAdded', 'true');
		}

<!--  Add To Cart script up-->	

<!-- Added/Completed-Purchase script/s down-->

		const succinctDropPurchased = sessionStorage.getItem('succinctDropPurchased');
		
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
				document.getElementById('cart-link-connected-succinct-drop').style.display = "none";
				document.getElementById('cart-link-full-succinct-drop').style.display = "inline-block";		
		 	}	
		}
		document.addEventListener('DOMContentLoaded', itemsAddedLoader);	
		
		function succinctDropFunc() {
		    if (succinctDropAdded === 'true') {
				document.getElementById('succinct-drop-add-to-cart-succinct-drop').style.display = "none";
		 		document.getElementById('succinct-drop-add-to-cart-connected-succinct-drop').style.display = "none";
		 		document.getElementById('succinct-drop-added-succinct-drop').style.display = "block";
		 		 		
		 	}
		    if (succinctDropPurchased === 'true') {	
		    	document.getElementById('succinct-drop-prices-before-succinct-drop').style.display = "none";
		    	document.getElementById('succinct-drop-prices-after-succinct-drop').style.display = "block";
		    	
		    	document.getElementById('owned-by-creator-succinct-drop').style.display = "none";
		    	document.getElementById('owned-by-buyer-succinct-drop').style.display = "block";
			
				document.getElementById('succinct-drop-add-to-cart-connected-succinct-drop').style.display = "none";
				document.getElementById('succinct-drop-add-to-cart-succinct-drop').style.display = "none";
				document.getElementById('succinct-drop-added-succinct-drop').style.display = "none";
				document.getElementById('succinct-drop-collected-succinct-drop').style.display = "block";
				
		    }
		}
		document.addEventListener('DOMContentLoaded', succinctDropFunc);	

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

	<div id="header-succinct-drop">
	
	<!-- Change below link after test -->
		<a id="icon-link-succinct-drop" href="/">
			<img id="arells-icon-succinct-drop" src="/icons&images/prototype/Arells-Icon-Home.png"/>
		</a>		
		<button id="cart-link-succinct-drop" onClick="connectWallet()" style="display: inline-block;">
			<img id="cart-icon-succinct-drop" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</button>
		<a id="cart-link-connected-succinct-drop" href="/prototype-cart" style="display: none;">
			<img id="cart-icon-succinct-drop" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</a>
		<a id="cart-link-full-succinct-drop" href="/prototype-cart" style="display: none;">
			<img id="cart-icon-full-succinct-drop" src="/icons&images/prototype/shopping-cart-full.png"/>
		</a>			
	</div>
	<img id="word-logo-succinct-drop" src="/icons&images/Arells-Logo-Ebony.png">	
	<p id="slogan-succinct-drop">ART SELLS</p>
	<div id="wallet-connected-div-succinct-drop" style="display: none;">
		<hr id="connected-line-succinct-drop">
		<p id="wallet-connected-succinct-drop" >
		WALLET CONNECTED</p>
		<hr id="connected-line-succinct-drop">
	</div>

  	<div id="succinct-drop">
  		<img id="photo-succinct-drop" src="/icons&images/prototype/5.jpg"/>
  		<h3 id="name-succinct-drop">Succinct Drop</h3> 
  		<div id="share-div">
			<p id="share-div-desc">SHARE</p>
	  		<button id="copy-link-succinct-drop"
			onClick="copyLink()">
				<img id="copy-link-icon-succinct-drop" src="/icons&images/prototype/link.png"/>
				COPY LINK
			</button>
		</div>	
     	<div id="created-by-succinct-drop">
     		<p id="creator-owner-desc-succinct-drop">Created By</p>
     		<a id="creator-owner-link-succinct-drop" href="/prototype-seller-created-test">
     			Abstract Kadabra
     		</a>
     	</div>
     	<div id="owned-by-creator-succinct-drop" style="display: block;">
     		<p id="creator-owner-desc-succinct-drop">Owned By</p> 
     		<a id="creator-owner-link-succinct-drop" href="/prototype-seller-created-test">
     			Abstract Kadabra</a>
     	</div>
     	<div id="owned-by-buyer-succinct-drop" style="display: none;">
     		<p id="creator-owner-desc-succinct-drop">Owned By</p> 
     		<a id="creator-owner-link-succinct-drop" href="/prototype-buyer-collected-test">
     			0x71C7656E...
     		</a>
     	</div>
     	<hr id="line-succinct-drop">
		<div id="succinct-drop-prices-before-succinct-drop" style="display: block;">
	  		<p id="PAP-succinct-drop">Price After Purchase</p>
	  		<p id="PAP-succinct-drop-after-succinct-drop">$5,000</p>
	  		<hr id="priceline-succinct-drop">
	  		<p id="yourprice-succinct-drop">Price</p>
	     	<p id="price-succinct-drop-after-succinct-drop">$100</p>
     	</div>
     	<div id="succinct-drop-prices-after-succinct-drop" style="display: none;">
	  		<p id="PAP-succinct-drop">Price After Purchase</p>
	  		<p id="PAP-succinct-drop-before-succinct-drop">$250,000</p>
	  		<hr id="priceline-succinct-drop">
	  		<p id="yourprice-succinct-drop">Price</p>
	     	<p id="price-succinct-drop-before-succinct-drop">$5,000</p>
     	</div>
    	<button id="succinct-drop-add-to-cart-succinct-drop" onClick="connectWallet()"
    		style="display: block;">
    		ADD TO CART</button>
    	<button id="succinct-drop-add-to-cart-connected-succinct-drop" onClick="addSuccinctDropToCart()"
    		style="display: none;">
    		ADD TO CART</button>
    	<button id="succinct-drop-added-succinct-drop" style="display: none;">
    		ADDED</button>	
    	<button id="succinct-drop-collected-succinct-drop" style="display: none;">
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