<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<!-- change below links after test -->

<!DOCTYPE html>
<html>
	<head>
	<meta name="robots" content="noimageindex"/>
		
				<!-- Change below links after test -->
		<link rel="stylesheet" type="text/css" href="css/prototype/cart/cart.css">	
		<link rel="stylesheet" type="text/css" href="css/prototype/modals/purchase-complete.css" />
			
				<meta http-equiv="X-UA-Compatible" content="IE=edge">	
		<meta http-equiv="Content-type" content="text/html; charset=UTF-8">
		<meta charset="UTF-8">
		
<!-- Below information for social media sharing and search-engine/browser optimization -->		
		<meta name="title" content="Cart Prototype Test">
		<meta name="description" content="Prototype for Cart Test">
		<meta name="google" content="nositelinkssearchbox">
		<meta name="keywords" content="Arells">
		<meta name="author" content="Arells">
		<meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" >
	
		<link rel="icon" type="image/x-icon" href="/icons&images/Arells-Ico.ico" sizes="156x156">
				<!-- Change below link after test -->
		<link rel="canonical" href="https://arells.com/prototype-cart">
		
		<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">	
		<meta property="og:site_name" content="Arells">	
		<meta property="og:type" content="object">				
		<meta property="og:title" content="Cart Prototype Test">
				<!-- Change below link after test -->
		<meta propety="og:url" content="https://arells.com/prototype-cart">
		<meta property="og:description" content="Cart Test">
		<meta property="og:image:type" content="image/jpg">
		<meta property="og:image:width" content="700">
		<meta property="og:image:height" content="400">
		
		<meta name="twitter:title" content="Cart Prototype Test">
		<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">
				<!-- Change below link after test -->
		<meta name="twitter:url" content="https://arells.com/prototype-cart">
		<meta name="twitter:card" content="summary_large_image">
		<meta name="twitter:description" content="Cart Test">
<!-- Above information for social media sharing and search-engine/browser optimization -->	

		<script>
		
		
<!-- Add To Cart & Purchase scrips below -->	

