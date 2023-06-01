<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
	<head>
	<meta name="robots" content="noimageindex"/>
		
				<!-- Change below links after test -->
		<link rel="stylesheet" type="text/css" href="css/prototype/buyer-created.css">	
		<link rel="stylesheet" type="text/css" href="css/prototype/modals/copiedlink.css" />	
		<link rel="stylesheet" type="text/css" href="css/prototype/modals/connect-wallet.css" />
	
		<meta charset="UTF-8">
				<meta http-equiv="X-UA-Compatible" content="IE=edge">	
		<meta http-equiv="Content-type" content="text/html; charset=UTF-8">
		
<!-- Below information for social media sharing and search-engine/browser optimization -->		
		<meta name="title" content="Buyer Creations Prototype">
		<meta name="description" content="Prototype for Buyer Creations">
		<meta name="google" content="nositelinkssearchbox">
		<meta name="keywords" content="Arells">
		<meta name="author" content="Arells">
		<meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" >
	
		<link rel="icon" type="image/x-icon" href="/icons&images/Arells-Ico.ico" sizes="156x156">
				<!-- Change below link after test -->
		<link rel="canonical" href="https://arells.com/prototype-buyer-created">
		
		<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">	
		<meta property="og:site_name" content="Arells">	
		<meta property="og:type" content="website">				
		<meta property="og:title" content="Buyer Creations Prototype">
				<!-- Change below link after test -->
		<meta propety="og:url" content="https://arells.com/prototype-buyer-created">
		<meta property="og:description" content="Prototype for Buyer Creations">
		<meta property="og:image:type" content="image/jpg">
		<meta property="og:image:width" content="700">
		<meta property="og:image:height" content="400">
		
		<meta name="twitter:title" content="Buyer Creations Prototype">
		<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">
				<!-- Change below link after test -->
		<meta name="twitter:url" content="https://arells.com/prototype-buyer-created">
		<meta name="twitter:card" content="summary_large_image">
		<meta name="twitter:description" content="Prototype for Buyer Creations">
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
		
		document.getElementById('wallet-connected-div-buyer-created').style.display = "block";
		
		document.getElementById('cart-link-buyer-created').style.display = "none";
		document.getElementById('wallet-connected-div-buyer-created').style.display = "block";
		
		document.getElementById('cart-link-connected-buyer-created').style.display = "inline-block";
	 
		sessionStorage.setItem('walletConnectedSession', 'true'); 
	}		
	
	const walletConnectedSession = sessionStorage.getItem('walletConnectedSession');	
	function walletConnectedLoader() {	
	    
		//Add To Cart Functions
	    if (walletConnectedSession === 'true') {	
			document.getElementById('cart-link-buyer-created').style.display = "none";		
			document.getElementById('cart-link-connected-buyer-created').style.display = "inline-block";		
			
			document.getElementById('wallet-connected-div-buyer-created').style.display = "block";
	 	}	
	}
	document.addEventListener('DOMContentLoaded', walletConnectedLoader);	
		
	
<!-- Connect Wallet script above-->
	
