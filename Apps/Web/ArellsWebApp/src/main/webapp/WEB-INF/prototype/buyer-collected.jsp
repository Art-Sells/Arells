<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
	
<!DOCTYPE html>
<html>
	<head>
	<meta name="robots" content="noimageindex"/>
		
				<!-- Change below links after test -->
		<link rel="stylesheet" type="text/css" href="css/prototype/buyer-collected.css">	
		<link rel="stylesheet" type="text/css" href="css/prototype/modals/copiedlink.css" />	
		<link rel="stylesheet" type="text/css" href="css/prototype/modals/connect-wallet.css" />
			
		<meta charset="UTF-8">
		
<!-- Below information for social media sharing and search-engine/browser optimization -->		
		<meta name="title" content="Arells">
		<meta name="description" content="Prototype for Buyer Collections">
		<meta name="google" content="nositelinkssearchbox">
		<meta name="keywords" content="Arells">
		<meta name="author" content="Arells">
		<meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" >
	
		<link rel="icon" type="image/x-icon" href="/icons&images/Arells-Ico.ico" sizes="156x156">
				<!-- Change below link after test -->
		<link rel="canonical" href="https://arells.com/prototype-buyer-collected">
		
		<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">	
		<meta property="og:site_name" content="Arells">	
		<meta property="og:type" content="object">				
		<meta property="og:title" content="Arells">
				<!-- Change below link after test -->
		<meta propety="og:url" content="https://arells.com/prototype-buyer-collected">
		<meta property="og:description" content="Prototype for Buyer Collections">
		<meta property="og:image:type" content="image/jpg">
		<meta property="og:image:width" content="700">
		<meta property="og:image:height" content="400">
		
		<meta name="twitter:title" content="Arells">
		<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">
				<!-- Change below link after test -->
		<meta name="twitter:url" content="https://arells.com/prototype-buyer-collected">
		<meta name="twitter:card" content="summary_large_image">
		<meta name="twitter:description" content="Prototype for Buyer Collections">
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
				
				document.getElementById('wallet-connected-div-buyer-collected').style.display = "block";
				
				document.getElementById('cart-link-buyer-collected').style.display = "none";
				document.getElementById('wallet-connected-div-buyer-collected').style.display = "block";
				
				document.getElementById('cart-link-connected-buyer-collected').style.display = "inline-block";
			 
				sessionStorage.setItem('walletConnectedSession', 'true'); 
			}	
			
			const walletConnectedSession = sessionStorage.getItem('walletConnectedSession');
			function walletConnectedLoader() {	
			    
				//Add To Cart Functions
			    if (walletConnectedSession === 'true') {
			    	document.getElementById('wallet-connected-div-buyer-collected').style.display = "block";
					
					document.getElementById('cart-link-buyer-collected').style.display = "none";				
					document.getElementById('cart-link-connected-buyer-collected').style.display = "inline-block";	
			 	}	
			}
			document.addEventListener('DOMContentLoaded', walletConnectedLoader);	
<!-- Connect Wallet script above-->