// Ensure that Image displays show as FLEX after adding, cart-full: block

		var blueOrange = 1200;
		var beachHouses = 200;
		var colourGlass = 14500;
		var layers = 400000;
		var succinctDrop = 100;
		var paintRain = 12000;
		
		//royalty before purchase
		var royalty = .97;
		//royalty after purchase (.90)
		//seller fee (.07)
		
		var fee = .03;
		
		var royalties = 0;
		var fees = 0;
		var total = 0;

		
		//Blue Orange
		const blueOrangeAdded = sessionStorage.getItem('blueOrangeAdded');
 		function blueOrangeAddedFunc() {
	 	    if (blueOrangeAdded === 'true') {
	 			document.getElementById('cart-empty-cart').style.display = "none";
	 			document.getElementById('cart-full-cart').style.display = "block";
	 			document.getElementById('blue-orange-cart').style.display = "flex";
	 			
		 	    royalties = (royalty * blueOrange + royalties);
		 	    fees = (fee * blueOrange + fees);
		 	    total = (total + blueOrange);
		 	    	 	
				
				var royaltiesFormated = new Intl.NumberFormat('en-US',
			 				{ minimumFractionDigits: 0,
							  maximumFractionDigits: 0,}).format(royalties);
				var feesFormated = new Intl.NumberFormat('en-US',
		 				{ minimumFractionDigits: 0,
						  maximumFractionDigits: 0,}).format(fees);
				var totalFormated = new Intl.NumberFormat('en-US',
		 				{ minimumFractionDigits: 0,
						  maximumFractionDigits: 0,}).format(total);
				
				document.getElementById('royalty-price-value-cart').innerHTML = 
					royaltiesFormated;
				document.getElementById('fee-price-value-cart').innerHTML = 
					feesFormated;
				document.getElementById('total-price-value-cart').innerHTML = 
					totalFormated;	 			
	 	    }
 		}
 		document.addEventListener('DOMContentLoaded', blueOrangeAddedFunc);
 		
 		
 		//Beach Houses
		const beachHousesAdded = sessionStorage.getItem('beachHousesAdded');
 		function beachHousesAddedLoader() {
	 	    if (beachHousesAdded === 'true') {
	 			document.getElementById('cart-empty-cart').style.display = "none";
	 			document.getElementById('cart-full-cart').style.display = "block";
	 			document.getElementById('beach-houses-cart').style.display = "flex";

		 	    royalties = (royalty * beachHouses + royalties);
		 	    fees = (fee * beachHouses + fees);
		 	    total = (total + beachHouses);
		 	    	 	
				
				var royaltiesFormated = new Intl.NumberFormat('en-US',
			 				{ minimumFractionDigits: 0,
							  maximumFractionDigits: 0,}).format(royalties);
				var feesFormated = new Intl.NumberFormat('en-US',
		 				{ minimumFractionDigits: 0,
						  maximumFractionDigits: 0,}).format(fees);
				var totalFormated = new Intl.NumberFormat('en-US',
		 				{ minimumFractionDigits: 0,
						  maximumFractionDigits: 0,}).format(total);
				
				document.getElementById('royalty-price-value-cart').innerHTML = 
					royaltiesFormated;
				document.getElementById('fee-price-value-cart').innerHTML = 
					feesFormated;
				document.getElementById('total-price-value-cart').innerHTML = 
					totalFormated;
	 	    }
 		}
 		document.addEventListener('DOMContentLoaded', beachHousesAddedLoader);
 		
 		
 		
 		//Colour Glass
		const colourGlassAdded = sessionStorage.getItem('colourGlassAdded');
 		function colourGlassAddedLoader() {
	 	    if (colourGlassAdded === 'true') {
	 			document.getElementById('cart-empty-cart').style.display = "none";
	 			document.getElementById('cart-full-cart').style.display = "block";
	 			document.getElementById('colour-glass-cart').style.display = "flex";

		 	    royalties = (royalty * colourGlass + royalties);
		 	    fees = (fee * colourGlass + fees);
		 	    total = (total + colourGlass);
				
				var royaltiesFormated = new Intl.NumberFormat('en-US',
			 				{ minimumFractionDigits: 0,
							  maximumFractionDigits: 0,}).format(royalties);
				var feesFormated = new Intl.NumberFormat('en-US',
		 				{ minimumFractionDigits: 0,
						  maximumFractionDigits: 0,}).format(fees);
				var totalFormated = new Intl.NumberFormat('en-US',
		 				{ minimumFractionDigits: 0,
						  maximumFractionDigits: 0,}).format(total);
				
				document.getElementById('royalty-price-value-cart').innerHTML = 
					royaltiesFormated;
				document.getElementById('fee-price-value-cart').innerHTML = 
					feesFormated;
				document.getElementById('total-price-value-cart').innerHTML = 
					totalFormated;
	 	    }
 		}
 		document.addEventListener('DOMContentLoaded', colourGlassAddedLoader);
 		
 		
 		//Layers
		const layersAdded = sessionStorage.getItem('layersAdded');
 		function layersAddedLoader() {
	 	    if (layersAdded === 'true') {
	 			document.getElementById('cart-empty-cart').style.display = "none";
	 			document.getElementById('cart-full-cart').style.display = "block";
	 			document.getElementById('layers-cart').style.display = "flex";

		 	    royalties = (royalty * layers + royalties);
		 	    fees = (fee * layers + fees);
		 	    total = (total + layers);
				
				var royaltiesFormated = new Intl.NumberFormat('en-US',
			 				{ minimumFractionDigits: 0,
							  maximumFractionDigits: 0,}).format(royalties);
				var feesFormated = new Intl.NumberFormat('en-US',
		 				{ minimumFractionDigits: 0,
						  maximumFractionDigits: 0,}).format(fees);
				var totalFormated = new Intl.NumberFormat('en-US',
		 				{ minimumFractionDigits: 0,
						  maximumFractionDigits: 0,}).format(total);
				
				document.getElementById('royalty-price-value-cart').innerHTML = 
					royaltiesFormated;
				document.getElementById('fee-price-value-cart').innerHTML = 
					feesFormated;
				document.getElementById('total-price-value-cart').innerHTML = 
					totalFormated;
	 	    }
 		}
 		document.addEventListener('DOMContentLoaded', layersAddedLoader);
 		
 		
 		
 		
 		//Succinct Drop
		const succinctDropAdded = sessionStorage.getItem('succinctDropAdded');
 		function succinctDropAddedLoader() {
	 	    if (succinctDropAdded === 'true') {
	 			document.getElementById('cart-empty-cart').style.display = "none";
	 			document.getElementById('cart-full-cart').style.display = "block";
	 			document.getElementById('succinct-drop-cart').style.display = "flex";

		 	    royalties = (royalty * succinctDrop + royalties);
		 	    fees = (fee * succinctDrop + fees);
		 	    total = (total + succinctDrop);
				
				var royaltiesFormated = new Intl.NumberFormat('en-US',
			 				{ minimumFractionDigits: 0,
							  maximumFractionDigits: 0,}).format(royalties);
				var feesFormated = new Intl.NumberFormat('en-US',
		 				{ minimumFractionDigits: 0,
						  maximumFractionDigits: 0,}).format(fees);
				var totalFormated = new Intl.NumberFormat('en-US',
		 				{ minimumFractionDigits: 0,
						  maximumFractionDigits: 0,}).format(total);
				
				document.getElementById('royalty-price-value-cart').innerHTML = 
					royaltiesFormated;
				document.getElementById('fee-price-value-cart').innerHTML = 
					feesFormated;
				document.getElementById('total-price-value-cart').innerHTML = 
					totalFormated;
	 	    }
 		}
 		document.addEventListener('DOMContentLoaded', succinctDropAddedLoader);
 		
 		
 		
 		//Paint Rain
		const paintRainAdded = sessionStorage.getItem('paintRainAdded');
 		function paintRainAddedLoader() {
	 	    if (paintRainAdded === 'true') {
	 			document.getElementById('cart-empty-cart').style.display = "none";
	 			document.getElementById('cart-full-cart').style.display = "block";
	 			document.getElementById('paint-rain-cart').style.display = "flex";

		 	    royalties = (royalty * paintRain + royalties);
		 	    fees = (fee * paintRain + fees);
		 	    total = (total + paintRain);
				
				var royaltiesFormated = new Intl.NumberFormat('en-US',
			 				{ minimumFractionDigits: 0,
							  maximumFractionDigits: 0,}).format(royalties);
				var feesFormated = new Intl.NumberFormat('en-US',
		 				{ minimumFractionDigits: 0,
						  maximumFractionDigits: 0,}).format(fees);
				var totalFormated = new Intl.NumberFormat('en-US',
		 				{ minimumFractionDigits: 0,
						  maximumFractionDigits: 0,}).format(total);
				
				document.getElementById('royalty-price-value-cart').innerHTML = 
					royaltiesFormated;
				document.getElementById('fee-price-value-cart').innerHTML = 
					feesFormated;
				document.getElementById('total-price-value-cart').innerHTML = 
					totalFormated;
	 	    }
 		}
 		document.addEventListener('DOMContentLoaded', paintRainAddedLoader);
 		
 		
 // Purchase Completed Functions Below	
 
 		const blueOrangePurchased = sessionStorage.getItem('blueOrangePurchased');
 		const beachHousesPurchased = sessionStorage.getItem('beachHousesPurchased');
 		const colourGlassPurchased = sessionStorage.getItem('colourGlassPurchased');
 		const layersPurchased = sessionStorage.getItem('layersPurchased');
 		const paintRainPurchased = sessionsStorage.getItem('paintRainPurchased');
 		
		function completePurchase() {
			  if (blueOrangeAdded === 'true') {
				  sessionStorage.setItem('blueOrangePurchased', 'true');
		 			document.getElementById('cart-empty-cart').style.display = "block";
		 			document.getElementById('cart-full-cart').style.display = "none";
		 			document.getElementById('blue-orange-cart').style.display = "none";
				  document.getElementById('purchaseComplete').style.display = "block";
			  }
			  sessionStorage.removeItem('blueOrangeAdded');
			  if (beachHousesAdded === 'true') {
				  sessionStorage.setItem('beachHousesPurchased', 'true');
		 			document.getElementById('cart-empty-cart').style.display = "block";
		 			document.getElementById('cart-full-cart').style.display = "none";
		 			document.getElementById('beach-houses-cart').style.display = "none";
				  document.getElementById('purchaseComplete').style.display = "block";
			  }	
			  sessionStorage.removeItem('beachHousesAdded');
			  if (colourGlassAdded === 'true') {
				  sessionStorage.setItem('colourGlassPurchased', 'true');
		 			document.getElementById('cart-empty-cart').style.display = "block";
		 			document.getElementById('cart-full-cart').style.display = "none";
		 			document.getElementById('colour-glass-cart').style.display = "none";
				  document.getElementById('purchaseComplete').style.display = "block";
			  }
			  sessionStorage.removeItem('colourGlassAdded');
			  if (layersAdded === 'true') {
				  sessionStorage.setItem('layersPurchased', 'true');
		 			document.getElementById('cart-empty-cart').style.display = "block";
		 			document.getElementById('cart-full-cart').style.display = "none";
		 			document.getElementById('layers-cart').style.display = "none";
				  document.getElementById('purchaseComplete').style.display = "block";
			  }
			  sessionStorage.removeItem('layersAdded');
			  if (succinctDropAdded === 'true') {
				  sessionStorage.setItem('succinctDropPurchased', 'true');
		 			document.getElementById('cart-empty-cart').style.display = "block";
		 			document.getElementById('cart-full-cart').style.display = "none";
		 			document.getElementById('succinct-drop-cart').style.display = "none";
				  document.getElementById('purchaseComplete').style.display = "block";
			  }
			  sessionStorage.removeItem('succinctDropAdded');
			  if (paintRainAdded === 'true') {
				  sessionStorage.setItem('paintRainPurchased', 'true');
		 			document.getElementById('cart-empty-cart').style.display = "block";
		 			document.getElementById('cart-full-cart').style.display = "none";
		 			document.getElementById('paint-rain-cart').style.display = "none";
				  document.getElementById('purchaseComplete').style.display = "block";
			  }
			  sessionStorage.removeItem('paintRainAdded');
		}	
		
		function closePurchaseComplete() {
			  <!-- Change below link after test -->
			  window.location.href = '/prototype-buyer-collected-test';  
		}
		
		
 		
 		
