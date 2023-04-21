<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!-- change below link after test -->
<%@ include file="/cart/cart-test.jsp" %>
<!DOCTYPE html>
<html>
	<head>
		
				<!-- Change below links after test -->
		<link rel="stylesheet" type="text/css" href="css/test/prototype/seller-created-test.css">	
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
		<link rel="canonical" href="https://arells.com/prototype-seller-created-test">
		
		<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">	
		<meta property="og:site_name" content="Arells">	
		<meta property="og:type" content="object">				
		<meta property="og:title" content="Arells">
				<!-- Change below link after test -->
		<meta propety="og:url" content="https://arells.com/prototype-seller-created-test">
		<meta property="og:description" content="Art Sells">
		<meta property="og:image:type" content="image/jpg">
		<meta property="og:image:width" content="700">
		<meta property="og:image:height" content="400">
		
		<meta name="twitter:title" content="Art Sells">
		<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">
				<!-- Change below link after test -->
		<meta name="twitter:url" content="https://arells.com/prototype-seller-created-test">
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
		
		document.getElementById('cart-link-seller-created').style.display = "none";
		document.getElementById('wallet-connected-div-seller-created').style.display = "block";
		
		document.getElementById('cart-link-connected-seller-created').style.display = "inline-block";
		
		document.getElementById('blue-orange-add-to-cart-seller-created').style.display = "none";
		document.getElementById('beach-houses-add-to-cart-seller-created').style.display = "none";
		document.getElementById('colour-glass-add-to-cart-seller-created').style.display = "none";
		document.getElementById('layers-add-to-cart-seller-created').style.display = "none";
		document.getElementById('succinct-drop-add-to-cart-seller-created').style.display = "none";
		document.getElementById('paint-rain-add-to-cart-seller-created').style.display = "none";
 		document.getElementById('blue-orange-add-to-cart-connected-seller-created').style.display = "block";
		document.getElementById('beach-houses-add-to-cart-connected-seller-created').style.display = "block";
		document.getElementById('colour-glass-add-to-cart-connected-seller-created').style.display = "block";
		document.getElementById('layers-add-to-cart-connected-seller-created').style.display = "block";
		document.getElementById('succinct-drop-add-to-cart-connected-seller-created').style.display = "block";
		document.getElementById('paint-rain-add-to-cart-connected-seller-created').style.display = "block"; 
	 
	}	
<!-- Connect Wallet script above-->


<!--  Add To Cart script below-->

//Ensure that Image displays show as FLEX after adding, cart-full: block

	function addBlueOrangeToCart() {
		document.getElementById('blue-orange-add-to-cart-connected-seller-created').style.display = "none";
		document.getElementById('blue-orange-added-seller-created').style.display = "block";
		
		//cart functions
		document.getElementById('cart-empty-cart').style.display = "none";
		document.getElementById('cart-full-cart').style.display = "block";
		document.getElementById('blue-orange-cart-cart').style.display = "flex";
		
		  
	}
	function addBeachHousesToCart() {
		document.getElementById('beach-houses-add-to-cart-connected-seller-created').style.display = "none";
		document.getElementById('beach-houses-added-seller-created').style.display = "block";
		  
	}
	function addColourGlassToCart() {
		document.getElementById('colour-glass-add-to-cart-connected-seller-created').style.display = "none";
		document.getElementById('colour-glass-added-seller-created').style.display = "block";
		  
	}
	function addLayersToCart() {
		document.getElementById('layers-add-to-cart-connected-seller-created').style.display = "none";
		document.getElementById('layers-added-seller-created').style.display = "block";
		
		  
	}
	function addSuccinctDropToCart() {
		document.getElementById('succinct-drop-add-to-cart-connected-seller-created').style.display = "none";
		document.getElementById('succinct-drop-added-seller-created').style.display = "block";
		  
	}
	function addPaintRainToCart() {
		document.getElementById('paint-rain-add-to-cart-connected-seller-created').style.display = "none";
		document.getElementById('paint-rain-added-seller-created').style.display = "block";
		  
	}
	
