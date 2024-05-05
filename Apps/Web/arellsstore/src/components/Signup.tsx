import React, { useState } from 'react';
import '../app/css/stayupdated.css';
import '../app/css/modals/stayupdated-modal.css';
import $ from 'jquery';

const Signup: React.FC = () => {
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
                        <p>ENTER INFORMATION</p>
                        <button className="RWclose" onClick={closeEnterInformation}>OK</button>
                    </div>
                </div>
            )}

            {showSubmitted && (
                <div className="RWmodal">
                    <div className="RWmodal-content">
                        <p>SUBMITTED</p>
                        <button className="RWclose" onClick={closeSubmitted}>OK</button>
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
                        <label id="label">NAME</label>
                        <br />
                        <input name="first_name" type="text"
                            id="first-input" ></input>
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