<!-- Add To Cart & Purchase scrips above -->

<!-- Remove scripts below-->

		function removeBlueOrange() {
			document.getElementById('blue-orange-cart').style.display = "none";	
			
	 	    royalties = (royalties - (royalty * blueOrange));
	 	    fees = (fees - (fee * blueOrange));
	 	    total = (total - blueOrange);
			
			var royaltiesFormated = new Intl.NumberFormat('en-US',
		 				{ minimumFractionDigits: 0,
						  maximumFractionDigits: 0,}).format(royalties);
			var feesFormated = new Intl.NumberFormat('en-US',
	 				{ minimumFractionDigits: 0,
					  maximumFractionDigits: 0,}).format(fees);
			var totalFormated = new Intl.NumberFormat('en-US',
	 				{ minimumFractionDigits: 0,
					  maximumFractionDigits: 0,}).format(total);
			
			document.getElementById('royalty-price-value-cart').innerHTML = 
				royaltiesFormated;
			document.getElementById('fee-price-value-cart').innerHTML = 
				feesFormated;
			document.getElementById('total-price-value-cart').innerHTML = 
				totalFormated;
			
			if (document.getElementById('beach-houses-cart').style.display == "none"
				&& document.getElementById('colour-glass-cart').style.display == "none" 
				&& document.getElementById('layers-cart').style.display == "none"
				&& document.getElementById('succinct-drop-cart').style.display == "none"
				&& document.getElementById('paint-rain-cart').style.display == "none"){
					document.getElementById('cart-full-cart').style.display = "none";
					document.getElementById('cart-empty-cart').style.display = "block";
				}
			sessionStorage.removeItem('blueOrangeAdded');
		    location.reload();
		}	
		
		function removeBeachHouses() {
			document.getElementById('beach-houses-cart').style.display = "none";
			
	 	    royalties = (royalties - (royalty * beachHouses));
	 	    fees = (fees - (fee * beachHouses));
	 	    total = (total - beachHouses);
			
			var royaltiesFormated = new Intl.NumberFormat('en-US',
		 				{ minimumFractionDigits: 0,
						  maximumFractionDigits: 0,}).format(royalties);
			var feesFormated = new Intl.NumberFormat('en-US',
	 				{ minimumFractionDigits: 0,
					  maximumFractionDigits: 0,}).format(fees);
			var totalFormated = new Intl.NumberFormat('en-US',
	 				{ minimumFractionDigits: 0,
					  maximumFractionDigits: 0,}).format(total);
			
			document.getElementById('royalty-price-value-cart').innerHTML = 
				royaltiesFormated;
			document.getElementById('fee-price-value-cart').innerHTML = 
				feesFormated;
			document.getElementById('total-price-value-cart').innerHTML = 
				totalFormated;
			
			if (document.getElementById('blue-orange-cart').style.display == "none"
				&& document.getElementById('colour-glass-cart').style.display == "none" 
				&& document.getElementById('layers-cart').style.display == "none"
				&& document.getElementById('succinct-drop-cart').style.display == "none"
				&& document.getElementById('paint-rain-cart').style.display == "none"){
					document.getElementById('cart-full-cart').style.display = "none";
					document.getElementById('cart-empty-cart').style.display = "block";
				}	
			
			sessionStorage.removeItem('beachHousesAdded');
		    location.reload();	
		}	
		
		function removeColourGlass() {
			document.getElementById('colour-glass-cart').style.display = "none";
			
	 	    royalties = (royalties - (royalty * colourGlass));
	 	    fees = (fees - (fee * colourGlass));
	 	    total = (total - colourGlass);
			
			var royaltiesFormated = new Intl.NumberFormat('en-US',
		 				{ minimumFractionDigits: 0,
						  maximumFractionDigits: 0,}).format(royalties);
			var feesFormated = new Intl.NumberFormat('en-US',
	 				{ minimumFractionDigits: 0,
					  maximumFractionDigits: 0,}).format(fees);
			var totalFormated = new Intl.NumberFormat('en-US',
	 				{ minimumFractionDigits: 0,
					  maximumFractionDigits: 0,}).format(total);
			
			document.getElementById('royalty-price-value-cart').innerHTML = 
				royaltiesFormated;
			document.getElementById('fee-price-value-cart').innerHTML = 
				feesFormated;
			document.getElementById('total-price-value-cart').innerHTML = 
				totalFormated;
			
			if (document.getElementById('beach-houses-cart').style.display == "none"
				&& document.getElementById('blue-orange-cart').style.display == "none" 
				&& document.getElementById('layers-cart').style.display == "none"
				&& document.getElementById('succinct-drop-cart').style.display == "none"
				&& document.getElementById('paint-rain-cart').style.display == "none"){
					document.getElementById('cart-full-cart').style.display = "none";
					document.getElementById('cart-empty-cart').style.display = "block";
				}
			sessionStorage.removeItem('colourGlassAdded');
		    location.reload();
		}
		
		function removeLayers() {
			document.getElementById('layers-cart').style.display = "none";
			
	 	    royalties = (royalties - (royalty * layers));
	 	    fees = (fees - (fee * layers));
	 	    total = (total - layers);
			
			var royaltiesFormated = new Intl.NumberFormat('en-US',
		 				{ minimumFractionDigits: 0,
						  maximumFractionDigits: 0,}).format(royalties);
			var feesFormated = new Intl.NumberFormat('en-US',
	 				{ minimumFractionDigits: 0,
					  maximumFractionDigits: 0,}).format(fees);
			var totalFormated = new Intl.NumberFormat('en-US',
	 				{ minimumFractionDigits: 0,
					  maximumFractionDigits: 0,}).format(total);
			
			document.getElementById('royalty-price-value-cart').innerHTML = 
				royaltiesFormated;
			document.getElementById('fee-price-value-cart').innerHTML = 
				feesFormated;
			document.getElementById('total-price-value-cart').innerHTML = 
				totalFormated;

			if (document.getElementById('beach-houses-cart').style.display == "none"
				&& document.getElementById('colour-glass-cart').style.display == "none" 
				&& document.getElementById('blue-orange-cart').style.display == "none"
				&& document.getElementById('succinct-drop-cart').style.display == "none"
				&& document.getElementById('paint-rain-cart').style.display == "none"){
					document.getElementById('cart-full-cart').style.display = "none";
					document.getElementById('cart-empty-cart').style.display = "block";
				}
			sessionStorage.removeItem('layersAdded');
			location.reload();
		}
		
		function removeSuccinctDrop() {
			document.getElementById('succinct-drop-cart').style.display = "none";
			
	 	    royalties = (royalties - (royalty * succinctDrop));
	 	    fees = (fees - (fee * succinctDrop));
	 	    total = (total - succinctDrop);
			
			var royaltiesFormated = new Intl.NumberFormat('en-US',
		 				{ minimumFractionDigits: 0,
						  maximumFractionDigits: 0,}).format(royalties);
			var feesFormated = new Intl.NumberFormat('en-US',
	 				{ minimumFractionDigits: 0,
					  maximumFractionDigits: 0,}).format(fees);
			var totalFormated = new Intl.NumberFormat('en-US',
	 				{ minimumFractionDigits: 0,
					  maximumFractionDigits: 0,}).format(total);
			
			document.getElementById('royalty-price-value-cart').innerHTML = 
				royaltiesFormated;
			document.getElementById('fee-price-value-cart').innerHTML = 
				feesFormated;
			document.getElementById('total-price-value-cart').innerHTML = 
				totalFormated;			
			
			document.getElementById('succinct-drop-cart').style.display = "none";
			sessionStorage.removeItem('succinctDropAdded');
			if (document.getElementById('beach-houses-cart').style.display == "none"
				&& document.getElementById('colour-glass-cart').style.display == "none" 
				&& document.getElementById('layers-cart').style.display == "none"
				&& document.getElementById('blue-orange-cart').style.display == "none"
				&& document.getElementById('paint-rain-cart').style.display == "none"){
					document.getElementById('cart-full-cart').style.display = "none";
					document.getElementById('cart-empty-cart').style.display = "block";
				}
			sessionStorage.removeItem('succinctDropAdded');
			location.reload();
		}	
		
		function removePaintRain() {
			document.getElementById('paint-rain-cart').style.display = "none";
			
	 	    royalties = (royalties - (royalty * paintRain));
	 	    fees = (fees - (fee * paintRain));
	 	    total = (total - paintRain);
			
			var royaltiesFormated = new Intl.NumberFormat('en-US',
		 				{ minimumFractionDigits: 0,
						  maximumFractionDigits: 0,}).format(royalties);
			var feesFormated = new Intl.NumberFormat('en-US',
	 				{ minimumFractionDigits: 0,
					  maximumFractionDigits: 0,}).format(fees);
			var totalFormated = new Intl.NumberFormat('en-US',
	 				{ minimumFractionDigits: 0,
					  maximumFractionDigits: 0,}).format(total);
			
			document.getElementById('royalty-price-value-cart').innerHTML = 
				royaltiesFormated;
			document.getElementById('fee-price-value-cart').innerHTML = 
				feesFormated;
			document.getElementById('total-price-value-cart').innerHTML = 
				totalFormated;
			
			if (document.getElementById('beach-houses-cart').style.display == "none"
				&& document.getElementById('colour-glass-cart').style.display == "none" 
				&& document.getElementById('layers-cart').style.display == "none"
				&& document.getElementById('succinct-drop-cart').style.display == "none"
				&& document.getElementById('blue-orange-cart').style.display == "none"){
					document.getElementById('cart-full-cart').style.display = "none";
					document.getElementById('cart-empty-cart').style.display = "block";
				}
			sessionStorage.removeItem('paintRainAdded');
			location.reload();
		}		
