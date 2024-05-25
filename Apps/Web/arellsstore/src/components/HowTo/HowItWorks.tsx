"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import '../../app/css/howitworks/howitworks.css';
import '../../app/css/modals/stayupdated-modal.css';


// Loader Styles
import '../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../app/css/modals/loading/spinner.module.css';

const HowItWorks: React.FC = () => {
    //Loader Function/s
    const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
        return `/${src}?w=${width}&q=${quality || 100}`;
      }
      const [showLoading, setLoading] = useState<boolean>(true);
      const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>({
        wordLogo: false,
      });
    
      const handleImageLoaded = (imageName: string) => {
        console.log(`Image loaded: ${imageName}`);
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
    //Loader Function/s

    return (
        <>

        {showLoading && (
            <div id="spinnerBackgroundHow">
            <Image 
                loader={imageLoader}
                alt="" 
                width={29}
                height={30}
                id="arells-loader-icon-how" 
                src="images/Arells-Icon-Ivory.png"/>    
                <div className={styles.spinnerHow}></div>    
            </div>
        )}
            <Image
                loader={imageLoader}
                onLoad={() => handleImageLoaded('wordLogo')}
                alt=""
                width={60}
                height={19}
                id="word-logo-how" 
                src="images/Arells-Logo.png"/>	

            <hr id="black-liner-how"/>
            <p id="descriptioner-how">
                NEVER LOSE MONEY SELLING 
                <span id="descriptioner-how-crypto"> CRYPTOCURRENCIES</span>
                </p>
            <hr id="black-liner-how"/>    
            <p id="how-it-works-words">HOW IT WORKS</p> 


            <div id="how-it-works-guide-wrapper">



                <div id="b-price-how">
                    <span>
                        <div id="b-how-wrapper">
                            <Image
                            loader={imageLoader}
                            onLoad={() => handleImageLoaded('wordLogo')}
                            alt=""
                            width={20}
                            height={20}
                            id="bitcoin-how" 
                            src="images/howitworks/Bitcoin.png"/>
                        </div>
                    </span>
                    <span id="price-how">Price:</span>
                    <span id="price-number-how">$60,000</span>
                </div>

                <div id="transfer-buy">
                    <span>
                        <button id="transfer-how">
                            TRANSFER IN
                        </button>
                    </span>
                    <span>
                        <button id="buy-how">
                            BUY
                        </button>
                    </span>
                </div>

                <div id="transfer-buy-how">
                    <div id="b-price-how">
                        <span>
                            <div id="b-how-wrapper">
                                <Image
                                loader={imageLoader}
                                onLoad={() => handleImageLoaded('wordLogo')}
                                alt=""
                                width={20}
                                height={20}
                                id="bitcoin-how" 
                                src="images/howitworks/Bitcoin.png"/>
                            </div>
                        </span>
                        <span>
                            <div id="a-how-wrapper">
                                <Image
                                loader={imageLoader}
                                onLoad={() => handleImageLoaded('wordLogo')}
                                alt=""
                                width={20}
                                height={20}
                                id="arells-how" 
                                src="images/howitworks/ArellsBitcoin.png"/>
                            </div>
                        </span>
                        <span id="price-how">Price:</span>
                        <span id="price-number-how">$60,000</span>
                    </div>
                    <p id="your-wallet">Your Wallet: $500</p>

                </div>







                <hr id="how-it-works-line"/>

                <div id="b-price-how">
                    <span>
                        <div id="b-how-wrapper">
                            <Image
                            loader={imageLoader}
                            onLoad={() => handleImageLoaded('wordLogo')}
                            alt=""
                            width={20}
                            height={20}
                            id="bitcoin-how" 
                            src="images/howitworks/Bitcoin.png"/>
                        </div>
                    </span>
                    <span id="price-how">Price:</span>
                    <span id="price-number-how">$54,000</span>
                </div>

                <button id="holding-how">
                    HOLDING
                </button>

                <div id="holding-wrapper-how">

                    <div id="b-price-how">
                        <span>
                            <div id="b-how-wrapper">
                                <Image
                                loader={imageLoader}
                                onLoad={() => handleImageLoaded('wordLogo')}
                                alt=""
                                width={20}
                                height={20}
                                id="bitcoin-how" 
                                src="images/howitworks/Bitcoin.png"/>
                            </div>
                        </span>
                        <span>
                            <div id="a-how-wrapper">
                                <Image
                                loader={imageLoader}
                                onLoad={() => handleImageLoaded('wordLogo')}
                                alt=""
                                width={20}
                                height={20}
                                id="arells-how" 
                                src="images/howitworks/ArellsBitcoin.png"/>
                            </div>
                        </span>
                        <span id="holding-price-how">Holding Price:</span>
                        <span id="price-number-how">$60,000</span>
                    </div>
                    <p id="your-wallet">Your Wallet: $500</p>

                </div>





                <hr id="how-it-works-line"/>

                <div id="b-price-how">
                    <span>
                        <div id="b-how-wrapper">
                            <Image
                            loader={imageLoader}
                            onLoad={() => handleImageLoaded('wordLogo')}
                            alt=""
                            width={20}
                            height={20}
                            id="bitcoin-how" 
                            src="images/howitworks/Bitcoin.png"/>
                        </div>
                    </span>
                    <span id="price-how">Price:</span>
                    <span id="price-number-how">$75,000</span>
                </div>

                <button id="sell-how">
                    SELL
                </button>

                <div id="sell-wrapper-how">

                    <div id="b-price-how">
                        <span>
                            <div id="b-how-wrapper">
                                <Image
                                loader={imageLoader}
                                onLoad={() => handleImageLoaded('wordLogo')}
                                alt=""
                                width={20}
                                height={20}
                                id="bitcoin-how" 
                                src="images/howitworks/Bitcoin.png"/>
                            </div>
                        </span>
                        <span>
                            <div id="a-how-wrapper">
                                <Image
                                loader={imageLoader}
                                onLoad={() => handleImageLoaded('wordLogo')}
                                alt=""
                                width={20}
                                height={20}
                                id="arells-how" 
                                src="images/howitworks/ArellsBitcoin.png"/>
                            </div>
                        </span>
                        <span id="holding-price-how">Price:</span>
                        <span id="price-number-how">$75,000</span>
                    </div>
                    <p id="your-wallet">Your Wallet: $625</p>

                    <hr id="profits-line"/>

                    <p id="your-wallet">Profits: $125</p>

                </div>

            </div>



            <div id="faq-wrapper">

                <p id="faq-how">Frequently Asked Questions</p>

                <p id="faq-one-how">
                    Will I be able to override the Holding Price and sell?
                </p>
                <p id="faq-one-how">
                    Yes, by transferring your Bitcoin out of Arells.
                </p>

                <p id="faq-two-how">
                    How will transfering my Bitcoin out of Arells affect my investment?
                </p>
                <p id="faq-two-how">
                    If the Bitcoin price decreases, the value of your investment 
                    will also decrease.
                </p>

                <div id="faq-transfer-wrapper">

                    <button id="transfer-out-how">
                        TRANSFER OUT
                    </button>

                    <div id="faq-transfer-example">
                        <p id="faq-two-transfer-one">
                            Transferring $450 out of Arells
                        </p>
                        <p id="faq-two-transfer-two">
                            will incur you a $50 loss.
                        </p>
                        <p id="faq-two-transfer-three">
                            Are you sure?
                        </p>
                    </div>

                    <div id="faq-cancel-proceed">
                        <span>
                            <button id="cancel-how">
                                CANCEL
                            </button>
                        </span>
                        <span>
                            <button id="proceed-how">
                                PROCEED
                            </button>
                        </span>
                    </div>

                </div>

            </div>

            <p className="contact-submit-question-how">Got more questions? Contact us:</p>

            <a href="mailto:info@arells.com"
                className="email-contacts" >
                <Image 
                loader={imageLoader}
                alt="" 
                width={25}
                height={25}
                id="email-contact-how" 
                src="images/signup/email-ivory.png"/>
            </a>   

        </>
    );
}

export default HowItWorks;
