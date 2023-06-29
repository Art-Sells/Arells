"use client";

// Change below link after test
import '../css/prototype/cart/cart.css';
import '../css/modals/purchase-complete.css';

import Head from 'next/head';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const prototypeCart = () => {

{/*<!-- useState constants below -->*/}
	const [purchaseComplete, setPurchaseComplete] = useState(false);

	const [cartEmptyCart, setCartEmptyCart] = useState(true);
	const [cartFullCart, setCartFullCart] = useState(false);

	const [blueOrangeCart, setBlueOrangeCart] = useState(false);
	const [beachHousesCart, setBeachHousesCart] = useState(false);
	const [colourGlassCart, setColourGlassCart] = useState(false);
	const [layersCart, setLayersCart] = useState(false);
	const [succinctDropCart, setSuccinctDropCart] = useState(false);
	const [paintRainCart, setPaintRainCart] = useState(false);
{/*<!-- useState constants above -->*/}

{/*<!-- Add To Cart & Purchase function/s below -->*/}

	// Function to format the numbers
	const formatCurrency = (amount) => {
		return new Intl.NumberFormat('en-US', {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	};

	var blueOrangePrice = 1200;
	var beachHousesPrice = 200;
	var colourGlassPrice = 14500;
	var layersPrice = 400000;
	var succinctDropPrice = 100;
	var paintRainPrice = 12000;

	//royalty before purchase
	var royalty = .97;
	//royalty after purchase (.90)
	//seller fee (.07)

	var fee = .03;

	const [royalties, setRoyalties] = useState(0);
	const [fees, setFees] = useState(0);
	const [total, setTotal] = useState(0);

	useEffect(() => {
		const blueOrangeAdded = sessionStorage.getItem('blueOrangeAdded');
		if (blueOrangeAdded === 'true') {
			setCartEmptyCart(false);
			setCartFullCart(true);
			setBlueOrangeCart(true);		

			setRoyalties(royalty * blueOrangePrice + royalties);
			setFees(fee * blueOrangePrice + fees);
			setTotal(total + blueOrangePrice);
		}
	}, []);


{/*<!-- Add To Cart & Purchase function/s above -->*/}


{/*<!-- Remove function/s below -->*/}
	function removeBlueOrange() {
		setBlueOrangeCart(false);	

		setRoyalties(royalties - (royalty * blueOrangePrice));
		setFees(fees - (fee * blueOrangePrice));
		setTotal(total - blueOrangePrice);

		if(beachHousesCart == false
			&& colourGlassCart == false
			&& layersCart == false
			&& succinctDropCart == false
			&& paintRainCart == false){
				setCartEmptyCart(true);
				setCartFullCart(false);
		}

		sessionStorage.setItem('blueOrangeAdded', 'false');
	}
	
{/*<!-- Remove function/s above -->*/}
	
    return (
        <>

		<Head>
			<meta name="robots" content="noimageindex" />

			<meta charset="UTF-8" />
			<meta http-equiv="X-UA-Compatible" content="IE=edge" />

			<meta name="title" content="Cart Prototype"/>
			<meta name="description" content="Prototype for Cart"/>
			<meta name="google" content="nositelinkssearchbox"/>
			<meta name="keywords" content="Arells"/>
			<meta name="author" content="Arells"/>
			<meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" />

			{/*<!-- Change below link after test -->*/}
			<link rel="canonical" href="https://arells.com/prototype-cart"/>

			<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg"/>	
			<meta property="og:site_name" content="Arells"/>	
			<meta property="og:type" content="website"/>				
			<meta property="og:title" content="Cart Prototype"/>
			{/*<!-- Change below link after test -->*/}
			<meta property="og:url" content="https://arells.com/prototype-cart"/>
			<meta property="og:description" content="Prototype for Cart"/>
			<meta property="og:image:type" content="image/jpg"/>
			<meta property="og:image:width" content="700"/>
			<meta property="og:image:height" content="400"/>

			<meta name="twitter:title" content="Cart Prototype"/>
			<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg"/>
			{/*<!-- Change below link after test -->*/}
			<meta name="twitter:url" content="https://arells.com/prototype-cart"/>
			<meta name="twitter:card" content="summary_large_image"/>
			<meta name="twitter:description" content="Prototype for Cart"/>
		</Head>

		<title>Prototype Cart</title>	

{/*<!-- Modals below link after test -->*/}
		{purchaseComplete && (
			<div id="purchaseComplete">
				<div className="purchase-complete-content">
				<p id="purchase-complete-desc"> PURCHASE COMPLETE</p>
				{/* Change below link after test */}
				<Link legacyBehavior href="/prototype-buyer-collected">
					<a className="close-purchase-complete">
						VIEW COLLECTION
					</a>	
				</Link>		
				</div>
			</div>	
		)}
{/*<!-- Modals Above -->*/}


		<div id="cart-wrapper">
			<div id="header-cart">
		
				<a id="icon-link-cart">
					<img id="arells-icon-cart" src="/icons&images/prototype/Arells-Icon-Home.png"/>
				</a>		
				<button id="cart-link-cart">
					<img id="cart-icon-cart" src="/icons&images/prototype/shopping-cart-empty.png"/>
				</button>	
			</div>
			<img id="word-logo-cart" src="/icons&images/Arells-Logo-Ebony.png"/>	
			<p id="slogan-cart">ART SELLS</p>
			<div id="wallet-connected-div-cart">
				<hr id="connected-line-cart"/>
				<p id="wallet-connected-cart" >
				WALLET CONNECTED</p>
				<hr id="connected-line-cart"/>
			</div>	
			{cartEmptyCart && (
				<div id="cart-empty-cart">	
					<p id="no-art-cart">
						cart empty
						<img id="cart-icon-collected-cart" src="/icons&images/prototype/shopping-cart-empty.png"/>
					</p>
				</div>
			)}
			{cartFullCart && (
				<div id="cart-full-cart">
					<div id="purchase-info-cart">
						<p id="royalty-cart">Creator Royalties</p>
						<p id="royalty-price-cart">$
							<span id="royalty-price-value-cart">
							{formatCurrency(royalties)}
							</span>
						</p>
						<p id="fee-cart">Fees</p>
						<p id="fee-price-cart">$
							<span id="fee-price-value-cart">
							{formatCurrency(fees)}
							</span>
						</p>
						<p id="total-cart">Total</p>
						<p id="total-price-cart">$
							<span id="total-price-value-cart">
							{formatCurrency(total)}
							</span>
						</p>
							<button id="purchase-cart" onClick="completePurchase()">
							COMPLETE PURCHASE</button>			
					</div>
					<div id="container-cart">
						{blueOrangeCart && (
							<div id="blue-orange-cart">
							{/* Change below link after test */}
								<Link legacyBehavior href="/prototype-blue-orange">
									<a target="_self" id="photo-link-cart">
										<img id="photo-cart" src="/icons&images/prototype/1.jpg"/>
									</a>
								</Link>	
								<div id="prices-cart">
									<div id="blue-orange-prices-before-cart">
										<p id="PAP-cart">Price After Purchase</p>
										<p id="PAP-blue-orange-before-cart">$60,000</p>
										<hr id="priceline-cart"/>
										<p id="yourprice-cart">Price</p>
										<p id="price-blue-orange-before-cart">$1,200</p>
									</div>					  		
								</div>
								<button id="remove-cart" onClick={removeBlueOrange}>
									<img id="del-cart" src="/icons&images/prototype/delete.png"/>
								</button>
							</div>
						)}
						{beachHousesCart && (
							<div id="beach-houses-cart">
							{/* Change below link after test */}
								<Link legacyBehavior href="/prototype-beach-houses">
									<a target="_self" id="photo-link-cart">
										<img id="photo-cart" src="/icons&images/prototype/2.jpg"/>
									</a>
								</Link>	
								<div id="prices-cart">
									<div id="beach-houses-prices-before-cart">
										<p id="PAP-cart">Price After Purchase</p>
										<p id="PAP-beach-houses-before-cart">$10,000</p>
										<hr id="priceline-cart"/>
										<p id="yourprice-cart">Price</p>
										<p id="price-beach-houses-before-cart">$200</p>
									</div>
								</div>
								<button id="remove-cart" onClick="removeBeachHouses()">
									<img id="del-cart" src="/icons&images/prototype/delete.png"/>
								</button>	     	
							</div>
						)}
						{colourGlassCart && (
							<div id="colour-glass-cart">
							{/* Change below link after test */}
								<Link legacyBehavior href="/prototype-colour-glass">
									<a target="_self" id="photo-link-cart">
										<img id="photo-cart" src="/icons&images/prototype/3.jpg"/>
									</a>
								</Link>	
								<div id="prices-cart">
									<div id="colour-glass-prices-before-cart">
										<p id="PAP-cart">Price After Purchase</p>
										<p id="PAP-colour-glass-before-cart">$725,000</p>
										<hr id="priceline-cart"/>
										<p id="yourprice-cart">Price</p>
										<p id="price-colour-glass-before-cart">$14,500</p>
									</div>			  		
								</div>
								<button id="remove-cart" onClick="removeColourGlass()">
									<img id="del-cart" src="/icons&images/prototype/delete.png"/>
								</button>		     	
							</div>
						)}
						{layersCart && (
							<div id="layers-cart">
							{/* Change below link after test */}
								<Link legacyBehavior href="/prototype-layers">
									<a target="_self" id="photo-link-cart">
										<img id="photo-cart" src="/icons&images/prototype/4.jpg"/>
									</a>
								</Link>	
								<div id="prices-cart">
									<div id="layers-prices-before-cart">
										<p id="PAP-cart">Price After Purchase</p>
										<p id="PAP-layers-before-cart">$20,000,000</p>
										<hr id="priceline-cart"/>
										<p id="yourprice-cart">Price</p>
										<p id="price-layers-before-cart">$400,000</p>
									</div>			  		
								</div>
								<button id="remove-cart" onClick="removeLayers()">
									<img id="del-cart" src="/icons&images/prototype/delete.png"/>
								</button>
							</div>
						)}
						{succinctDropCart && (
							<div id="succinct-drop-cart">
							{/* Change below link after test */}
								<Link legacyBehavior href="/prototype-succinct-drop">
									<a target="_self" id="photo-link-cart">
										<img id="photo-cart" src="/icons&images/prototype/5.jpg"/>
									</a>
								</Link>	
								<div id="prices-cart">
									<div id="succinct-drop-prices-before-cart">
										<p id="PAP-cart">Price After Purchase</p>
										<p id="PAP-succinct-drop-before-cart">$5,000</p>
										<hr id="priceline-cart"/>
										<p id="yourprice-cart">Price</p>
										<p id="price-succinct-drop-before-cart">$100</p>
									</div>			  		
								</div>
								<button id="remove-cart" onClick="removeSuccinctDrop()">
									<img id="del-cart" src="/icons&images/prototype/delete.png"/>
								</button>			     	
							</div>
						)}
						{paintRainCart && (
							<div id="paint-rain-cart">
							{/* Change below link after test */}
								<Link legacyBehavior href="/prototype-paint-rain">
									<a target="_self" id="photo-link-cart">
										<img id="photo-cart" src="/icons&images/prototype/6.jpg"/>
									</a>
								</Link>	
								<div id="prices-cart">
									<div id="paint-rain-prices-before-cart">
										<p id="PAP-cart">Price After Purchase</p>
										<p id="PAP-paint-rain-before-cart">$600,000</p>
										<hr id="priceline-cart"/>
										<p id="yourprice-cart">Price</p>
										<p id="price-paint-rain-before-cart">$12,000</p>
									</div>			  		
								</div>
								<button id="remove-cart" onClick="removePaintRain()">
									<img id="del-cart" src="/icons&images/prototype/delete.png"/>
								</button>		     	
							</div>
						)}
					</div>	
				</div>					

			)}			
				<h3 id="prototype-cart-word">PROTOTYPE</h3>
		</div>			
		     
        </>
    );
}

export default prototypeCart;