<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
	<head>
		
				<!-- Change below links after test -->
		<link rel="stylesheet" type="text/css" href="css/test/prototype/images/layers-test.css">	
		<link rel="stylesheet" type="text/css" href="css/test/prototype/modals/copiedlink-test.css" />	
		<link rel="stylesheet" type="text/css" href="css/test/prototype/modals/connect-wallet-test.css" />
			
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
		<link rel="canonical" href="https://arells.com/prototype-layers-test">
		
		<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">	
		<meta property="og:site_name" content="Arells">	
		<meta property="og:type" content="object">				
		<meta property="og:title" content="Arells">
				<!-- Change below link after test -->
		<meta propety="og:url" content="https://arells.com/prototype-layers-test">
		<meta property="og:description" content="Art Sells">
		<meta property="og:image:type" content="image/jpg">
		<meta property="og:image:width" content="700">
		<meta property="og:image:height" content="400">
		
		<meta name="twitter:title" content="Art Sells">
		<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">
				<!-- Change below link after test -->
		<meta name="twitter:url" content="https://arells.com/prototype-layers-test">
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
<!-- Modal script above-->	



<!-- Connect Wallet script below-->
			function connectWallet() {
				document.getElementById('connectWalletBuy').style.display = "block";			
				  
			}	
			function walletConnected() {
				document.getElementById('connectWalletBuy').style.display = "none";
				
				document.getElementById('cart-link-layers').style.display = "none";
				document.getElementById('wallet-connected-div-layers').style.display = "block";
				
				document.getElementById('cart-link-connected-layers').style.display = "inline-block";
				
				document.getElementById('colour-glass-add-to-cart-layers').style.display = "none";
				document.getElementById('colour-glass-add-to-cart-connected-layers').style.display = "block";
			
				sessionStorage.setItem('walletConnectedSession', 'true'); 
			}	
			
			const walletConnectedSession = sessionStorage.getItem('walletConnectedSession');
			
			function walletConnectedLoader() {	
			    
				//Add To Cart Functions
			    if (walletConnectedSession === 'true') {				
					document.getElementById('cart-link-layers').style.display = "none";
					document.getElementById('cart-link-connected-layers').style.display = "inline-block";
					
					document.getElementById('wallet-connected-div-layers').style.display = "block";
					
					document.getElementById('colour-glass-add-to-cart-layers').style.display = "none";
					document.getElementById('colour-glass-add-to-cart-connected-layers').style.display = "block";
			 	}	
			}
			document.addEventListener('DOMContentLoaded', walletConnectedLoader);	
<!-- Connect Wallet script above-->


<!--  Add To Cart script below-->

			function addLayersToCart() {
				document.getElementById('layers-add-to-cart-connected-layers').style.display = "none";
				document.getElementById('layers-glass-added-layers').style.display = "block";
				
				//cart functions
				sessionStorage.setItem('layersAdded', 'true');
			}
	
<!--  Add To Cart script up-->	

