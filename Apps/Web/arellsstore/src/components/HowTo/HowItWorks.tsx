"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import '../../app/css/howitworks/howitworks.css';
//import '../../app/css/modals/stayupdated-modal.css';



// Loader Styles
import '../../app/css/modals/loader/binnerbackgroundhow.css';
import styles from '../../app/css/modals/loader/howbin.module.css';

const HowItWorks: React.FC = () => {
    //Loader Function/s
    const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
        return `/${src}?w=${width}&q=${quality || 100}`;
      }
      const [showLoading, setLoading] = useState<boolean>(true);
      const [imagesLoaded, setImagesLoaded] = useState<{ [key: string]: boolean }>({
        howlogo: false,
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
            <div id="binnerbackgroundhow">
            <Image 
                loader={imageLoader}
                alt="" 
                width={29}
                height={30}
                id="arells-loader-icon-how" 
                src="images/Arells-Icon-Ivory.png"/>    
                <div id={styles.binnerhow}></div>    
            </div>
        )}
            <Image
                loader={imageLoader}
                onLoad={() => handleImageLoaded('howlogo')}
                alt=""
                width={50}
                height={16}
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
                            onLoad={() => handleImageLoaded('howlogo')}
                            alt=""
                            width={20}
                            height={20}
                            id="bitcoin-how" 
                            src="images/howitworks/Bitcoin.png"/>
                        </div>
                    </span>
                    <span id="price-how">Price:</span>
                    <span id="price-number-how">$
                        <span id="price-number-how-num">60,000</span>
                    </span>
                </div>

                <div id="transfer-buy">
                    <span>
                        <button id="transfer-how">
                            IMPORT
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
                            <div id="a-how-wrapper">
                                <Image
                                loader={imageLoader}
                                onLoad={() => handleImageLoaded('howlogo')}
                                alt=""
                                width={20}
                                height={20}
                                id="arells-how" 
                                src="images/howitworks/ArellsBitcoinIvory.png"/>
                            </div>
                        </span>
                        <span>
                            <div id="b-how-wrapper">
                                <Image
                                loader={imageLoader}
                                onLoad={() => handleImageLoaded('howlogo')}
                                alt=""
                                width={20}
                                height={20}
                                id="bitcoin-how-wallet" 
                                src="images/howitworks/Bitcoin.png"/>
                            </div>
                        </span>
                        <span id="holding-price-how">Price:</span>
                        <span id="wallet-price-number-how">$
                            <span id="wallet-price-number-how-num">60,000</span>
                        </span>
                    </div>
                    <hr id="black-liner-wallet"/>  
                    <div id="b-price-how">
                        <span>
                            <div id="w-how-wrapper">
                                <Image
                                loader={imageLoader}
                                onLoad={() => handleImageLoaded('howlogo')}
                                alt=""
                                width={20}
                                height={20}
                                id="wallet-icon-how" 
                                src="images/market/wallet-ivory.png"/>
                            </div>
                        </span>
                        <span id="wallet-how">Wallet:</span>
                        <span id="wallet-number-how">$
                            <span id="wallet-number-how-num">500</span>
                        </span>
                    </div>

                </div>







                <hr id="how-it-works-liner"/>

                <div id="b-price-how">
                    <span>
                        <div id="b-how-wrapper">
                            <Image
                            loader={imageLoader}
                            onLoad={() => handleImageLoaded('howlogo')}
                            alt=""
                            width={20}
                            height={20}
                            id="bitcoin-how" 
                            src="images/howitworks/Bitcoin.png"/>
                        </div>
                    </span>
                    <span id="price-how">Price:</span>
                    <span id="price-number-how">$
                        <span id="price-number-how-num">54,000</span>
                    </span>
                </div>

                <button id="holding-how">
                    HOLDING
                </button>

                <div id="transfer-buy-how">

                    <div id="b-price-how">
                        <span>
                            <div id="a-how-wrapper">
                                <Image
                                loader={imageLoader}
                                onLoad={() => handleImageLoaded('howlogo')}
                                alt=""
                                width={20}
                                height={20}
                                id="arells-how" 
                                src="images/howitworks/ArellsBitcoinIvory.png"/>
                            </div>
                        </span>
                        <span>
                            <div id="b-how-wrapper">
                                <Image
                                loader={imageLoader}
                                onLoad={() => handleImageLoaded('howlogo')}
                                alt=""
                                width={20}
                                height={20}
                                id="bitcoin-how-wallet" 
                                src="images/howitworks/Bitcoin.png"/>
                            </div>
                        </span>
                        <span id="holding-price-how">Price:</span>
                        <span id="wallet-price-number-how">$
                            <span id="wallet-price-number-how-num">60,000</span>
                        </span>
                    </div>
                    <hr id="black-liner-wallet"/>  
                    <div id="b-price-how">
                        <span>
                            <div id="w-how-wrapper">
                                <Image
                                loader={imageLoader}
                                onLoad={() => handleImageLoaded('howlogo')}
                                alt=""
                                width={20}
                                height={20}
                                id="wallet-icon-how" 
                                src="images/market/wallet-ivory.png"/>
                            </div>
                        </span>
                        <span id="wallet-how">Wallet:</span>
                        <span id="wallet-number-how">$
                            <span id="wallet-number-how-num">500</span>
                        </span>
                    </div>

                </div>





                <hr id="how-it-works-liner"/>

                <div id="b-price-how">
                    <span>
                        <div id="b-how-wrapper">
                            <Image
                            loader={imageLoader}
                            onLoad={() => handleImageLoaded('howlogo')}
                            alt=""
                            width={20}
                            height={20}
                            id="bitcoin-how" 
                            src="images/howitworks/Bitcoin.png"/>
                        </div>
                    </span>
                    <span id="price-how">Price:</span>
                    <span id="price-number-how">$
                        <span id="price-number-how-num">75,000</span>
                    </span>
                </div>

                <button id="sell-how">
                    SELL
                </button>

                <div id="sell-wrapper-how">

                    <div id="b-price-how">
                        <span>
                            <div id="a-how-wrapper">
                                <Image
                                loader={imageLoader}
                                onLoad={() => handleImageLoaded('howlogo')}
                                alt=""
                                width={20}
                                height={20}
                                id="arells-how" 
                                src="images/howitworks/ArellsBitcoinIvory.png"/>
                            </div>
                        </span>
                        <span>
                            <div id="b-how-wrapper">
                                <Image
                                loader={imageLoader}
                                onLoad={() => handleImageLoaded('howlogo')}
                                alt=""
                                width={20}
                                height={20}
                                id="bitcoin-how-wallet" 
                                src="images/howitworks/Bitcoin.png"/>
                            </div>
                        </span>
                        <span id="holding-price-how">Price:</span>
                        <span id="wallet-price-number-how">$
                            <span id="wallet-price-number-how-num">75,000</span>
                        </span>
                    </div>
                    <hr id="black-liner-wallet"/>  
                    <div id="b-price-how">
                        <span>
                            <div id="w-how-wrapper">
                                <Image
                                loader={imageLoader}
                                onLoad={() => handleImageLoaded('howlogo')}
                                alt=""
                                width={20}
                                height={20}
                                id="wallet-icon-how" 
                                src="images/market/wallet-ivory.png"/>
                            </div>
                        </span>
                        <span id="wallet-how">Wallet:</span>
                        <span id="wallet-number-how">$
                            <span id="wallet-number-how-num">625</span>
                        </span>
                    </div>

                    <hr id="black-liner-wallet-profits"/>  

                    <div id="b-price-how">
                        <span>
                            <div id="w-how-wrapper">
                                <Image
                                loader={imageLoader}
                                onLoad={() => handleImageLoaded('howlogo')}
                                alt=""
                                width={20}
                                height={20}
                                id="profits-icon-how" 
                                src="images/howitworks/up-arrow.png"/>
                            </div>
                        </span>
                        <span id="wallet-how-profits">Profits:</span>
                        <span id="wallet-number-profits-how">$
                            <span id="wallet-number-profits-how-num">125</span>
                        </span>
                    </div>


                </div>

            </div>

            <hr id="black-liner-how-bottom"/>  

            <div id="faq-wrapper">

                <p id="faq-how">Frequently Asked Questions</p>

                <p id="faq-one-how">
                    Will I be able to override Holding and sell?
                </p>
                <p id="faq-one-how-one">
                    Yes, by exporting your Bitcoin out of Arells.
                </p>

                <hr id="black-liner-how-bottom-faq"/>  

                <p id="faq-two-how">
                    How will exporting my Bitcoin affect my investment?
                </p>
                <p id="faq-two-how-two">
                    If the Bitcoin price decreases, so will the value of your investment.
                </p>

            </div>

            <div id="faq-transfer-wrapper">

                <div id="b-price-how">
                    <span>
                        <div id="b-how-wrapper">
                            <Image
                            loader={imageLoader}
                            onLoad={() => handleImageLoaded('howlogo')}
                            alt=""
                            width={20}
                            height={20}
                            id="bitcoin-how" 
                            src="images/howitworks/Bitcoin.png"/>
                        </div>
                    </span>
                    <span id="price-how">Price:</span>
                    <span id="price-number-how">$
                        <span id="price-number-how-num">54,000</span>
                    </span>
                </div>

                <button id="transfer-out-how">
                    EXPORT
                </button>

                <div id="faq-transfer-example">
                    <p id="faq-two-transfer-one">
                        <span id="wallet-how-export">Exporting</span>
                        <span id="wallet-number-how-export">$
                            <span id="wallet-number-how-num-export">450</span>
                        </span>
                    </p>
                    <p id="faq-two-transfer-two">
                        <span id="wallet-how-suffer">You will lose</span>
                        <span id="wallet-number-how-suffer">$
                            <span id="wallet-number-how-num-suffer">50</span>
                        </span>
                    </p>
                    <hr id="black-liner-wallet"/>  
                    <p id="faq-two-transfer-three">
                        Are you sure?
                    </p>
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

            <hr id="black-liner-how-bottom"/>  

            <p id="faq-how-email">Email us for more</p>

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
