"use client";

// Change below link after test
import '../../../app/css/prototype/cart/cart.css';
import '../../../app/css/modals/purchase-complete.css';

//Loader Styles
import '../../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../../app/css/modals/loading/spinner.module.css';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const PrototypeCart = () => {

	const imageLoader = ({ src, width, quality }) => {
		return `https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/${src}?w=${width}&q=${quality || 100}`
	  }

		//Loader Functions
		const [showLoading, setLoading] = useState(true);
		const [imagesLoaded, setImagesLoaded] = useState({
		arellsIconCart: false,
		cartIconCart: false,
		wordLogoCart: false,
		});
		const handleImageLoaded = (imageName) => {
		setImagesLoaded(prevState => ({ 
			...prevState, 
			[imageName]: true 
		}));
		};
		useEffect(() => {
		if (Object.values(imagesLoaded).every(Boolean)) {
			setLoading(false);
		}
		}, [imagesLoaded]);

		const [showLoadingCart, setLoadingCart] = useState(true);
		const [imagesCartLoaded, setImagesCartLoaded] = useState({
			cartIconCollectedCart: false,	
		});
		const handleImageCartLoaded = (imageName) => {
		setImagesCartLoaded(prevState => ({ 
			...prevState, 
			[imageName]: true 
		}));
		};
		useEffect(() => {
		if (Object.values(imagesCartLoaded).every(Boolean)) {
			setLoadingCart(false);
		}
		}, [imagesCartLoaded]);

		const [showLoadingOne, setLoadingOne] = useState(false);
		const [imagesOneLoaded, setImagesOneLoaded] = useState({
		photoCartOne: false,
		});
		const handleImageOneLoaded = (imageName) => {
		setImagesOneLoaded(prevState => ({ 
			...prevState, 
			[imageName]: true 
		}));
		};
		useEffect(() => {
		if (Object.values(imagesOneLoaded).every(Boolean)) {
			setLoadingOne(false);
		}
		}, [imagesOneLoaded]);

		const [showLoadingTwo, setLoadingTwo] = useState(false);
		const [imagesTwoLoaded, setImagesTwoLoaded] = useState({
		photoCartTwo: false,
		});
		const handleImageTwoLoaded = (imageName) => {
		setImagesTwoLoaded(prevState => ({ 
			...prevState, 
			[imageName]: true 
		}));
		};
		useEffect(() => {
		if (Object.values(imagesTwoLoaded).every(Boolean)) {
			setLoadingTwo(false);
		}
		}, [imagesTwoLoaded]);

		const [showLoadingThree, setLoadingThree] = useState(false);
		const [imagesThreeLoaded, setImagesThreeLoaded] = useState({
		photoCartThree: false,
		});
		const handleImageThreeLoaded = (imageName) => {
		setImagesThreeLoaded(prevState => ({ 
			...prevState, 
			[imageName]: true 
		}));
		};
		useEffect(() => {
		if (Object.values(imagesThreeLoaded).every(Boolean)) {
			setLoadingThree(false);
		}
		}, [imagesThreeLoaded]);

		const [showLoadingFour, setLoadingFour] = useState(false);
		const [imagesFourLoaded, setImagesFourLoaded] = useState({
		photoCartFour: false,
		});
		const handleImageFourLoaded = (imageName) => {
		setImagesFourLoaded(prevState => ({ 
			...prevState, 
			[imageName]: true 
		}));
		};
		useEffect(() => {
		if (Object.values(imagesFourLoaded).every(Boolean)) {
			setLoadingFour(false);
		}
		}, [imagesFourLoaded]);

		const [showLoadingFive, setLoadingFive] = useState(false);
		const [imagesFiveLoaded, setImagesFiveLoaded] = useState({
		photoCartFive: false,
		});
		const handleImageFiveLoaded = (imageName) => {
		setImagesFiveLoaded(prevState => ({ 
			...prevState, 
			[imageName]: true 
		}));
		};
		useEffect(() => {
		if (Object.values(imagesFiveLoaded).every(Boolean)) {
			setLoadingFive(false);
		}
		}, [imagesFiveLoaded]);

		const [showLoadingSix, setLoadingSix] = useState(false);
		const [imagesSixLoaded, setImagesSixLoaded] = useState({
		photoCartSix: false,
		});
		const handleImageSixLoaded = (imageName) => {
		setImagesSixLoaded(prevState => ({ 
			...prevState, 
			[imageName]: true 
		}));
		};
		useEffect(() => {
		if (Object.values(imagesSixLoaded).every(Boolean)) {
			setLoadingSix(false);
		}
		}, [imagesSixLoaded]);







{/*<!-- useState constants below -->*/}
	const [purchaseComplete, setPurchaseComplete] = useState(false);

	const [cartEmptyCart, setCartEmptyCart] = useState(true);
	const [cartFullCart, setCartFullCart] = useState(false);
	const [walletConnectedDivCart, setWalletConnectedDivCart] = useState(false);

	const [blueOrangeCart, setBlueOrangeCart] = useState(false);
	const [beachHousesCart, setBeachHousesCart] = useState(false);
	const [colourGlassCart, setColourGlassCart] = useState(false);
	const [layersCart, setLayersCart] = useState(false);
	const [succinctDropCart, setSuccinctDropCart] = useState(false);
	const [paintRainCart, setPaintRainCart] = useState(false);
{/*<!-- useState constants above -->*/}

{/*<!-- Connect Wallet function/s below -->*/}

	const [walletConnectedSession, setWalletConnectedSession] = useState(null);
	useEffect(() => {
	const sessionValue = sessionStorage.getItem('walletConnectedSession');
	setWalletConnectedSession(sessionValue);
	}, []);
	useEffect(() => {
		if (walletConnectedSession === 'true') {			
			setWalletConnectedDivCart(true);
		}
	}, [walletConnectedSession]);

{/*<!-- Connect Wallet function/s above -->*/}

{/*<!-- Add To Cart & Purchase function/s below -->*/}

	// Function to format the numbers
	const formatCurrency = (amount) => {
		return new Intl.NumberFormat('en-US', {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	};

	var blueOrangePrice = 1200;
	var beachHousesPrice = 300;
	var colourGlassPrice = 500;
	var layersPrice = 1500;
	var succinctDropPrice = 100;
	var paintRainPrice = 12000;

	//royalty before purchase
	var royalty = .5;
	//royalty after purchase (.50)
	//seller fee (.07)

	var fee = .03;

	const [royalties, setRoyalties] = useState(0);
	const [fees, setFees] = useState(0);
	const [total, setTotal] = useState(0);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const blueOrangeAdded = sessionStorage.getItem('blueOrangeAdded');
			if (blueOrangeAdded === 'true') {
				setCartEmptyCart(false);
				setCartFullCart(true);
				setBlueOrangeCart(true);	
				setLoadingOne(true);	
				setLoadingCart(false);
	
				setRoyalties(prevRoyalties => royalty * blueOrangePrice + prevRoyalties);
				setFees(prevFees => fee * blueOrangePrice + prevFees);
				setTotal(prevTotal => blueOrangePrice + prevTotal);
			}
		  }
		
	}, [royalty, blueOrangePrice, fee]);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const beachHousesAdded = sessionStorage.getItem('beachHousesAdded');
			if (beachHousesAdded === 'true') {
				setCartEmptyCart(false);
				setCartFullCart(true);
				setBeachHousesCart(true);	
				setLoadingTwo(true);
				setLoadingCart(false);	
	
				setRoyalties(prevRoyalties => royalty * beachHousesPrice + prevRoyalties);
				setFees(prevFees => fee * beachHousesPrice + prevFees);
				setTotal(prevTotal => beachHousesPrice + prevTotal);
			}
		  }
	}, [royalty, beachHousesPrice, fee]);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const colourGlassAdded = sessionStorage.getItem('colourGlassAdded');
			if (colourGlassAdded === 'true') {
				setCartEmptyCart(false);
				setCartFullCart(true);
				setColourGlassCart(true);	
				setLoadingThree(true);	
				setLoadingCart(false);
	
				setRoyalties(prevRoyalties => royalty * colourGlassPrice + prevRoyalties);
				setFees(prevFees => fee * colourGlassPrice + prevFees);
				setTotal(prevTotal => colourGlassPrice + prevTotal);
			}
		  }
	}, [royalty, colourGlassPrice, fee]);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const layersAdded = sessionStorage.getItem('layersAdded');
			if (layersAdded === 'true') {
				setCartEmptyCart(false);
				setCartFullCart(true);
				setLayersCart(true);	
				setLoadingFour(true);
				setLoadingCart(false);	
	
				setRoyalties(prevRoyalties => royalty * layersPrice + prevRoyalties);
				setFees(prevFees => fee * layersPrice + prevFees);
				setTotal(prevTotal => layersPrice + prevTotal);
			}
		  }
	}, [royalty, layersPrice, fee]);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const succinctDropAdded = sessionStorage.getItem('succinctDropAdded');
			if (succinctDropAdded === 'true') {
				setCartEmptyCart(false);
				setCartFullCart(true);
				setSuccinctDropCart(true);	
				setLoadingFive(true);	
				setLoadingCart(false);
	
				setRoyalties(prevRoyalties => royalty * succinctDropPrice + prevRoyalties);
				setFees(prevFees => fee * succinctDropPrice + prevFees);
				setTotal(prevTotal => succinctDropPrice + prevTotal);
			}
		  }
	}, [royalty, succinctDropPrice, fee]);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const paintRainAdded = sessionStorage.getItem('paintRainAdded');
			if (paintRainAdded === 'true') {
				setCartEmptyCart(false);
				setCartFullCart(true);
				setPaintRainCart(true);		
				setLoadingSix(true);
				setLoadingCart(false);
	
				setRoyalties(prevRoyalties => royalty * paintRainPrice + prevRoyalties);
				setFees(prevFees => fee * paintRainPrice + prevFees);
				setTotal(prevTotal => paintRainPrice + prevTotal);
			}
		  }
	}, [royalty, paintRainPrice, fee]);



	function completePurchase() {

		if (typeof window !== 'undefined') {
				//Complete purchase
			sessionStorage.getItem('blueOrangePurchased');
			sessionStorage.getItem('beachHousesPurchased');
			sessionStorage.getItem('colourGlassPurchased');
			sessionStorage.getItem('layersPurchased');
			sessionStorage.getItem('succinctDropPurchased');
			sessionStorage.getItem('paintRainPurchased');
			
			const blueOrangeAdded = sessionStorage.getItem('blueOrangeAdded');
			const beachHousesAdded = sessionStorage.getItem('beachHousesAdded');
			const colourGlassAdded = sessionStorage.getItem('colourGlassAdded');
			const layersAdded = sessionStorage.getItem('layersAdded');
			const succinctDropAdded = sessionStorage.getItem('succinctDropAdded');
			const paintRainAdded = sessionStorage.getItem('paintRainAdded');
	
			if(blueOrangeAdded === 'true'){
				sessionStorage.setItem('blueOrangePurchased', 'true');
				setCartEmptyCart(true);
				setCartFullCart(false);
				setBlueOrangeCart(false);	
			}
			sessionStorage.removeItem('blueOrangeAdded');
	
			if(beachHousesAdded === 'true'){
				sessionStorage.setItem('beachHousesPurchased', 'true');
				setCartEmptyCart(true);
				setCartFullCart(false);
				setBeachHousesCart(false);	
			}
			sessionStorage.removeItem('beachHousesAdded');
	
			if(colourGlassAdded === 'true'){
				sessionStorage.setItem('colourGlassPurchased', 'true');
				setCartEmptyCart(true);
				setCartFullCart(false);
				setColourGlassCart(false);	
			}
			sessionStorage.removeItem('colourGlassAdded');
	
			if(layersAdded === 'true'){
				sessionStorage.setItem('layersPurchased', 'true');
				setCartEmptyCart(true);
				setCartFullCart(false);
				setLayersCart(false);	
			}
			sessionStorage.removeItem('layersAdded');
	
			if(succinctDropAdded === 'true'){
				sessionStorage.setItem('succinctDropPurchased', 'true');
				setCartEmptyCart(true);
				setCartFullCart(false);
				setSuccinctDropCart(false);	
			}
			sessionStorage.removeItem('succinctDropAdded');
	
			if(paintRainAdded === 'true'){
				sessionStorage.setItem('paintRainPurchased', 'true');
				
				setCartEmptyCart(true);
				setCartFullCart(false);
				setPaintRainCart(false);	
			}
			sessionStorage.removeItem('paintRainAdded');
			setPurchaseComplete(true);
		}
	}


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
				setLoadingCart(true);
		}

		sessionStorage.setItem('blueOrangeAdded', 'false');
	}

	function removeBeachHouses() {
		setBeachHousesCart(false);	

		setRoyalties(royalties - (royalty * beachHousesPrice));
		setFees(fees - (fee * beachHousesPrice));
		setTotal(total - beachHousesPrice);

		if(blueOrangeCart == false
			&& colourGlassCart == false
			&& layersCart == false
			&& succinctDropCart == false
			&& paintRainCart == false){
				setCartEmptyCart(true);
				setCartFullCart(false);
				setLoadingCart(true);
		}

		sessionStorage.setItem('beachHousesAdded', 'false');
	}

	function removeColourGlass() {
		setColourGlassCart(false);	

		setRoyalties(royalties - (royalty * colourGlassPrice));
		setFees(fees - (fee * colourGlassPrice));
		setTotal(total - colourGlassPrice);

		if(blueOrangeCart == false
			&& beachHousesCart == false
			&& layersCart == false
			&& succinctDropCart == false
			&& paintRainCart == false){
				setCartEmptyCart(true);
				setCartFullCart(false);
				setLoadingCart(true);
		}

		sessionStorage.setItem('colourGlassAdded', 'false');
	}

	function removeLayers() {
		setLayersCart(false);	

		setRoyalties(royalties - (royalty * layersPrice));
		setFees(fees - (fee * layersPrice));
		setTotal(total - layersPrice);

		if(blueOrangeCart == false
			&& beachHousesCart == false
			&& colourGlassCart == false
			&& succinctDropCart == false
			&& paintRainCart == false){
				setCartEmptyCart(true);
				setCartFullCart(false);
				setLoadingCart(true);
		}

		sessionStorage.setItem('layersAdded', 'false');
	}

	function removeSuccinctDrop() {
		setSuccinctDropCart(false);	

		setRoyalties(royalties - (royalty * succinctDropPrice));
		setFees(fees - (fee * succinctDropPrice));
		setTotal(total - succinctDropPrice);

		if(blueOrangeCart == false
			&& beachHousesCart == false
			&& colourGlassCart == false
			&& layersCart == false
			&& paintRainCart == false){
				setCartEmptyCart(true);
				setCartFullCart(false);
				setLoadingCart(true);
		}

		sessionStorage.setItem('succinctDropAdded', 'false');
	}

	function removePaintRain() {
		setPaintRainCart(false);	

		setRoyalties(royalties - (royalty * paintRainPrice));
		setFees(fees - (fee * paintRainPrice));
		setTotal(total - paintRainPrice);

		if(blueOrangeCart == false
			&& beachHousesCart == false
			&& colourGlassCart == false
			&& layersCart == false
			&& succinctDropCart == false){
				setCartEmptyCart(true);
				setCartFullCart(false);
				setLoadingCart(true);
		}

		sessionStorage.setItem('paintRainAdded', 'false');
	}
	
