<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
	<head>
		
				<!-- Change below links after test -->
		<link rel="stylesheet" type="text/css" href="css/test/prototype/images/colour-glass-test.css">	
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
		<link rel="canonical" href="https://arells.com/prototype-colour-glass-test">
		
		<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">	
		<meta property="og:site_name" content="Arells">	
		<meta property="og:type" content="object">				
		<meta property="og:title" content="Arells">
				<!-- Change below link after test -->
		<meta propety="og:url" content="https://arells.com/prototype-colour-glass-test">
		<meta property="og:description" content="Art Sells">
		<meta property="og:image:type" content="image/jpg">
		<meta property="og:image:width" content="700">
		<meta property="og:image:height" content="400">
		
		<meta name="twitter:title" content="Art Sells">
		<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">
				<!-- Change below link after test -->
		<meta name="twitter:url" content="https://arells.com/prototype-colour-glass-test">
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
			
			document.getElementById('cart-link-colour-glass').style.display = "none";
			document.getElementById('wallet-connected-div-colour-glass').style.display = "block";
			
			document.getElementById('cart-link-connected-colour-glass').style.display = "inline-block";
			
			document.getElementById('colour-glass-add-to-cart-colour-glass').style.display = "none";
			document.getElementById('colour-glass-add-to-cart-connected-colour-glass').style.display = "block";
		
			sessionStorage.setItem('walletConnectedSession', 'true'); 
		}	
		
		const walletConnectedSession = sessionStorage.getItem('walletConnectedSession');
		
		function walletConnectedLoader() {	
		    
			//Add To Cart Functions
		    if (walletConnectedSession === 'true') {				
				document.getElementById('cart-link-colour-glass').style.display = "none";
				document.getElementById('cart-link-connected-colour-glass').style.display = "inline-block";
				
				document.getElementById('wallet-connected-div-colour-glass').style.display = "block";
				
				document.getElementById('colour-glass-add-to-cart-colour-glass').style.display = "none";
				document.getElementById('colour-glass-add-to-cart-connected-colour-glass').style.display = "block";
		 	}	
		}
		document.addEventListener('DOMContentLoaded', walletConnectedLoader);	
<!-- Connect Wallet script above-->


<!--  Add To Cart script below-->

	function addColourGlassToCart() {
		document.getElementById('colour-glass-add-to-cart-connected-colour-glass').style.display = "none";
		document.getElementById('colour-glass-added-colour-glass').style.display = "block";
		
		//cart functions
		sessionStorage.setItem('colourGlassAdded', 'true');
	}

<!--  Add To Cart script up-->	

