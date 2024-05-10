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
    const [showSubmitted, setSubmitted] = useState<boolean>(true);

    const signUp = () => {
        if (typeof window !== 'undefined') {
            const emailInput = (document.getElementById('email-input') as HTMLInputElement).value;
            const firstNameInput = (document.getElementById('first-input') as HTMLInputElement).value;
            const lastNameInput = (document.getElementById('last-input') as HTMLInputElement).value;

            if (emailInput === "" || firstNameInput === "" || lastNameInput === "") {
                setEnterInformation(true);
            } else {
                $.ajax({
                    url: "https://api.apispreadsheets.com/data/uAv9KS8S9kojekky/",
                    type: "post",
                    data: $("#myForm").serializeArray(),
                    headers: {
                        accessKey: "c492c5cefcf9fdde44bbcd84a97465f1",
                        secretKey: "ac667f2902e4e472c82aff475a4a7a07"
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

    const closeSubmitted = () => {
        setSubmitted(false);
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
                            <p className="contact-submit-question">Questions?</p>
                            <p className="contact-submit-title">
                                Email us:
                            </p>
                            <p>    
                                <a href="mailto:info@arells.com"
                                    className="email-contacts" >
                                    <Image 
                                    loader={imageLoader}
                                    alt="" 
                                    width={30}
                                    height={30}
                                    id="email-contact" 
                                    src="images/signup/email-ivory.png"/>
                                </a>      
                            </p>
                            <p className="contact-submit-email">          
                                info@arells.com
                            </p>

                            
                            <p className="contact-submit-title">
                                Follow us:
                            </p>
                            <p>
                                <Link href="https://twitter.com/arellsofficial" 
                                    passHref
                                    className="twitter-contacts">
                                    <Image 
                                    loader={imageLoader}
                                    alt="" 
                                    width={30}
                                    height={30}
                                    id="twitter-contact" 
                                    src="/images/signup/twitter-ivory.png"/>
                                </Link>  
                            </p>
                            
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
