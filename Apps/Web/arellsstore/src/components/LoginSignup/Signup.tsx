"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import '../app/css/loginsignup/loginsignup.css';
import '../app/css/modals/loginsignup/loginsignup-modal.css';
import $ from 'jquery';
import Link from 'next/link';
import Amplify from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import awsconfig from '../../aws-exports'; // Ensure this path is correct

Amplify.configure(awsconfig);

const Signup: React.FC = () => {
    //Loader Function/s
    const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
        return `/${src}?w=${width}&q=${quality || 100}`;
    };

    const [showEnterInformation, setEnterInformation] = useState<boolean>(false);
    const [showSubmitted, setSubmitted] = useState<boolean>(false);

    const closeEnterInformation = () => {
        setEnterInformation(false);
    };

    return (
        <Authenticator>
            {({ signOut, user }) => (
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
                                            src="images/signup/email-ebony.png" />
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
                                            src="images/signup/twitter-ebony.png" />
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

                    <p id="stay-updated">SIGN UP</p>

                    <br />

                    <div id="sign-up">
                        <form id="myForm">
                            <div id="enter-content">
                                <label id="label">Email</label>
                                <br />
                                <input name="email" type="email"
                                    id="email-input"
                                    />
                            </div>
                            <div id="enter-content">
                                <label id="label">Password</label>
                                <br />
                                <input name="password" type="password"
                                    id="password-input"
                                    />
                            </div>
                            <div id="enter-content">
                                <label id="label">Confirm Password</label>
                                <br />
                                <input name="confirm_password" type="password"
                                    id="confirm-password-input"
                                    />
                            </div>
                            <br />
                            <a id="submit"
                                onClick={() => setSubmitted(true)}>SIGN UP</a>
                        </form>
                    </div>
                </>
            )}
        </Authenticator>
    );
}

export default Signup;