<!-- Added/Completed-Purchase script/s down-->

	const blueOrangeAdded = sessionStorage.getItem('blueOrangeAdded');
	const beachHousesAdded = sessionStorage.getItem('beachHousesAdded');
	const colourGlassAdded = sessionStorage.getItem('colourGlassAdded');
	const layersAdded = sessionStorage.getItem('layersAdded');
	const succinctDropAdded = sessionStorage.getItem('succinctDropAdded');
	const paintRainAdded = sessionStorage.getItem('paintRainAdded');
	
	function blueOrangeLoader() {
		//Add To Cart Functions
		if (blueOrangeAdded === 'true') {	
			document.getElementById('cart-link-connected-buyer-created').style.display = "none";
			document.getElementById('cart-link-full-buyer-created').style.display = "inline-block";
		}	
	}
	document.addEventListener('DOMContentLoaded', blueOrangeLoader);
	
	function beachHousesLoader() {	
		//Add To Cart Functions
	    if (beachHousesAdded === 'true') {    	
			document.getElementById('cart-link-connected-buyer-created').style.display = "none";
			document.getElementById('cart-link-full-buyer-created').style.display = "inline-block"; 		
	 	}	
	}
	document.addEventListener('DOMContentLoaded', beachHousesLoader);
	
	function colourGlassLoader() {	 
		//Add To Cart Functions
	    if (colourGlassAdded === 'true') {    	
			document.getElementById('cart-link-connected-buyer-created').style.display = "none";
			document.getElementById('cart-link-full-buyer-created').style.display = "inline-block"; 		
	 	}	
	}
	document.addEventListener('DOMContentLoaded', colourGlassLoader);
	
	function layersLoader() {	 
		//Add To Cart Functions
	    if (layersAdded === 'true') {    	
			document.getElementById('cart-link-connected-buyer-created').style.display = "none";
			document.getElementById('cart-link-full-buyer-created').style.display = "inline-block"; 		
	 	}	
	}
	document.addEventListener('DOMContentLoaded', layersLoader);
	
	function succinctDropLoader() {	 
		//Add To Cart Functions
	    if (succinctDropAdded === 'true') {    	
			document.getElementById('cart-link-connected-buyer-created').style.display = "none";
			document.getElementById('cart-link-full-buyer-created').style.display = "inline-block"; 		
	 	}	
	}
	document.addEventListener('DOMContentLoaded', succinctDropLoader);
	
	function paintRainLoader() {	 
		//Add To Cart Functions
	    if (paintRainAdded === 'true') {    	
			document.getElementById('cart-link-connected-buyer-created').style.display = "none";
			document.getElementById('cart-link-full-buyer-created').style.display = "inline-block"; 		
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
	
	
	<div id="header-buyer-created">
	
	<!-- Change below link after test -->
		<a id="icon-link-buyer-created" href="/">
			<img id="arells-icon-buyer-created" src="/icons&images/prototype/Arells-Icon-Home.png"/>
		</a>		
		<button id="cart-link-buyer-created" onClick="connectWallet()" style="display: inline-block;">
			<img id="cart-icon-buyer-created" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</button>
		<a id="cart-link-connected-buyer-created" href="/prototype-cart" style="display: none;">
			<img id="cart-icon-buyer-created" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</a>
		<a id="cart-link-full-buyer-created" href="/prototype-cart" style="display: none;">
			<img id="cart-icon-full-buyer-created" src="/icons&images/prototype/shopping-cart-full.png"/>
		</a>
	</div>
	<img id="word-logo-buyer-created" src="/icons&images/Arells-Logo-Ebony.png">	
	<p id="slogan-buyer-created">ART SELLS</p>
	<div id="wallet-connected-div-buyer-created" style="display: none;">
		<hr id="connected-line-buyer-created">
		<p id="wallet-connected-buyer-created" >
		WALLET CONNECTED</p>
		<hr id="connected-line-buyer-created">
	</div>
    <div id="profile-img-container-buyer-created">
		<img id="profile-photo-buyer-created" src="/icons&images/prototype/Unnamed-Icon.jpg">
	</div>	 
	<h1 id="name-buyer-created">Unnamed</h1>  
	<p id="description-buyer-created">Creator & Collector</p> 
	<div id="share-div">
		<p id="share-div-desc">SHARE</p>
		<button id="copy-link-buyer-created"
			onClick="copyLink()">
			<img id="copy-link-icon-buyer-created" src="/icons&images/prototype/link.png"/>
			COPY LINK</button>	
	</div>
	<hr id="profileline-buyer-created">
	<div id="created-collected-buyer-created">
		<a id="created-buyer-created">Created</a>	
	<!-- Change below link after test -->		
		<a id="collected-buyer-created" href="/prototype-buyer-collected">Collected</a>	
	</div>
	<p id="no-art-buyer-created">
		no art created
		<img id="cart-icon-collected-buyer-created" src="/icons&images/prototype/Add.png"/>
	</p>
			<p id="prototype">PROTOTYPE</p>
</body>
</html>