<!-- Added/Completed-Purchase script/s down-->

	    const colourGlassPurchased = sessionStorage.getItem('colourGlassPurchased');
	    
		const blueOrangeAdded = sessionStorage.getItem('blueOrangeAdded');
		const beachHousesAdded = sessionStorage.getItem('beachHousesAdded');
		const colourGlassAdded = sessionStorage.getItem('colourGlassAdded');
		
		function itemsAddedLoader() {	
			//Add To Cart Functions
		    if (blueOrangeAdded === 'true' || beachHousesAdded === 'true'
		    	|| colourGlassAdded == 'true') {    	
				document.getElementById('cart-link-connected-colour-glass').style.display = "none";
				document.getElementById('cart-link-full-colour-glass').style.display = "inline-block";		
		 	}	
		}
		document.addEventListener('DOMContentLoaded', itemsAddedLoader);	
		
		function colourGlassFunc() {
		    if (colourGlassAdded === 'true') {
				document.getElementById('colour-glass-add-to-cart-colour-glass').style.display = "none";
		 		document.getElementById('colour-glass-add-to-cart-connected-colour-glass').style.display = "none";
		 		document.getElementById('colour-glass-added-colour-glass').style.display = "block";
		 		 		
		 	}
		    if (colourGlassPurchased === 'true') {	
		    	document.getElementById('colour-glass-prices-before-colour-glass').style.display = "none";
		    	document.getElementById('colour-glass-prices-after-colour-glass').style.display = "block";
		    	
		    	document.getElementById('owned-by-creator-colour-glass').style.display = "none";
		    	document.getElementById('owned-by-buyer-colour-glass').style.display = "block";
			
				document.getElementById('colour-glass-add-to-cart-connected-colour-glass').style.display = "none";
				document.getElementById('colour-glass-add-to-cart-colour-glass').style.display = "none";
				document.getElementById('colour-glass-added-colour-glass').style.display = "none";
				document.getElementById('colour-glass-collected-colour-glass').style.display = "block";
				
		    }
		}
		document.addEventListener('DOMContentLoaded', colourGlassFunc);	

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

	<div id="header-colour-glass">
	
	<!-- Change below link after test -->
		<a id="icon-link-colour-glass" href="/test">
			<img id="arells-icon-colour-glass" src="/icons&images/prototype/Arells-Icon-Home.png"/>
		</a>		
		<button id="cart-link-colour-glass" onClick="connectWallet()" style="display: inline-block;">
			<img id="cart-icon-colour-glass" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</button>
		<a id="cart-link-connected-colour-glass" href="/prototype-cart-test" style="display: none;">
			<img id="cart-icon-colour-glass" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</a>
		<a id="cart-link-full-colour-glass" href="/prototype-cart-test" style="display: none;">
			<img id="cart-icon-full-colour-glass" src="/icons&images/prototype/shopping-cart-full.png"/>
		</a>	
	</div>
	<img id="word-logo-colour-glass" src="/icons&images/Arells-Logo-Ebony.png">	
	<p id="slogan-colour-glass">ART SELLS</p>
	<div id="wallet-connected-div-colour-glass" style="display: none;">
		<hr id="connected-line-colour-glass">
		<p id="wallet-connected-colour-glass" >
		WALLET CONNECTED</p>
		<hr id="connected-line-colour-glass">
	</div>

  	<div id="colour-glass">
  		<img id="photo-colour-glass" src="/icons&images/prototype/3.jpg"/>
  		<h3 id="name-colour-glass">Colour Glass</h3> 
  		<button id="copy-link-colour-glass"
		onClick="copyLink()">
			<img id="copy-link-icon-colour-glass" src="/icons&images/prototype/link.png"/>
			COPY LINK
		</button>	
     	<div id="created-by-colour-glass">
     		<p id="creator-owner-desc-colour-glass">Created By</p>
     		<a id="creator-owner-link-colour-glass" href="/prototype-seller-created-test">
     			Abstract Kadabra
     		</a>
     	</div>
     	<div id="owned-by-creator-colour-glass" style="display: block;">
     		<p id="creator-owner-desc-colour-glass">Owned By</p> 
     		<a id="creator-owner-link-colour-glass" href="/prototype-seller-created-test">
     			Abstract Kadabra</a>
     	</div>
     	<div id="owned-by-buyer-colour-glass" style="display: none;">
     		<p id="creator-owner-desc-colour-glass">Owned By</p> 
     		<a id="creator-owner-link-colour-glass" href="/prototype-buyer-collected-test">
     			0x71C7656E...
     		</a>
     	</div>
     	<hr id="line-colour-glass">
  		<div id="colour-glass-prices-before-colour-glass" style="display: block;">
	  		<p id="PAP-colour-glass">Price After Purchase</p>
	  		<p id="PAP-colour-glass-before-colour-glass">$725,000</p>
	  		<hr id="priceline-colour-glass">
	  		<p id="yourprice-colour-glass">Price</p>
	     	<p id="price-colour-glass-before-colour-glass">$14,500</p>
     	</div>
     	<div id="colour-glass-prices-after-colour-glass" style="display: none;">
	  		<p id="PAP-colour-glass">Price After Purchase</p>
	  		<p id="PAP-colour-glass-after-colour-glass">$36,250,000</p>
	  		<hr id="priceline-colour-glass">
	  		<p id="yourprice-colour-glass">Price</p>
	     	<p id="price-colour-glass-after-colour-glass">$725,000</p>
     	</div>
    	<button id="colour-glass-add-to-cart-colour-glass" onClick="connectWallet()"
    		style="display: block;">
    		ADD TO CART</button>
    	<button id="colour-glass-add-to-cart-connected-colour-glass" onClick="addColourGlassToCart()"
    		style="display: none;">
    		ADD TO CART</button>
    	<button id="colour-glass-added-colour-glass" style="display: none;">
    		ADDED</button>	
    	<button id="colour-glass-collected-colour-glass" style="display: none;">
    		COLLECTED</button>				     	
    </div>

</body>
</html>