"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import '../app/css/loginsignup/loginsignup.css';
import '../app/css/modals/loginsignup/loginsignup-modal.css';
import $ from 'jquery';
import Link from 'next/link';

const Login: React.FC = () => {
    //Loader Function/s
    const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
        return `/${src}?w=${width}&q=${quality || 100}`;
      }
    //Loader Function/s


    const [showEnterInformation, setEnterInformation] = useState<boolean>(false);
    const [showSubmitted, setSubmitted] = useState<boolean>(false);

    const logIn = () => {
    };

    const closeEnterInformation = () => {
        setEnterInformation(false);
    };

    return (
        <>
            {showEnterInformation && (
                <div className="RWmodal">
                    <div className="RWmodal-content">
                        <p className="enter-info">ENTER INFORMATION</p>
                        <button className="RWclose" onClick={closeEnterInformation}>OK</button>
                    </div>
                </div>
            )}

            {showSubmitted && (
                <div className="RWmodal-submitted">
                    <div className="RWmodal-content-submitted">
                        <p className="submission-successful">SUBMITTED</p>
                        <div className="contact-submit">
                            <p className="contact-submit-question">Questions? Contact us:</p>

                            <a href="mailto:info@arells.com"
                                className="email-contacts" >
                                <Image 
                                loader={imageLoader}
                                alt="" 
                                width={25}
                                height={25}
                                id="email-contact" 
                                src="images/signup/email-ebony.png"/>
                            </a>      

                            <Link href="https://twitter.com/arellsofficial" 
                                passHref
                                className="twitter-contacts">
                                <Image 
                                loader={imageLoader}
                                alt="" 
                                width={25}
                                height={25}
                                id="twitter-contact" 
                                src="images/signup/twitter-ebony.png"/>
                            </Link>  

                        </div>
                        <p className="contact-title-description">
                            NEVER LOSE MONEY SELLING CRYPTOCURRENCIES
                        </p>
                        <p className="contact-coming-soon">
                            COMING SOON
                        </p>
                    </div>
                </div>
            )}

            <p id="stay-updated">LOG IN</p>

            <br />

            <div id="sign-up">
                <form id="myForm">
                    <div id="enter-content">
                        <label id="label">Email</label>
                        <br />
                        <input name="email" type="email"
                            id="email-input" ></input>
                    </div>
                    <div id="enter-content">
                        <label id="label">Password</label>
                        <br />
                        <input name="first_name" type="text"
                            id="first-input" ></input>
                    </div>
                    <div id="enter-content">
						<label id="label">Confirm Password</label>
						<br/>
						<input name="last_name" type="text" 
						id="last-input" ></input>
					</div>
                    <br />
                    <a id="submit"
                        onClick={logIn}>LOG IN</a>
                </form>
            </div>

            <p id="stay-updated">NO ACCOUNT? SIGN UP</p>

            <Link href="/signup" passHref>
                <button id="submit">
                SIGN UP
                </button>
            </Link> 

        </>
    );
}

export default Login;