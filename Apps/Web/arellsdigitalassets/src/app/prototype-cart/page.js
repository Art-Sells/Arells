"use client";

// Change below link after test
import '../css/prototype/cart/cart.css';
import '../css/modals/copiedlink.css';
import '../css/modals/connect-wallet.css';

import Head from 'next/head'
import Link from 'next/link';

const prototypeSellerCreated = () => {



{/*<!-- Add To Cart & Purchase function/s below -->*/}

{/*<!-- Add To Cart & Purchase function/s above -->*/}


{/*<!-- Remove function/s below -->*/}
	
{/*<!-- Remove function/s above -->*/}
	
    return (
        <>

		<Head>
			<meta name="robots" content="noimageindex" />

			<meta charset="UTF-8" />
			<meta http-equiv="X-UA-Compatible" content="IE=edge" />

			<meta name="title" content="Seller Creations Prototype" />
			<meta name="description" content="Prototype for Seller Creations" />
			<meta name="google" content="nositelinkssearchbox" />
			<meta name="keywords" content="Arells" />
			<meta name="author" content="Arells" />
			<meta name="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" />

			{/*<!-- Change below link after test -->*/}
			<link rel="canonical" href="https://arells.com/prototype-seller-created" />

			<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg" />
			<meta property="og:site_name" content="Arells" />
			<meta property="og:type" content="website" />
			<meta property="og:title" content="Seller Creations Prototype" />
			{/*<!-- Change below link after test -->*/}
			<meta property="og:url" content="https://arells.com/prototype-seller-created" />
			<meta property="og:description" content="Prototype for Seller Creations" />
			<meta property="og:image:type" content="image/jpg" />
			<meta property="og:image:width" content="700" />
			<meta property="og:image:height" content="400" />

			<meta name="twitter:title" content="Seller Creations Prototype" />
			<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/230239850-3f9cf49a-4c5b-4775-b11c-649d5b37d73b.jpg" />
			{/*<!-- Change below link after test -->*/}
			<meta name="twitter:url" content="https://arells.com/prototype-seller-created" />
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:description" content="Prototype for Seller Creations" />
		</Head>

		<title>Prototype Cart</title>	

{/*<!-- Modals below link after test -->*/}
		{showCopiedLink && (
			<div id="copiedLink">
				<div className="modal-content">
				<p>LINK COPIED</p>
				<button className="close"
					onClick={closeCopiedLink}>OK</button>	
				</div>
			</div>	
		)}

		{showConnectWallet && (
			<div id="connectWalletBuy">
				<div className="connect-wallet-content">
					<p id="connect-wallet-words">CONNECT WALLET</p>
					<button id="connectWallet"
						onClick={walletConnected}>
						<img id="wallet-icon" src="/icons&images/prototype/coinbase-wallet-logo.png"/>
					</button>		
				</div>
			</div>	
		)}
{/*<!-- Modals Above -->*/}


		<div id="prototype-seller-created-wrapper">
				<div id="header-seller-created">
			
			{/*<!-- Change below link after test -->*/}
				<Link legacyBehavior href="/">
					<a id="icon-link-seller-created">
						<img id="arells-icon-seller-created" src="/icons&images/prototype/Arells-Icon-Home.png"/>
					</a>	
				</Link>							
				{cartLinkSellerCreated && (
					<button id="cart-link-seller-created" onClick={connectWallet}>
						<img id="cart-icon-seller-created" src="/icons&images/prototype/shopping-cart-empty.png"/>
					</button>
				)}	
				{cartLinkConnectedSellerCreated && (
					<Link legacyBehavior href="/prototype-cart">
						<a id="cart-link-connected-seller-created">
							<img id="cart-icon-seller-created" src="/icons&images/prototype/shopping-cart-empty.png"/>
						</a>
					</Link>	
				)}		
				{cartLinkFullSellerCreated && (
					<Link legacyBehavior href="/prototype-cart">
						<a id="cart-link-full-seller-created">
							<img id="cart-icon-seller-created" src="/icons&images/prototype/shopping-cart-full.png"/>
						</a>
					</Link>	
				)}	
			</div>
			<img id="word-logo-seller-created" src="/icons&images/Arells-Logo-Ebony.png"/>	
			<p id="slogan-seller-created">ART SELLS</p>
			{walletConnectedDivSellerCreated && (
				<div id="wallet-connected-div-seller-created">
					<hr id="connected-line-seller-created"/>
					<p id="wallet-connected-seller-created" >
					WALLET CONNECTED</p>
					<hr id="connected-line-seller-created"/>
				</div>
			)}	
			<div id="profile-img-container-seller-created">
				<img id="profile-photo-seller-created" src="/icons&images/prototype/proto-banner.jpg"/>
			</div>	 
			<h1 id="name-seller-created">Abstract Kadabra</h1>  
			<p id="description-seller-created">Here rests life's abstractions captured in majestic endeavors.</p> 
			<div id="share-div">
				<p id="share-div-desc">SHARE</p>
				<button id="copy-link-seller-created"
				onClick={copyLink}>
					<img id="copy-link-icon-seller-created" src="/icons&images/prototype/link.png"/>
				COPY LINK</button>	
			</div>
			<hr id="profileline-seller-created"/>
			<div id="created-collected-seller-created">
				<a id="created-seller-created">Created</a>	
			{/*<!-- Change below link after test -->*/}		
				<a id="collected-seller-created" href="/prototype-seller-collected">Collected</a>	
			</div>
			<div id="container-seller-created">
					<div id="blue-orange-seller-created">
					{/*<!-- Change below link after test -->*/}
						<Link legacyBehavior href="/prototype-blue-orange">
							<a target="_self" id="photo-link-seller-created">
								<img id="photo-seller-created" src="/icons&images/prototype/1.jpg"/>
							</a>
						</Link>	
						{blueOrangePricesBeforeSellerCreated && (
							<div id="blue-orange-prices-before-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-blue-orange-before-seller-created">$60,000</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-blue-orange-before-seller-created">$1,200</p>
							</div>	
						)}	
						{blueOrangePricesAfterSellerCreated && (
							<div id="blue-orange-prices-after-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-blue-orange-after-seller-created">$3,000,000</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-blue-orange-after-seller-created">$60,000</p>
							</div>	
						)}							
						{blueOrangeAddToCartSellerCreated && (
							<button id="blue-orange-add-to-cart-seller-created" 
							onClick={connectWallet}>
							ADD TO CART</button>
						)}	
						{blueOrangeAddToCartConnectedSellerCreated && (
							<button id="blue-orange-add-to-cart-connected-seller-created" 
							onClick={addBlueOrangeToCart}>
							ADD TO CART</button>
						)}	
						{blueOrangeAddedSellerCreated && (
							<button id="blue-orange-added-seller-created">
							ADDED</button>	
						)}	
						{blueOrangeCollectedSellerCreated && (
							<button id="blue-orange-collected-seller-created">
							COLLECTED</button>	
						)}								
					</div>
					<div id="beach-houses-seller-created">
					{/*<!-- Change below link after test -->*/}
						<Link legacyBehavior href="/prototype-beach-houses">
							<a target="_self" id="photo-link-seller-created">
								<img id="photo-seller-created" src="/icons&images/prototype/2.jpg"/>
							</a>
						</Link>	
						{beachHousesPricesBeforeSellerCreated && (
							<div id="beach-houses-prices-before-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-beach-houses-before-seller-created">$10,000</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-beach-houses-before-seller-created">$200</p>
							</div>
						)}	
						{beachHousesPricesAfterSellerCreated && (
							<div id="beach-houses-prices-after-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-beach-houses-after-seller-created">$500,000</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-beach-houses-after-seller-created">$10,000</p>
							</div>
						)}							
						{beachHousesAddToCartSellerCreated && (
							<button id="beach-houses-add-to-cart-seller-created" 
							onClick={connectWallet}>
							ADD TO CART</button>
						)}							
						{beachHousesAddToCartConnectedSellerCreated && (
							<button id="beach-houses-add-to-cart-connected-seller-created" 
							onClick={addBeachHousesToCart}>
							ADD TO CART</button>
						)}							
						{beachHousesAddedSellerCreated && (
							<button id="beach-houses-added-seller-created">
							ADDED</button>	
						)}							
						{beachHousesCollectedSellerCreated && (
							<button id="beach-houses-collected-seller-created">
							COLLECTED</button>	
						)}									     	
					</div>
					<div id="colour-glass-seller-created">
					{/*<!-- Change below link after test -->*/}
						<Link legacyBehavior href="/prototype-colour-glass">
							<a target="_self" id="photo-link-seller-created">
								<img id="photo-seller-created" src="/icons&images/prototype/3.jpg"/>
							</a>
						</Link>	
						{colourGlassPricesBeforeSellerCreated && (
							<div id="colour-glass-prices-before-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-colour-glass-before-seller-created">$725,000</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-colour-glass-before-seller-created">$14,500</p>
							</div>
						)}								
						{colourGlassPricesAfterSellerCreated && (
							<div id="colour-glass-prices-after-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-colour-glass-after-seller-created">$36,250,000</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-colour-glass-after-seller-created">$725,000</p>
							</div>
						)}								
						{colourGlassAddToCartSellerCreated && (
							<button id="colour-glass-add-to-cart-seller-created" 
							onClick={connectWallet}>
							ADD TO CART</button>
						)}							
						{colourGlassAddToCartConnectedSellerCreated && (
							<button id="colour-glass-add-to-cart-connected-seller-created" 
							onClick={addColourGlassToCart}>
							ADD TO CART</button>
						)}	
						{colourGlassAddedSellerCreated && (
							<button id="colour-glass-added-seller-created">
							ADDED</button>	
						)}								
						{colourGlassCollectedSellerCreated && (
							<button id="colour-glass-collected-seller-created">
							COLLECTED</button>	
						)}			     	
					</div>
					<div id="layers-seller-created">
					{/*<!-- Change below link after test -->*/}
						<Link legacyBehavior href="/prototype-layers">
							<a target="_self" id="photo-link-seller-created">
								<img id="photo-seller-created" src="/icons&images/prototype/4.jpg"/>
							</a>
						</Link>	
						{layersPricesBeforeSellerCreated && (
							<div id="layers-prices-before-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-layers-before-seller-created">$20,000,000</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-layers-before-seller-created">$400,000</p>
							</div>
						)}							
						{layersPricesAfterSellerCreated && (
							<div id="layers-prices-after-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-layers-after-seller-created">$1,000,000,000</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-layers-after-seller-created">$20,000,000</p>
							</div>
						)}							
						{layersAddToCartSellerCreated && (
							<button id="layers-add-to-cart-seller-created" 
							onClick={connectWallet}>
							ADD TO CART</button>
						)}							
						{layersAddToCartConnectedSellerCreated && (
							<button id="layers-add-to-cart-connected-seller-created" 
							onClick={addLayersToCart}>
							ADD TO CART</button>
						)}								
						{layersAddedSellerCreated && (
							<button id="layers-added-seller-created">
							ADDED</button>	
						)}								
						{layersCollectedSellerCreated && (
							<button id="layers-collected-seller-created">
							COLLECTED</button>	
						)}							
					</div>
					<div id="succinct-drop-seller-created">
					{/*<!-- Change below link after test -->*/}
						<Link legacyBehavior href="/prototype-succinct-drop">
							<a target="_self" id="photo-link-seller-created">
								<img id="photo-seller-created" src="/icons&images/prototype/5.jpg"/>
							</a>
						</Link>	
						{succinctDropPricesBeforeSellerCreated && (
							<div id="succinct-drop-prices-before-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-succinct-drop-before-seller-created">$5,000</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-succinct-drop-before-seller-created">$100</p>
							</div>
						)}							
						{succinctDropPricesAfterSellerCreated && (
							<div id="succinct-drop-prices-after-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-succinct-drop-after-seller-created">$250,000</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-succinct-drop-after-seller-created">$5,000</p>
							</div>
						)}	
						{succinctDropAddToCartSellerCreated && (
							<button id="succinct-drop-add-to-cart-seller-created" 
							onClick={connectWallet}>
							ADD TO CART</button>
						)}							
						{succinctDropAddToCartConnectedSellerCreated && (
							<button id="succinct-drop-add-to-cart-connected-seller-created" 
							onClick={addSuccinctDropToCart}>
							ADD TO CART</button>
						)}							
						{succinctDropAddedSellerCreated && (
							<button id="succinct-drop-added-seller-created">
							ADDED</button>	
						)}								
						{succinctDropCollectedSellerCreated && (
							<button id="succinct-drop-collected-seller-created">
							COLLECTED</button>	
						)}				     	
					</div>
					<div id="paint-rain-seller-created">
					{/*<!-- Change below link after test -->*/}
						<Link legacyBehavior href="/prototype-paint-rain">
							<a target="_self" id="photo-link-seller-created">
								<img id="photo-seller-created" src="/icons&images/prototype/6.jpg"/>
							</a>
						</Link>			
						{paintRainPricesBeforeSellerCreated && (
							<div id="paint-rain-prices-before-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-paint-rain-before-seller-created">$600,000</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-paint-rain-before-seller-created">$12,000</p>
							</div>
						)}							
						{paintRainPricesAfterSellerCreated && (
							<div id="paint-rain-prices-after-seller-created">
								<p id="PAP-seller-created">Price After Purchase</p>
								<p id="PAP-paint-rain-after-seller-created">$30,000,000</p>
								<hr id="priceline-seller-created"/>
								<p id="yourprice-seller-created">Price</p>
								<p id="price-paint-rain-after-seller-created">$600,000</p>
							</div>
						)}	
						{paintRainAddToCartSellerCreated && (
							<button id="paint-rain-add-to-cart-seller-created" 
							onClick={connectWallet}>
							ADD TO CART</button>
						)}	
						{paintRainAddToCartConnectedSellerCreated && (
							<button id="paint-rain-add-to-cart-connected-seller-created" 
							onClick={addPaintRainToCart}>
							ADD TO CART</button>
						)}	
						{paintRainAddedSellerCreated && (
							<button id="paint-rain-added-seller-created">
							ADDED</button>	
						)}	
						{paintRainCollectedSellerCreated && (
							<button id="paint-rain-collected-seller-created">
							COLLECTED</button>	
						)}			     	
					</div>
			</div>
				<p id="prototypePage">PROTOTYPE</p>
		</div>			
		     
        </>
    );
}

export default prototypeSellerCreated;