<!-- Added/Completed-Purchase script/s down-->


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
				document.getElementById('cart-link-connected-buyer-collected').style.display = "none";
				document.getElementById('cart-link-full-buyer-collected').style.display = "inline-block";		
		 	}	
		}
		document.addEventListener('DOMContentLoaded', itemsAddedLoader);	

		const blueOrangePurchased = sessionStorage.getItem('blueOrangePurchased');
		function blueOrangePurchasedLoader(){	
		    
		    if (blueOrangePurchased === 'true') {		    	
		    	
		    	document.getElementById('no-art-buyer-collected').style.display = "none";
		    	
		    	document.getElementById('collected-items-buyer-collected').style.display = "block";
				document.getElementById('blue-orange-buyer-collected').style.display = "flex";
		    }
		}
		document.addEventListener('DOMContentLoaded', blueOrangePurchasedLoader);	
		
		const beachHousesPurchased = sessionStorage.getItem('beachHousesPurchased');
		function beachHousesPurchasedLoader(){		

		    if (beachHousesPurchased === 'true') {		
		    	
		    	document.getElementById('no-art-buyer-collected').style.display = "none";
		    	
		    	document.getElementById('collected-items-buyer-collected').style.display = "block";
				document.getElementById('beach-houses-buyer-collected').style.display = "flex";
		    }	
	
		}
		document.addEventListener('DOMContentLoaded', beachHousesPurchasedLoader);	
		
		const colourGlassPurchased = sessionStorage.getItem('colourGlassPurchased');
		function colourGlassPurchasedLoader(){		

		    if (colourGlassPurchased === 'true') {			
		    	document.getElementById('no-art-buyer-collected').style.display = "none";
		    	
		    	document.getElementById('collected-items-buyer-collected').style.display = "block";
				document.getElementById('colour-glass-buyer-collected').style.display = "flex";
		    }	
	
		}
		document.addEventListener('DOMContentLoaded', colourGlassPurchasedLoader);
		
		const layersPurchased = sessionStorage.getItem('layersPurchased');
		function layersPurchasedLoader(){		

		    if (layersPurchased === 'true') {			
		    	document.getElementById('no-art-buyer-collected').style.display = "none";
		    	
		    	document.getElementById('collected-items-buyer-collected').style.display = "block";
				document.getElementById('layers-buyer-collected').style.display = "flex";
		    }	
	
		}
		document.addEventListener('DOMContentLoaded', layersPurchasedLoader);
		
		const succinctDropPurchased = sessionStorage.getItem('succinctDropPurchased');
		function succinctDropPurchasedLoader(){		

		    if (succinctDropPurchased === 'true') {			
		    	document.getElementById('no-art-buyer-collected').style.display = "none";
		    	
		    	document.getElementById('collected-items-buyer-collected').style.display = "block";
				document.getElementById('succinct-drop-buyer-collected').style.display = "flex";
		    }	
	
		}
		document.addEventListener('DOMContentLoaded', succinctDropPurchasedLoader);			
		
		const paintRainPurchased = sessionStorage.getItem('paintRainPurchased');
		function paintRainPurchasedLoader(){		

		    if (paintRainPurchased === 'true') {			
		    	document.getElementById('no-art-buyer-collected').style.display = "none";
		    	
		    	document.getElementById('collected-items-buyer-collected').style.display = "block";
				document.getElementById('paint-rain-buyer-collected').style.display = "flex";
		    }	
	
		}
		document.addEventListener('DOMContentLoaded', paintRainPurchasedLoader);		


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
	

	<div id="header-buyer-collected">
	
	<!-- Change below link after test -->
		<a id="icon-link-buyer-collected" href="/">
			<img id="arells-icon-buyer-collected" src="/icons&images/prototype/Arells-Icon-Home.png"/>
		</a>		
		<button id="cart-link-buyer-collected" onClick="connectWallet()" style="display: inline-block;">
			<img id="cart-icon-buyer-collected" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</button>
		<a id="cart-link-connected-buyer-collected" href="/prototype-cart" style="display: none;">
			<img id="cart-icon-buyer-collected" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</a>
		<a id="cart-link-full-buyer-collected" href="/prototype-cart" style="display: none;">
			<img id="cart-icon-buyer-collected" src="/icons&images/prototype/shopping-cart-full.png"/>
		</a>		
	</div>
	<img id="word-logo-buyer-collected" src="/icons&images/Arells-Logo-Ebony.png">	
	<p id="slogan-buyer-collected">ART SELLS</p>
	<div id="wallet-connected-div-buyer-collected" style="display: none;">
		<hr id="connected-line-buyer-collected">
		<p id="wallet-connected-buyer-collected" >
		WALLET CONNECTED</p>
		<hr id="connected-line-buyer-collected">
	</div>
    <div id="profile-img-container-buyer-collected">
		<img id="profile-photo-buyer-collected" src="/icons&images/prototype/Unnamed-Icon.jpg">
	</div>	 
	<h1 id="name-buyer-collected">Unnamed</h1>  
	<p id="description-buyer-collected">Creator & Collector</p> 
	<div id="share-div">
		<p id="share-div-desc">SHARE</p>
		<button id="copy-link-buyer-collected"
			onClick="copyLink()">
			<img id="copy-link-icon-buyer-collected" src="/icons&images/prototype/link.png"/>
			COPY LINK</button>	
	</div>		
	<hr id="profileline-buyer-collected">
	<div id="created-collected-buyer-collected">
		<!-- Change below link after test -->
		<a id="created-buyer-collected" href="/prototype-buyer-created">Created</a>		
		<a id="collected-buyer-collected">Collected</a>	
	</div>
	<p id="no-art-buyer-collected" style="display: block;">
		no art collected
		<img id="cart-icon-collected-buyer-collected" src="/icons&images/prototype/shopping-cart-empty.png"/>
	</p>
	<div id="collected-items-buyer-collected" style="display: none;">
		  	<div id="blue-orange-buyer-collected" style="display: none;">
		  	<!-- Change below link after test -->
		  		<a href="/prototype-blue-orange" target="_self" id="photo-link-buyer-collected">
		  			<img id="photo-buyer-collected" src="/icons&images/prototype/1.jpg"/>
		  		</a>
		  		<div id="prices-buyer-collected">
			  		<div id="blue-orange-prices-after-buyer-collected">
				  		<p id="PAP-buyer-collected">Price After Purchase</p>
				  		<p id="PAP-blue-orange-after-buyer-collected">$3,000,000</p>
				  		<hr id="priceline-buyer-collected">
				  		<p id="yourprice-buyer-collected">Price</p>
				     	<p id="price-blue-orange-after-buyer-collected">$60,000</p>
			  		</div>			  		
		  		</div>		  		
		    </div>
		  	<div id="beach-houses-buyer-collected" style="display: none;">
		  	<!-- Change below link after test -->
		  		<a href="/prototype-beach-houses" target="_self" id="photo-link-buyer-collected">
		  			<img id="photo-buyer-collected" src="/icons&images/prototype/2.jpg"/>
		  		</a>
		  		<div id="prices-buyer-collected">
			  		<div id="beach-houses-prices-after-buyer-collected">
				  		<p id="PAP-buyer-collected">Price After Purchase</p>
				  		<p id="PAP-beach-houses-after-buyer-collected">$500,000</p>
				  		<hr id="priceline-buyer-collected">
				  		<p id="yourprice-buyer-collected">Price</p>
				     	<p id="price-beach-houses-after-buyer-collected">$10,000</p>
			     	</div>			  		
		  		</div>     	
		    </div>
		     <div id="colour-glass-buyer-collected" style="display: none;">
		     <!-- Change below link after test -->
		  		<a href="/prototype-colour-glass" target="_self" id="photo-link-buyer-collected">
		  			<img id="photo-buyer-collected" src="/icons&images/prototype/3.jpg"/>
		  		</a>
		  		<div id="prices-buyer-collected">
			  		<div id="colour-glass-prices-after-buyer-collected">
				  		<p id="PAP-buyer-collected">Price After Purchase</p>
				  		<p id="PAP-colour-glass-after-buyer-collected">$36,250,000</p>
				  		<hr id="priceline-buyer-collected">
				  		<p id="yourprice-buyer-collected">Price</p>
				     	<p id="price-colour-glass-after-buyer-collected">$725,000</p>
			     	</div>  		  		
		  		</div>   	
		    </div>
		  	<div id="layers-buyer-collected" style="display: none;">
		  	<!-- Change below link after test -->
		  		<a href="/prototype-layers" target="_self" id="photo-link-buyer-collected">
		  			<img id="photo-buyer-collected" src="/icons&images/prototype/4.jpg"/>
		  		</a>
		  		<div id="prices-buyer-collected">
			  		<div id="layers-prices-after-buyer-collected">
				  		<p id="PAP-buyer-collected">Price After Purchase</p>
				  		<p id="PAP-layers-after-buyer-collected">$1,000,000,000</p>
				  		<hr id="priceline-buyer-collected">
				  		<p id="yourprice-buyer-collected">Price</p>
				     	<p id="price-layers-after-buyer-collected">$20,000,000</p>
			     	</div>		  		
		  		</div>
		    </div>
		  	<div id="succinct-drop-buyer-collected" style="display:none;">
		  	<!-- Change below link after test -->
		  		<a href="/prototype-succinct-drop" target="_self" id="photo-link-buyer-collected">
		  			<img id="photo-buyer-collected" src="/icons&images/prototype/5.jpg"/>
		  		</a>
		  		<div id="prices-buyer-collected">
			  		<div id="succinct-drop-prices-after-buyer-collected">
				  		<p id="PAP-buyer-collected">Price After Purchase</p>
				  		<p id="PAP-succinct-drop-after-buyer-collected">$250,000</p>
				  		<hr id="priceline-buyer-collected">
				  		<p id="yourprice-buyer-collected">Price</p>
				     	<p id="price-succinct-drop-after-buyer-collected">$5,000</p>
			     	</div>				  		
		  		</div>     	
		    </div>
		     <div id="paint-rain-buyer-collected" style="display: none;">
		     <!-- Change below link after test -->
		  		<a href="/prototype-paint-rain" target="_self" id="photo-link-buyer-collected">
		  			<img id="photo-buyer-collected" src="/icons&images/prototype/6.jpg"/>
		  		</a>
		  		<div id="prices-buyer-collected">
			  		<div id="paint-rain-prices-after-buyer-collected">
				  		<p id="PAP-buyer-collected">Price After Purchase</p>
				  		<p id="PAP-paint-rain-after-buyer-collected">$30,000,000</p>
				  		<hr id="priceline-buyer-collected">
				  		<p id="yourprice-buyer-collected">Price</p>
				     	<p id="price-paint-rain-after-buyer-collected">$600,000</p>
			     	</div>			  		
		  		</div>     	
		    </div>
	</div>
			<p id="prototype">PROTOTYPE</p>	
</body>
</html>