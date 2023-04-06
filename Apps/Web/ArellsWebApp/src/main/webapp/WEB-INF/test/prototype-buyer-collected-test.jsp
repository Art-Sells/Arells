<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
	<head>
		
				<!-- Change below links after test -->
		<link rel="stylesheet" type="text/css" href="css/test/prototype-buyer-collected-test.css">	
		<link rel="stylesheet" type="text/css" href="css/test/copiedlink-test.css" />	
			
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
		<link rel="canonical" href="https://arells.com/prototype-buyer-collected-test">
		
		<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">	
		<meta property="og:site_name" content="Arells">	
		<meta property="og:type" content="object">				
		<meta property="og:title" content="Arells">
				<!-- Change below link after test -->
		<meta propety="og:url" content="https://arells.com/prototype-buyer-collected-test">
		<meta property="og:description" content="Art Sells">
		<meta property="og:image:type" content="image/jpg">
		<meta property="og:image:width" content="700">
		<meta property="og:image:height" content="400">
		
		<meta name="twitter:title" content="Art Sells">
		<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg">
				<!-- Change below link after test -->
		<meta name="twitter:url" content="https://arells.com/prototype-buyer-collected-test">
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
		// Open copyLink
		  document.getElementById('connectWalletBuy').style.display = "block";			
		  
		}	
	function walletConnected() {
		document.getElementById('connectWalletBuy').style.display = "none";
	}	
<!-- Connect Wallet script above-->
			
		
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
	
	<!-- Modal/s above -->	
	

	<div id="header">
	
	<!-- Change below link after test -->
		<a id="icon-link" href="/test">
			<img id="arells-icon" src="/icons&images/prototype/Arells-Icon-Home.png"/>
		</a>		
		<button id="cart-link" onClick="/">
			<img id="cart-icon" src="/icons&images/prototype/shopping-cart-empty.png"/>
		</button>	
	</div>
	<img id="word-logo" src="/icons&images/Arells-Logo-Ebony.png">	
	<p id="slogan">ART SELLS</p>
    <div id="profile-img-container">
		<img id="profile-photo" src="/icons&images/prototype/Unnamed-Icon.jpg">
	</div>	 
	<h1 id="name">Unnamed</h1>  
	<p id="description">Creator & Collector</p> 
	<button id="copy-link"
		onClick="copyLink()">
		<img id="copy-link-icon" src="/icons&images/prototype/link.png"/>
		COPY LINK</button>	
	<br>
	<hr id="profileline">
	<div id="created-collected">
		<!-- Change below link after test -->
		<a id="created" href="/prototype-buyer-created-test">Created</a>		
		<a id="collected">Collected</a>	
	</div>
	<div id="container">
		  	<div id="col">
		  		<a href="/ethereum" target="_self" id="photo-link">
		  			<img id="photo" src="/icons&images/prototype/1.jpg"/>
		  		</a>
		  		<p id="PAP">Price After Purchase</p>
		  		<p id="price2">$60,000</p>
		  		<hr id="priceline">
		  		<p id="yourprice">Price</p>
		     	<p id="price">$1,200</p>
	     		<a id="add-to-cart">ADD TO CART</a>	
		    </div>
		  	<div id="col">
		  		<a href="/ethereum" target="_self" id="photo-link">
		  			<img id="photo" src="/icons&images/prototype/2.jpg"/>
		  		</a>
		  		<p id="PAP">Price After Purchase</p>
		  		<p id="price2">$10,000</p>
		  		<hr id="priceline">
		  		<p id="yourprice">Price</p>
		     	<p id="price">$200</p>
	     		<a id="add-to-cart">
		     		ADD TO CART
		       </a>			     	
		    </div>
		     <div id="col">
		  		<a href="/ethereum" target="_self" id="photo-link">
		  			<img id="photo" src="/icons&images/prototype/3.jpg"/>
		  		</a>
		  		<p id="PAP">Price After Purchase</p>
		  		<p id="price2">$725,000</p>
		  		<hr id="priceline">
		  		<p id="yourprice">Price</p>
		     	<p id="price">$14,500</p>
	     		<a id="add-to-cart">
		     		ADD TO CART
		       </a>			     	
		    </div>
		  	<div id="col">
		  		<a href="/ethereum" target="_self" id="photo-link">
		  			<img id="photo" src="/icons&images/prototype/4.jpg"/>
		  		</a>
		  		<p id="PAP">Price After Purchase</p>
		  		<p id="price2">$20,000,000</p>
		  		<hr id="priceline">
		  		<p id="yourprice">Price</p>
		     	<p id="price">$400,000</p>
	     		<a id="add-to-cart">
		     		ADD TO CART
		       </a>	
		    </div>
		  	<div id="col">
		  		<a href="/ethereum" target="_self" id="photo-link">
		  			<img id="photo" src="/icons&images/prototype/5.jpg"/>
		  		</a>
		  		<p id="PAP">Price After Purchase</p>
		  		<p id="price2">$5,000</p>
		  		<hr id="priceline">
		  		<p id="yourprice">Price</p>
		     	<p id="price">$100</p>
	     		<a id="add-to-cart">
		     		ADD TO CART
		       </a>			     	
		    </div>
		     <div id="col">
		  		<a href="/ethereum" target="_self" id="photo-link">
		  			<img id="photo" src="/icons&images/prototype/6.jpg"/>
		  		</a>
		  		<p id="PAP">Price After Purchase</p>
		  		<p id="price2">$600,000</p>
		  		<hr id="priceline">
		  		<p id="yourprice">Price</p>
		     	<p id="price">$12,000</p>
	     		<a id="add-to-cart">
		     		ADD TO CART
		       </a>			     	
		    </div>
	</div>
</body>
</html>