<!-- Remove scripts above-->			



		</script>	
		
		

		<title>Prototype</title>
	
	</head>

<body>

	<!-- Modal/s below -->
	
		<div id="purchaseComplete" style="display: none;">
		  <div class="purchase-complete-content">
			<p id="purchase-complete-desc"> PURCHASE COMPLETE</p>
			<!-- Change below link after test -->
	    	<a class="close-purchase-complete" href="/prototype-buyer-collected-test"
	    	onClick="closePurchaseComplete()">
	    		VIEW COLLECTION</a>	
		  </div>
		</div>	
		
	<!-- Modal/s above -->	

	<div id="header-cart">
	
		<a id="icon-link-cart">
			<img id="arells-icon-cart" src="/icons&images/prototype/Arells-Icon-Home.png"/>
		</a>		
		<button id="cart-link-cart">
			<img id="cart-icon-cart" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</button>	
	</div>
	<img id="word-logo-cart" src="/icons&images/Arells-Logo-Ebony.png">	
	<p id="slogan-cart">ART SELLS</p>
	<div id="wallet-connected-div-cart">
		<hr id="connected-line-cart">
		<p id="wallet-connected-cart" >
		WALLET CONNECTED</p>
		<hr id="connected-line-cart">
	</div>	
	<div id="cart-empty-cart" style="display: block;">	
	
			<p id="no-art-cart">
			cart empty
			<img id="cart-icon-collected-cart" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</p>
	</div>
	<div id="cart-full-cart" style="display: none;">
		<div id="purchase-info-cart">
			<p id="royalty-cart">Creator Royalties</p>
			<p id="royalty-price-cart">$
				<span id="royalty-price-value-cart" style="display:inline"></span>
	        </p>
			<p id="fee-cart">Fees</p>
			<p id="fee-price-cart">$
				<span id="fee-price-value-cart" style="display:inline"></span>
	        </p>
			<p id="total-cart">Total</p>
		  	<p id="total-price-cart">$
				<span id="total-price-value-cart" style="display:inline"></span>
	        </p>
				<button id="purchase-cart" onClick="completePurchase()">
				COMPLETE PURCHASE</button>			
		</div>
		<div id="container-cart">
			  	<div id="blue-orange-cart" style="display: none;">
			  	<!-- Change below link after test -->
			  		<a href="/prototype-blue-orange-test" target="_self" id="photo-link-cart">
			  			<img id="photo-cart" src="/icons&images/prototype/1.jpg"/>
			  		</a>
			  		<div id="prices-cart">
				  		<div id="blue-orange-prices-before-cart">
					  		<p id="PAP-cart">Price After Purchase</p>
					  		<p id="PAP-blue-orange-before-cart">$60,000</p>
					  		<hr id="priceline-cart">
					  		<p id="yourprice-cart">Price</p>
					     	<p id="price-blue-orange-before-cart">$1,200</p>
				  		</div>					  		
			  		</div>
		  			<button id="remove-cart" onClick="removeBlueOrange()">
	     		    	<img id="del-cart" src="/icons&images/prototype/delete.png"/>
	     		    </button>
			    </div>
			  	<div id="beach-houses-cart" style="display: none;">
			  	<!-- Change below link after test -->
			  		<a href="/prototype-beach-houses-test" target="_self" id="photo-link-cart">
			  			<img id="photo-cart" src="/icons&images/prototype/2.jpg"/>
			  		</a>
			  		<div id="prices-cart">
				  		<div id="beach-houses-prices-before-cart">
					  		<p id="PAP-cart">Price After Purchase</p>
					  		<p id="PAP-beach-houses-before-cart">$10,000</p>
					  		<hr id="priceline-cart">
					  		<p id="yourprice-cart">Price</p>
					     	<p id="price-beach-houses-before-cart">$200</p>
				     	</div>
			  		</div>
		  			<button id="remove-cart" onClick="removeBeachHouses()">
	     		    	<img id="del-cart" src="/icons&images/prototype/delete.png"/>
	     		    </button>	     	
			    </div>
			     <div id="colour-glass-cart" style="display: none;">
			     <!-- Change below link after test -->
			  		<a href="/prototype-colour-glass-test" target="_self" id="photo-link-cart">
			  			<img id="photo-cart" src="/icons&images/prototype/3.jpg"/>
			  		</a>
			  		<div id="prices-cart">
				  		<div id="colour-glass-prices-before-cart">
					  		<p id="PAP-cart">Price After Purchase</p>
					  		<p id="PAP-colour-glass-before-cart">$725,000</p>
					  		<hr id="priceline-cart">
					  		<p id="yourprice-cart">Price</p>
					     	<p id="price-colour-glass-before-cart">$14,500</p>
				     	</div>			  		
			  		</div>
		  			<button id="remove-cart" onClick="removeColourGlass()">
	     		    	<img id="del-cart" src="/icons&images/prototype/delete.png"/>
	     		    </button>		     	
			    </div>
			  	<div id="layers-cart" style="display: none;">
				<!-- Change below link after test -->
			  		<a href="/prototype-layers-test" target="_self" id="photo-link-cart">
			  			<img id="photo-cart" src="/icons&images/prototype/4.jpg"/>
			  		</a>
			  		<div id="prices-cart">
				  		<div id="layers-prices-before-cart">
					  		<p id="PAP-cart">Price After Purchase</p>
					  		<p id="PAP-layers-before-cart">$20,000,000</p>
					  		<hr id="priceline-cart">
					  		<p id="yourprice-cart">Price</p>
					     	<p id="price-layers-before-cart">$400,000</p>
				     	</div>			  		
			  		</div>
		  			<button id="remove-cart" onClick="removeLayers()">
	     		    	<img id="del-cart" src="/icons&images/prototype/delete.png"/>
	     		    </button>
			    </div>
			  	<div id="succinct-drop-cart" style="display:none;">
			  	<!-- Change below link after test -->
		  			<a href="/prototype-succinct-drop-test" target="_self" id="photo-link-cart">
			  			<img id="photo-cart" src="/icons&images/prototype/5.jpg"/>
			  		</a>
			  		<div id="prices-cart">
					  	<div id="succinct-drop-prices-before-cart">
					  		<p id="PAP-cart">Price After Purchase</p>
					  		<p id="PAP-succinct-drop-before-cart">$5,000</p>
					  		<hr id="priceline-cart">
					  		<p id="yourprice-cart">Price</p>
					     	<p id="price-succinct-drop-before-cart">$100</p>
				     	</div>			  		
			  		</div>
		  			<button id="remove-cart" onClick="removeSuccinctDrop()">
	     		    	<img id="del-cart" src="/icons&images/prototype/delete.png"/>
	     		    </button>			     	
			    </div>
			     <div id="paint-rain-cart" style="display: none;">
				<!-- Change below link after test -->
			  		<a href="/prototype-paint-rain-test" target="_self" id="photo-link-cart">
			  			<img id="photo-cart" src="/icons&images/prototype/6.jpg"/>
			  		</a>
			  		<div id="prices-cart">
				  		<div id="paint-rain-prices-before-cart">
					  		<p id="PAP-cart">Price After Purchase</p>
					  		<p id="PAP-paint-rain-before-cart">$600,000</p>
					  		<hr id="priceline-cart">
					  		<p id="yourprice-cart">Price</p>
					     	<p id="price-paint-rain-before-cart">$12,000</p>
				     	</div>			  		
			  		</div>
		  			<button id="remove-cart" onClick="removePaintRain()">
	     		    	<img id="del-cart" src="/icons&images/prototype/delete.png"/>
	     		    </button>		     	
			    </div>
		</div>	
	</div>	
		<p id="prototype">PROTOTYPE</p>
</body>
	

</html>