<!--  Add To Cart script up-->	
			
		
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

	<div id="header-seller-created">
	
	<!-- Change below link after test -->
		<a id="icon-link-seller-created" href="/test">
			<img id="arells-icon-seller-created" src="/icons&images/prototype/Arells-Icon-Home.png"/>
		</a>		
		<button id="cart-link-seller-created" onClick="connectWallet()" style="display: inline-block;">
			<img id="cart-icon-seller-created" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</button>
		<a id="cart-link-connected-seller-created" href="/prototype-cart-test" style="display: none;">
			<img id="cart-icon-seller-created" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</a>	
	</div>
	<img id="word-logo-seller-created" src="/icons&images/Arells-Logo-Ebony.png">	
	<p id="slogan-seller-created">ART SELLS</p>
	<div id="wallet-connected-div-seller-created" style="display: none;">
		<hr id="connected-line-seller-created">
		<p id="wallet-connected-seller-created" >
		WALLET CONNECTED</p>
		<hr id="connected-line-seller-created">
	</div>
    <div id="profile-img-container-seller-created">
		<img id="profile-photo-seller-created" src="/icons&images/prototype/proto-banner.jpg">
	</div>	 
	<h1 id="name-seller-created">Abstract Kadabra</h1>  
	<p id="description-seller-created">Here rests life's abstractions captured in majestic endeavors.</p> 
	<button id="copy-link-seller-created"
		onClick="copyLink()">
		<img id="copy-link-icon-seller-created" src="/icons&images/prototype/link.png"/>
		COPY LINK</button>	
	<br>
	<hr id="profileline-seller-created">
	<div id="created-collected-seller-created">
		<a id="created-seller-created">Created</a>	
	<!-- Change below link after test -->		
		<a id="collected-seller-created" href="/prototype-seller-collected-test">Collected</a>	
	</div>
	<div id="container-seller-created">
		  	<div id="blue-orange-seller-created">
		  	<!-- Change below link after test -->
		  		<a href="/prototype-blue-orange-test" target="_self" id="photo-link-seller-created">
		  			<img id="photo-seller-created" src="/icons&images/prototype/1.jpg"/>
		  		</a>
		  		<div id="blue-orange-prices-before-seller-created" style="display: block;">
			  		<p id="PAP-seller-created">Price After Purchase</p>
			  		<p id="PAP-blue-orange-before-seller-created">$60,000</p>
			  		<hr id="priceline-seller-created">
			  		<p id="yourprice-seller-created">Price</p>
			     	<p id="price-blue-orange-before-seller-created">$1,200</p>
		  		</div>	
		  		<div id="blue-orange-prices-after-seller-created" style="display: none;">
			  		<p id="PAP-seller-created">Price After Purchase</p>
			  		<p id="PAP-blue-orange-after-seller-created">$3,000,000</p>
			  		<hr id="priceline-seller-created">
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
		  	<!-- Change below link after test -->
		  		<a href="/prototype-beach-houses-test" target="_self" id="photo-link-seller-created">
		  			<img id="photo-seller-created" src="/icons&images/prototype/2.jpg"/>
		  		</a>
		  		<div id="beach-houses-prices-before-seller-created" style="display: block;">
			  		<p id="PAP-seller-created">Price After Purchase</p>
			  		<p id="PAP-beach-houses-before-seller-created">$10,000</p>
			  		<hr id="priceline-seller-created">
			  		<p id="yourprice-seller-created">Price</p>
			     	<p id="price-beach-houses-before-seller-created">$200</p>
		     	</div>
		     	<div id="beach-houses-prices-after-seller-created" style="display: none;">
			  		<p id="PAP-seller-created">Price After Purchase</p>
			  		<p id="PAP-beach-houses-after-seller-created">$500,000</p>
			  		<hr id="priceline-seller-created">
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
		     <!-- Change below link after test -->
		  		<a href="/prototype-colour-glass-test" target="_self" id="photo-link-seller-created">
		  			<img id="photo-seller-created" src="/icons&images/prototype/3.jpg"/>
		  		</a>
		  		<div id="colour-glass-prices-before-seller-created" style="display: block;">
			  		<p id="PAP-seller-created">Price After Purchase</p>
			  		<p id="PAP-colour-glass-before-seller-created">$725,000</p>
			  		<hr id="priceline-seller-created">
			  		<p id="yourprice-seller-created">Price</p>
			     	<p id="price-colour-glass-before-seller-created">$14,500</p>
		     	</div>
		     	<div id="colour-glass-prices-before-seller-created" style="display: none;">
			  		<p id="PAP-seller-created">Price After Purchase</p>
			  		<p id="PAP-colour-glass-after-seller-created">$36,250,000</p>
			  		<hr id="priceline-seller-created">
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
		  	<!-- Change below link after test -->
		  		<a href="/prototype-layers-test" target="_self" id="photo-link-seller-created">
		  			<img id="photo-seller-created" src="/icons&images/prototype/4.jpg"/>
		  		</a>
		  		<div id="layers-prices-before-seller-created" style="display: block;">
			  		<p id="PAP-seller-created">Price After Purchase</p>
			  		<p id="PAP-layers-before-seller-created">$20,000,000</p>
			  		<hr id="priceline-seller-created">
			  		<p id="yourprice-seller-created">Price</p>
			     	<p id="price-layers-before-seller-created">$400,000</p>
		     	</div>
		     	<div id="layers-prices-after-seller-created" style="display: none;">
			  		<p id="PAP-seller-created">Price After Purchase</p>
			  		<p id="PAP-layers-after-seller-created">$1,000,000,000</p>
			  		<hr id="priceline-seller-created">
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
		  	<!-- Change below link after test -->
		  		<a href="/prototype-succinct-drop-test" target="_self" id="photo-link-seller-created">
		  			<img id="photo-seller-created" src="/icons&images/prototype/5.jpg"/>
		  		</a>
		  		<div id="succinct-drop-prices-before-seller-created" style="display: block;">
			  		<p id="PAP-seller-created">Price After Purchase</p>
			  		<p id="PAP-succinct-drop-before-seller-created">$5,000</p>
			  		<hr id="priceline-seller-created">
			  		<p id="yourprice-seller-created">Price</p>
			     	<p id="price-succinct-drop-before-seller-created">$100</p>
		     	</div>
		     	<div id="succinct-drop-prices-after-seller-created" style="display: none;">
			  		<p id="PAP-seller-created">Price After Purchase</p>
			  		<p id="PAP-succinct-drop-after-seller-created">$250,000</p>
			  		<hr id="priceline-seller-created">
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
			<!-- Change below link after test -->
		  		<a href="/prototype-paint-rain-test" target="_self" id="photo-link-seller-created">
		  			<img id="photo-seller-created" src="/icons&images/prototype/6.jpg"/>
		  		</a>
		  		<div id="paint-rain-prices-before-seller-created" style="display: block;">
			  		<p id="PAP-seller-created">Price After Purchase</p>
			  		<p id="PAP-paint-rain-before-seller-created">$600,000</p>
			  		<hr id="priceline-seller-created">
			  		<p id="yourprice-seller-created">Price</p>
			     	<p id="price-paint-rain-before-seller-created">$12,000</p>
		     	</div>
		     	<div id="paint-rain-prices-after-seller-created" style="display: none;">
			  		<p id="PAP-seller-created">Price After Purchase</p>
			  		<p id="PAP-paint-rain-after-seller-created">$30,000,000</p>
			  		<hr id="priceline-seller-created">
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
</body>
</html>