{/*<!-- Remove function/s above -->*/}







	
    return (
        <>

{/*<!-- Modals below link after test -->*/}
		{purchaseComplete && (
			<div id="purchaseComplete">
				<div className="purchase-complete-content">
				<p id="purchase-complete-desc"> PURCHASE COMPLETE</p>
				{/* Change below link after test */}
				<Link legacyBehavior href="/prototype/buyer-collected">
					<a className="close-purchase-complete">
						VIEW COLLECTION
					</a>	
				</Link>		
				</div>
			</div>	
		)}

		{showLoading && (
			<div id="spinnerBackground">
			<Image 
				loader={imageLoader}
				alt="" 
				width={29}
				height={30}
				id="arells-loader-icon" 
				src="Arells-Icon.png"/>        
			</div>
		)}
		{showLoading && (
			<div className={styles.spinner}></div>
		)}

		{showLoadingCart && (
			<div id="spinnerBackground">
			<Image 
				loader={imageLoader}
				alt="" 
				width={29}
				height={30}
				id="arells-loader-icon" 
				src="Arells-Icon.png"/>        
			</div>
		)}
		{showLoadingCart && (
			<div className={styles.spinner}></div>
		)}

		{showLoadingOne && (
			<div id="spinnerBackground">
			<Image 
			loader={imageLoader}
				alt="" 
				width={29}
				height={30}
				id="arells-loader-icon" 
				src="Arells-Icon.png"/>        
			</div>
		)}
		{showLoadingOne && (
			<div className={styles.spinner}></div>
		)}
		{showLoadingTwo && (
			<div id="spinnerBackground">
			<Image 
				loader={imageLoader}
				alt="" 
				width={29}
				height={30}
				id="arells-loader-icon" 
				src="Arells-Icon.png"/>        
			</div>
		)}
		{showLoadingTwo && (
			<div className={styles.spinner}></div>
		)}
		{showLoadingThree && (
			<div id="spinnerBackground">
			<Image 
				loader={imageLoader}
				alt="" 
				width={29}
				height={30}
				id="arells-loader-icon" 
				src="Arells-Icon.png"/>        
			</div>
		)}
		{showLoadingThree && (
			<div className={styles.spinner}></div>
		)}
		{showLoadingFour && (
			<div id="spinnerBackground">
			<Image 
				loader={imageLoader}
				alt="" 
				width={29}
				height={30}
				id="arells-loader-icon" 
				src="Arells-Icon.png"/>        
			</div>
		)}
		{showLoadingFour && (
			<div className={styles.spinner}></div>
		)}
		{showLoadingFive && (
			<div id="spinnerBackground">
			<Image 
				loader={imageLoader}
				alt="" 
				width={29}
				height={30}
				id="arells-loader-icon" 
				src="Arells-Icon.png"/>        
			</div>
		)}
		{showLoadingFive && (
			<div className={styles.spinner}></div>
		)}
		{showLoadingSix && (
			<div id="spinnerBackground">
			<Image 
				loader={imageLoader}
				alt="" 
				width={29}
				height={30}
				id="arells-loader-icon" 
				src="Arells-Icon.png"/>        
			</div>
		)}
		{showLoadingSix && (
			<div className={styles.spinner}></div>
		)}
{/*<!-- Modals Above -->*/}

			<div id="header-cart">
		
				<a id="icon-link-cart">
					<Image
					loader={imageLoader}
					onLoad={() => handleImageLoaded('arellsIconCart')}
					alt=""
					height={16}
					width={15} 
					id="arells-icon-cart" 
					src="prototype/Arells-Icon-Home.png"/>
				</a>		
				<button id="cart-link-cart">
					<Image
					loader={imageLoader}
					onLoad={() => handleImageLoaded('cartIconCart')}
					alt=""
					height={15}
					width={16}
					id="cart-icon-cart" 
					src="prototype/shopping-cart-empty.png"/>
				</button>	
			</div>
			<Image
			loader={imageLoader}
			onLoad={() => handleImageLoaded('wordLogoCart')}
			alt=""
			width={110}  
			height={35} 
			id="word-logo-cart" 
			src="Arells-Logo-Ebony.png"/>	
			<p id="slogan-cart">NEVER LOSE MONEY SELLING ART</p>
			{walletConnectedDivCart && (
				<div id="wallet-connected-div-cart">
					<hr id="connected-line-cart"/>
					<p id="wallet-connected-cart" >
					WALLET CONNECTED</p>
					<hr id="connected-line-cart"/>
				</div>				
			)}
			{cartEmptyCart && (
				<div id="cart-empty-cart">	
					<p id="no-art-cart">
						cart empty
						<Image
						loader={imageLoader}
						onLoad={() => handleImageCartLoaded('cartIconCollectedCart')}
						alt=""
						width={27}  
						height={25}
						id="cart-icon-collected-cart" 
						src="prototype/shopping-cart-empty.png"/>
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
							<button id="purchase-cart" onClick={completePurchase}>
							COMPLETE PURCHASE</button>			
					</div>
					<div id="container-cart">
						{blueOrangeCart && (
							<div id="blue-orange-cart">
							{/* Change below link after test */}
								<Link legacyBehavior href="/prototype/asset/blue-orange">
									<a target="_self" id="photo-link-cart">
										<Image
										loader={imageLoader}
										onLoad={() => handleImageOneLoaded('photoCartOne')}
										alt=""
										width={150}  
										height={150} 
										id="photo-cart" 
										src="prototype/1.jpg"/>
									</a>
								</Link>	
								<div id="prices-cart">
									<div id="blue-orange-prices-before-cart">
										<p id="PAP-cart">Price After Purchase</p>
										<p id="PAP-blue-orange-before-cart">$1,800</p>
										<hr id="priceline-cart"/>
										<p id="yourprice-cart">Price</p>
										<p id="price-blue-orange-before-cart">$1,200</p>
									</div>					  		
								</div>
								<button id="remove-cart" onClick={removeBlueOrange}>
									<Image
									loader={imageLoader}
									alt=""
									width={18}  
									height={20} 
									id="del-cart" 
									src="prototype/delete.png"/>
								</button>
							</div>
						)}
						{beachHousesCart && (
							<div id="beach-houses-cart">
							{/* Change below link after test */}
								<Link legacyBehavior href="/prototype/asset/beach-houses">
									<a target="_self" id="photo-link-cart">
										<Image
										loader={imageLoader}
										onLoad={() => handleImageTwoLoaded('photoCartTwo')}
										alt=""
										width={150}  
										height={150} 
										id="photo-cart" 
										src="prototype/2.jpg"/>
									</a>
								</Link>	
								<div id="prices-cart">
									<div id="beach-houses-prices-before-cart">
										<p id="PAP-cart">Price After Purchase</p>
										<p id="PAP-beach-houses-before-cart">$2,000</p>
										<hr id="priceline-cart"/>
										<p id="yourprice-cart">Price</p>
										<p id="price-beach-houses-before-cart">$200</p>
									</div>
								</div>
								<button id="remove-cart" onClick={removeBeachHouses}>
									<Image
									loader={imageLoader}
									alt=""
									width={18}  
									height={20}  
									id="del-cart" 
									src="prototype/delete.png"/>
								</button>	     	
							</div>
						)}
						{colourGlassCart && (
							<div id="colour-glass-cart">
							{/* Change below link after test */}
								<Link legacyBehavior href="/prototype/asset/colour-glass">
									<a target="_self" id="photo-link-cart">
										<Image
										loader={imageLoader}
										onLoad={() => handleImageThreeLoaded('photoCartThree')}
										alt=""
										width={150}  
										height={150} 
										id="photo-cart" 
										src="prototype/3.jpg"/>
									</a>
								</Link>	
								<div id="prices-cart">
									<div id="colour-glass-prices-before-cart">
										<p id="PAP-cart">Price After Purchase</p>
										<p id="PAP-colour-glass-before-cart">$750</p>
										<hr id="priceline-cart"/>
										<p id="yourprice-cart">Price</p>
										<p id="price-colour-glass-before-cart">$500</p>
									</div>			  		
								</div>
								<button id="remove-cart" onClick={removeColourGlass}>
									<Image
									loader={imageLoader}
									alt=""
									width={18}  
									height={20} 
									id="del-cart" 
									src="prototype/delete.png"/>
								</button>		     	
							</div>
						)}
						{layersCart && (
							<div id="layers-cart">
							{/* Change below link after test */}
								<Link legacyBehavior href="/prototype/asset/layers">
									<a target="_self" id="photo-link-cart">
										<Image
										loader={imageLoader}
										onLoad={() => handleImageFourLoaded('photoCartFour')}
										alt=""
										width={150}  
										height={150} 
										id="photo-cart" 
										src="prototype/4.jpg"/>
									</a>
								</Link>	
								<div id="prices-cart">
									<div id="layers-prices-before-cart">
										<p id="PAP-cart">Price After Purchase</p>
										<p id="PAP-layers-before-cart">$3,500</p>
										<hr id="priceline-cart"/>
										<p id="yourprice-cart">Price</p>
										<p id="price-layers-before-cart">$1,500</p>
									</div>			  		
								</div>
								<button id="remove-cart" onClick={removeLayers}>
									<Image
									loader={imageLoader}
									alt=""
									width={18}  
									height={20} 
									id="del-cart" 
									src="prototype/delete.png"/>
								</button>
							</div>
						)}
						{succinctDropCart && (
							<div id="succinct-drop-cart">
							{/* Change below link after test */}
								<Link legacyBehavior href="/prototype/asset/succinct-drop">
									<a target="_self" id="photo-link-cart">
										<Image
										loader={imageLoader}
										onLoad={() => handleImageFiveLoaded('photoCartFive')}
										alt=""
										width={150}  
										height={150} 
										id="photo-cart" 
										src="prototype/5.jpg"/>
									</a>
								</Link>	
								<div id="prices-cart">
									<div id="succinct-drop-prices-before-cart">
										<p id="PAP-cart">Price After Purchase</p>
										<p id="PAP-succinct-drop-before-cart">$200</p>
										<hr id="priceline-cart"/>
										<p id="yourprice-cart">Price</p>
										<p id="price-succinct-drop-before-cart">$100</p>
									</div>			  		
								</div>
								<button id="remove-cart" onClick={removeSuccinctDrop}>
									<Image
									loader={imageLoader}
									alt=""
									width={18}  
									height={20} 
									id="del-cart" 
									src="prototype/delete.png"/>
								</button>			     	
							</div>
						)}
						{paintRainCart && (
							<div id="paint-rain-cart">
							{/* Change below link after test */}
								<Link legacyBehavior href="/prototype/asset/paint-rain">
									<a target="_self" id="photo-link-cart">
										<Image
										loader={imageLoader}
										onLoad={() => handleImageSixLoaded('photoCartSix')}
										alt=""
										width={150}  
										height={150} 
										id="photo-cart" 
										src="prototype/6.jpg"/>
									</a>
								</Link>	
								<div id="prices-cart">
									<div id="paint-rain-prices-before-cart">
										<p id="PAP-cart">Price After Purchase</p>
										<p id="PAP-paint-rain-before-cart">$15,000</p>
										<hr id="priceline-cart"/>
										<p id="yourprice-cart">Price</p>
										<p id="price-paint-rain-before-cart">$12,000</p>
									</div>			  		
								</div>
								<button id="remove-cart" onClick={removePaintRain}>
									<Image
									loader={imageLoader}
									alt=""
									width={18}  
									height={20} 
									id="del-cart" 
									src="prototype/delete.png"/>
								</button>		     	
							</div>
						)}
					</div>	
				</div>					

			)}					
		     
        </>
    );
}

export default PrototypeCart;