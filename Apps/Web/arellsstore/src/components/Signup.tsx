"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import '../app/css/stayupdated.css';
import '../app/css/modals/stayupdated-modal.css';
import $ from 'jquery';
import Link from 'next/link';

const Signup: React.FC = () => {
    //Loader Function/s
    const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
        return `/${src}?w=${width}&q=${quality || 100}`;
      }
    //Loader Function/s


    const [showEnterInformation, setEnterInformation] = useState<boolean>(false);
    const [showSubmitted, setSubmitted] = useState<boolean>(false);

    const signUp = () => {
        if (typeof window !== 'undefined') {
            const emailInput = (document.getElementById('email-input') as HTMLInputElement).value;
            const firstNameInput = (document.getElementById('first-input') as HTMLInputElement).value;
            const lastNameInput = (document.getElementById('last-input') as HTMLInputElement).value;

            if (emailInput === "" || firstNameInput === "" || lastNameInput === "") {
                setEnterInformation(true);
            } else {
                $.ajax({
                    url: "https://api.apispreadsheets.com/data/6T0aVzc5FSPAbNSH/",
                    type: "post",
                    data: $("#myForm").serializeArray(),
                    headers: {
                        accessKey:"6dc5c76c0cd9a9ab87f5bd2e8a9b57e2", 
                        secretKey:"4a6ce35719e814296ef47d5d90b85bf8"
                    }
                });
                (document.getElementById('email-input') as HTMLInputElement).value = "";
                (document.getElementById('first-input') as HTMLInputElement).value = "";
                (document.getElementById('last-input') as HTMLInputElement).value = "";
                setSubmitted(true);
            }
        }
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
                                width={33}
                                height={33}
                                id="email-contact" 
                                src="images/signup/email-ebony.png"/>
                            </a>      

                            <Link href="https://twitter.com/arellsofficial" 
                                passHref
                                className="twitter-contacts">
                                <Image 
                                loader={imageLoader}
                                alt="" 
                                width={33}
                                height={33}
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

            <p id="stay-updated">SIGN UP FOR EARLY ACCESS</p>


            <br />

            <div id="sign-up">
                <form id="myForm">
                    <div id="enter-content">
                        <label id="label">EMAIL</label>
                        <br />
                        <input name="email" type="email"
                            id="email-input" ></input>
                    </div>
                    <div id="enter-content">
                        <label id="label">FIRST NAME</label>
                        <br />
                        <input name="first_name" type="text"
                            id="first-input" ></input>
                    </div>
                    <div id="enter-content">
						<label id="label">LAST NAME</label>
						<br/>
						<input name="last_name" type="text" 
						id="last-input" ></input>
					</div>
                    <br />
                    <a id="submit"
                        onClick={signUp}>SUBMIT</a>
                </form>
            </div>

        </>
    );
}

export default Signup;