<!-- Added/Completed-Purchase script/s down-->

			const layersPurchased = sessionStorage.getItem('layersPurchased');
			
			const blueOrangeAdded = sessionStorage.getItem('blueOrangeAdded');
			const beachHousesAdded = sessionStorage.getItem('beachHousesAdded');
			const colourGlassAdded = sessionStorage.getItem('colourGlassAdded');
			const layersAdded = sessionStorage.getItem('layersAdded');
			
			function itemsAddedLoader() {	
				//Add To Cart Functions
			    if (blueOrangeAdded === 'true' || beachHousesAdded === 'true'
			    	|| colourGlassAdded === 'true' || layersAdded === 'true') {    	
					document.getElementById('cart-link-connected-layers').style.display = "none";
					document.getElementById('cart-link-full-layers').style.display = "inline-block";		
			 	}	
			}
			document.addEventListener('DOMContentLoaded', itemsAddedLoader);	
			
			function layersFunc() {
			    if (layersAdded === 'true') {
					document.getElementById('layers-add-to-cart-layers').style.display = "none";
			 		document.getElementById('layers-add-to-cart-connected-layers').style.display = "none";
			 		document.getElementById('layers-added-layers').style.display = "block";
			 		 		
			 	}
			    if (colourGlassPurchased === 'true') {	
			    	document.getElementById('layers-prices-before-layers').style.display = "none";
			    	document.getElementById('layers-prices-after-layers').style.display = "block";
			    	
			    	document.getElementById('owned-by-creator-layers').style.display = "none";
			    	document.getElementById('owned-by-buyer-layers').style.display = "block";
				
					document.getElementById('layers-add-to-cart-connected-layers').style.display = "none";
					document.getElementById('layers-add-to-cart-layers').style.display = "none";
					document.getElementById('layers-added-layers').style.display = "none";
					document.getElementById('layers-collected-layers').style.display = "block";
					
			    }
			}
			document.addEventListener('DOMContentLoaded', layersFunc);	

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

	<div id="header-layers">
	
	<!-- Change below link after test -->
		<a id="icon-link-layers" href="/test">
			<img id="arells-icon-layers" src="/icons&images/prototype/Arells-Icon-Home.png"/>
		</a>		
		<button id="cart-link-layers" onClick="connectWallet()" style="display: inline-block;">
			<img id="cart-icon-layers" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</button>
		<a id="cart-link-connected-layers" href="/prototype-cart-test" style="display: none;">
			<img id="cart-icon-layers" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</a>	
		<a id="cart-link-full-layers" href="/prototype-cart-test" style="display: none;">
			<img id="cart-icon-full-layers" src="/icons&images/prototype/shopping-cart-full.png"/>
		</a>
	</div>
	<img id="word-logo-layers" src="/icons&images/Arells-Logo-Ebony.png">	
	<p id="slogan-layers">ART SELLS</p>
	<div id="wallet-connected-div-layers" style="display: none;">
		<hr id="connected-line-layers">
		<p id="wallet-connected" >
		WALLET CONNECTED</p>
		<hr id="connected-line-layers">
	</div>

  	<div id="layers">
  		<img id="photo-layers" src="/icons&images/prototype/4.jpg"/>
  		<h3 id="name-layers">Layers</h3> 
  		<button id="copy-link-layers"
		onClick="copyLink()">
			<img id="copy-link-icon-layers" src="/icons&images/prototype/link.png"/>
			COPY LINK
		</button>	
     	<div id="created-by-layers">
     		<p id="creator-owner-desc-layers">Created By</p>
     		<a id="creator-owner-link-layers" href="/prototype-seller-created-test">
     			Abstract Kadabra
     		</a>
     	</div>
     	<div id="owned-by-creator-layers" style="display: block;">
     		<p id="creator-owner-desc-layers">Owned By</p> 
     		<a id="creator-owner-link-layers" href="/prototype-seller-created-test">
     			Abstract Kadabra</a>
     	</div>
     	<div id="owned-by-buyer-layers" style="display: none;">
     		<p id="creator-owner-desc-layers">Owned By</p> 
     		<a id="creator-owner-link-layers" href="/prototype-buyer-collected-test">
     			0x71C7656E...
     		</a>
     	</div>
     	<hr id="line-layers">
		<div id="layers-prices-before-layers" style="display: block;">
	  		<p id="PAP-layers">Price After Purchase</p>
	  		<p id="PAP-layers-before-layers">$20,000,000</p>
	  		<hr id="priceline-layers">
	  		<p id="yourprice-layers">Price</p>
	     	<p id="price-layers-before-layers">$400,000</p>
     	</div>
     	<div id="layers-prices-after-layers" style="display: none;">
	  		<p id="PAP-layers">Price After Purchase</p>
	  		<p id="PAP-layers-after-layers">$1,000,000,000</p>
	  		<hr id="priceline-layers">
	  		<p id="yourprice-layers">Price</p>
	     	<p id="price-layers-after-layers">$20,000,000</p>
     	</div>
    	<button id="layers-add-to-cart-layers" onClick="connectWallet()"
    		style="display: block;">
    		ADD TO CART</button>
    	<button id="layers-add-to-cart-connected-layers" onClick="addLayersToCart()"
    		style="display: none;">
    		ADD TO CART</button>
    	<button id="layers-added-layers" style="display: none;">
    		ADDED</button>	
    	<button id="layers-collected-layers" style="display: none;">
    		COLLECTED</button>				     	
    </div>

</body>
</html>