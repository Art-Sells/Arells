<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
	<head>
		
				<!-- Change below links after test -->
		<link rel="stylesheet" type="text/css" href="css/test/prototype/cart/cart-test.css">	
		<link rel="stylesheet" type="text/css" href="css/test/prototype/modals/purchase-complete-test.css" />
			
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
		<link rel="canonical" href="https://arells.com/prototype-cart-test">
		
		<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">	
		<meta property="og:site_name" content="Arells">	
		<meta property="og:type" content="object">				
		<meta property="og:title" content="Arells">
				<!-- Change below link after test -->
		<meta propety="og:url" content="https://arells.com/prototype-cart-test">
		<meta property="og:description" content="Art Sells">
		<meta property="og:image:type" content="image/jpg">
		<meta property="og:image:width" content="700">
		<meta property="og:image:height" content="400">
		
		<meta name="twitter:title" content="Art Sells">
		<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">
				<!-- Change below link after test -->
		<meta name="twitter:url" content="https://arells.com/prototype-cart-test">
		<meta name="twitter:card" content="summary_large_image">
		<meta name="twitter:description" content="Arells">
		<meta name="description" content="Arells">
<!-- Above information for social media sharing and search-engine/browser optimization -->	

		<script>
		
		
<!-- Add To Cart scrips below -->	

// Ensure that Image displays show as FLEX after adding, cart-full: block

		function updatePrices(){
	
			var blueOrange = 1200;
			var beachHouses = 200;
			var colourGlass = 14500;
			var layers = 400000;
			var succinctDrop = 100;
			var paintRain = 12000;
			
			var royalty = .9;
			var fee = .03;
			
			var royalties;
			var fees;
			var total;
			
			if (document.getElementById('blue-orange').style.display == "flex"){
				
				royalties = (blueOrange * royalty);
				fees = (blueOrange * fee);
				total = blueOrange;
				
				document.getElementById('royalty-price-value').innerHTML = 
					royalties;
				document.getElementById('fee-price-value').innerHTML = 
					fees;
				document.getElementById('total-price-value').innerHTML = 
					total;
			}		
			
		}

<!-- Add To Cart scrips above -->

<!-- Remove scripts below-->

		function removeBlueOrange() {
			document.getElementById('blue-orange').style.display = "none";	
			if (document.getElementById('beach-houses').style.display == "none"
				&& document.getElementById('colour-glass').style.display == "none" 
				&& document.getElementById('layers').style.display == "none"
				&& document.getElementById('succinct-drop').style.display == "none"
				&& document.getElementById('paint-rain').style.display == "none"){
					document.getElementById('cart-full').style.display = "none";
					document.getElementById('cart-empty').style.display = "block";
				}
		}	
		function removeBeachHouses() {
			document.getElementById('beach-houses').style.display = "none";	
			if (document.getElementById('blue-orange').style.display == "none"
				&& document.getElementById('colour-glass').style.display == "none" 
				&& document.getElementById('layers').style.display == "none"
				&& document.getElementById('succinct-drop').style.display == "none"
				&& document.getElementById('paint-rain').style.display == "none"){
					document.getElementById('cart-full').style.display = "none";
					document.getElementById('cart-empty').style.display = "block";
				}			
		}		
		function removeColourGlass() {
			document.getElementById('colour-glass').style.display = "none";	
			if (document.getElementById('beach-houses').style.display = "none"
				&& document.getElementById('blue-orange').style.display == "none" 
				&& document.getElementById('layers').style.display == "none"
				&& document.getElementById('succinct-drop').style.display == "none"
				&& document.getElementById('paint-rain').style.display == "none"){
					document.getElementById('cart-full').style.display = "none";
					document.getElementById('cart-empty').style.display = "block";
				}			
		}
		function removeLayers() {
			document.getElementById('layers').style.display = "none";
			if (document.getElementById('beach-houses').style.display == "none"
				&& document.getElementById('colour-glass').style.display == "none" 
				&& document.getElementById('blue-orange').style.display == "none"
				&& document.getElementById('succinct-drop').style.display == "none"
				&& document.getElementById('paint-rain').style.display == "none"){
					document.getElementById('cart-full').style.display = "none";
					document.getElementById('cart-empty').style.display = "block";
				}			
		}
		function removeSuccinctDrop() {
			document.getElementById('succinct-drop').style.display = "none";
			if (document.getElementById('beach-houses').style.display == "none"
				&& document.getElementById('colour-glass').style.display == "none" 
				&& document.getElementById('layers').style.display == "none"
				&& document.getElementById('blue-orange').style.display == "none"
				&& document.getElementById('paint-rain').style.display == "none"){
					document.getElementById('cart-full').style.display = "none";
					document.getElementById('cart-empty').style.display = "block";
				}			
		}		
		function removePaintRain() {
			document.getElementById('paint-rain').style.display = "none";
			if (document.getElementById('beach-houses').style.display == "none"
				&& document.getElementById('colour-glass').style.display == "none" 
				&& document.getElementById('layers').style.display == "none"
				&& document.getElementById('succinct-drop').style.display == "none"
				&& document.getElementById('blue-orange').style.display == "none"){
					document.getElementById('cart-full').style.display = "none";
					document.getElementById('cart-empty').style.display = "block";
				}			
		}		
<!-- Remove scripts above-->	


<!-- Complete Purchase scripts below-->	

		function completePurchase() {
			  document.getElementById('purchaseComplete').style.display = "block";
		}	
		function closePurchaseComplete() {
			  document.getElementById('purchaseComplete').style.display = "none";
		}	
				

<!-- Complete Purchase scripts above-->	



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

	<div id="header">
	
		<a id="icon-link">
			<img id="arells-icon" src="/icons&images/prototype/Arells-Icon-Home.png"/>
		</a>		
		<button id="cart-link">
			<img id="cart-icon" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</button>	
	</div>
	<img id="word-logo" src="/icons&images/Arells-Logo-Ebony.png">	
	<p id="slogan">ART SELLS</p>
	<div id="wallet-connected-div">
		<hr id="connected-line">
		<p id="wallet-connected" >
		WALLET CONNECTED</p>
		<hr id="connected-line">
	</div>	
	<div id="cart-empty" style="display: none;">
			<p id="no-art">
			cart empty
			<img id="cart-icon-collected" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</p>
	</div>
	<div id="cart-full" style="display: block;">
		<p id="royalty">Creator Royalties</p>
		<p id="royalty-price">$
			<span id="royalty-price-value" style="display:inline"></span>
        </p>
		<p id="fee">Fees</p>
		<p id="fee-price">$
			<span id="fee-price-value" style="display:inline"></span>
        </p>
		<p id="total">Total</p>
	  	<p id="total-price">$
			<span id="total-price-value" style="display:inline"></span>
        </p>
			<button id="purchase" onClick="completePurchase()">
			COMPLETE PURCHASE</button>	
		<hr id="profileline"> 
		<div id="container">
			  	<div id="blue-orange" style="display: flex;">
			  	<!-- Change below link after test -->
			  		<a href="/prototype-blue-orange-test" target="_self" id="photo-link">
			  			<img id="photo" src="/icons&images/prototype/1.jpg"/>
			  		</a>
			  		<div id="prices">
				  		<div id="blue-orange-prices-before">
					  		<p id="PAP">Price After Purchase</p>
					  		<p id="PAP-blue-orange-before">$60,000</p>
					  		<hr id="priceline">
					  		<p id="yourprice">Price</p>
					     	<p id="price-blue-orange-before">$1,200</p>
				  		</div>					  		
			  		</div>
		  			<button id="remove" onClick="removeBlueOrange()">
	     		    	<img id="del" src="/icons&images/prototype/delete.png"/>
	     		    </button>
			    </div>
			  	<div id="beach-houses" style="display: none;">
			  	<!-- Change below link after test -->
			  		<a href="/prototype-beach-houses-test" target="_self" id="photo-link">
			  			<img id="photo" src="/icons&images/prototype/2.jpg"/>
			  		</a>
			  		<div id="prices">
				  		<div id="beach-houses-prices-before">
					  		<p id="PAP">Price After Purchase</p>
					  		<p id="PAP-beach-houses-before">$10,000</p>
					  		<hr id="priceline">
					  		<p id="yourprice">Price</p>
					     	<p id="price-beach-houses-before">$200</p>
				     	</div>
			  		</div>
		  			<button id="remove" onClick="removeBeachHouses()">
	     		    	<img id="del" src="/icons&images/prototype/delete.png"/>
	     		    </button>	     	
			    </div>
			     <div id="colour-glass" style="display: none;">
			     <!-- Change below link after test -->
			  		<a href="/prototype-colour-glass-test" target="_self" id="photo-link">
			  			<img id="photo" src="/icons&images/prototype/3.jpg"/>
			  		</a>
			  		<div id="prices">
				  		<div id="colour-glass-prices-before">
					  		<p id="PAP">Price After Purchase</p>
					  		<p id="PAP-colour-glass-before">$725,000</p>
					  		<hr id="priceline">
					  		<p id="yourprice">Price</p>
					     	<p id="price-colour-glass-before">$14,500</p>
				     	</div>			  		
			  		</div>
		  			<button id="remove" onClick="removeColourGlass()">
	     		    	<img id="del" src="/icons&images/prototype/delete.png"/>
	     		    </button>		     	
			    </div>
			  	<div id="layers" style="display: none;">
				<!-- Change below link after test -->
			  		<a href="/prototype-layers-test" target="_self" id="photo-link">
			  			<img id="photo" src="/icons&images/prototype/4.jpg"/>
			  		</a>
			  		<div id="prices">
				  		<div id="layers-prices-before">
					  		<p id="PAP">Price After Purchase</p>
					  		<p id="PAP-layers-before">$20,000,000</p>
					  		<hr id="priceline">
					  		<p id="yourprice">Price</p>
					     	<p id="price-layers-before">$400,000</p>
				     	</div>			  		
			  		</div>
		  			<button id="remove" onClick="removeLayers()">
	     		    	<img id="del" src="/icons&images/prototype/delete.png"/>
	     		    </button>
			    </div>
			  	<div id="succinct-drop" style="display:none;">
			  	<!-- Change below link after test -->
		  			<a href="/prototype-succinct-drop-test" target="_self" id="photo-link">
			  			<img id="photo" src="/icons&images/prototype/5.jpg"/>
			  		</a>
			  		<div id="prices">
					  	<div id="succinct-drop-prices-before">
					  		<p id="PAP">Price After Purchase</p>
					  		<p id="PAP-succinct-drop-before">$5,000</p>
					  		<hr id="priceline">
					  		<p id="yourprice">Price</p>
					     	<p id="price-succinct-drop-before">$100</p>
				     	</div>			  		
			  		</div>
		  			<button id="remove" onClick="removeSuccinctDrop()">
	     		    	<img id="del" src="/icons&images/prototype/delete.png"/>
	     		    </button>			     	
			    </div>
			     <div id="paint-rain" style="display: none;">
				<!-- Change below link after test -->
			  		<a href="/prototype-paint-rain-test" target="_self" id="photo-link">
			  			<img id="photo" src="/icons&images/prototype/6.jpg"/>
			  		</a>
			  		<div id="prices">
				  		<div id="paint-rain-prices-before">
					  		<p id="PAP">Price After Purchase</p>
					  		<p id="PAP-paint-rain-before">$600,000</p>
					  		<hr id="priceline">
					  		<p id="yourprice">Price</p>
					     	<p id="price-paint-rain-before">$12,000</p>
				     	</div>			  		
			  		</div>
		  			<button id="remove" onClick="removePaintRain()">
	     		    	<img id="del" src="/icons&images/prototype/delete.png"/>
	     		    </button>		     	
			    </div>
		</div>	
	</div>	

</body>
</html>