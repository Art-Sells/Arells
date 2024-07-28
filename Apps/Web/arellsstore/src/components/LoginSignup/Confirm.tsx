// "use client";

// import React, { useState } from 'react';
// import Image from 'next/image';
// import type { ImageLoaderProps } from 'next/image';
// import '../../app/css/loginsignup/loginsignup.css';
// import '../../app/css/modals/loginsignup/loginsignup-modal.css';
// import '../../app/css/modals/buy/buy-modal.css';
// import stylings from '../../app/css/modals/loading/marketplaceloader.module.css';
// import Link from 'next/link';
// import { confirmSignUp } from 'aws-amplify/auth';
// import { generateWallet } from '../../lib/bitcoin';
// import { useEmail } from '../../context/EmailContext'; // Adjust the path

// const Confirm: React.FC = () => {
//     const { email } = useEmail();
//     const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
//         return `/${src}?w=${width}&q=${quality || 100}`;
//     };

//     const [confirmationCode, setConfirmationCode] = useState<string>('');
//     const [showSigningUp, setSigningUp] = useState<boolean>(false);
//     const [showSignedUp, setSignedUp] = useState<boolean>(false);
//     const [showCheckConfirmationCode, setCheckConfirmationCode] = useState<boolean>(false);

//     const closeSignedUp = () => setSignedUp(false);
//     const closeCheckConfirmationCode = () => setCheckConfirmationCode(false);

//     const handleConfirmSignUp = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setSigningUp(true);
//         setCheckConfirmationCode(false);

//         try {
//             await confirmSignUp({
//                 username: email,
//                 confirmationCode
//             });
//             console.log('Sign up complete. Generating wallet...')
//             const wallet = await generateWallet();
//             console.log('Wallet generated:', wallet);

//             // Simulate delay
//             setTimeout(async () => {
//                 // Save user data to the API
//                 const response = await fetch('/api/users', {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({ email, password: '', bitcoinAddress: wallet.address, bitcoinPrivateKey: wallet.privateKey }),
//                 });

//                 if (!response.ok) {
//                     console.log(`Error: ${response.statusText}`);
//                     throw new Error('Failed to create user');
//                 }

//                 console.log('User creation successful.');
//                 setSigningUp(false);
//                 setSignedUp(true);
//             }, 3000);
//         } catch (error) {
//             console.log('Error confirming sign up:', error);
//             setSigningUp(false);
//             setCheckConfirmationCode(true);
//         }
//     };

//     return (
//         <>
//             {showCheckConfirmationCode && (
//                 <div id="login-error-wrapper">
//                     <div id="account-exists-content">
//                         <Image 
//                             alt="" 
//                             width={35} 
//                             height={35} 
//                             id="signup-error-image" 
//                             src="/images/market/prohibited.png" 
//                         />
//                         <p id="account-exists-words">check</p>
//                         <p id="account-exists-wordsss">confirmation code</p>
//                         <button id="signup-error-close" onClick={closeCheckConfirmationCode}>OK</button>
//                     </div>
//                 </div>
//             )}
//             {showSigningUp && (
//                 <div id="buying-wrapper">
//                     <div id="buying-content">
//                         <div className={stylings.marketplaceloader}></div>
//                         <Image
//                             alt=""
//                             width={22}
//                             height={22}
//                             id="buying-image"
//                             src="/images/market/profile-ivory.png"
//                         />
//                         <p id="buying-words">confirming account</p>
//                     </div>
//                 </div>
//             )}
//             {showSignedUp && (
//                 <div id="account-created-wrapper">
//                     <div id="account-created-content">
//                         <Image alt="" width={35} height={35} id="account-created-image" src="/images/market/checkmark-ebony.png" />
//                         <p id="account-created-words">Account Confirmed</p>
//                         <Link href="/account" passHref>
//                             <button id="account-created-close" onClick={closeSignedUp}>VIEW ACCOUNT</button>
//                         </Link>
//                     </div>
//                 </div>
//             )}
//             <p id="confirm-title">
//                 IN DEVELOPMENT... (^.^)
//             </p>
//             {/* <div id="confirm">
//                 <p id="confirm-instructions">
//                     Check Email for confirmation code.
//                 </p>
//                 <form id="myForm" onSubmit={handleConfirmSignUp}>
//                     <div id="enter-content">
//                         <input
//                             name="confirmation-code" 
//                             type="tel"
//                             placeholder='confirmation code'
//                             id="confirmation-input"
//                             value={confirmationCode}
//                             onChange={(e) => setConfirmationCode(e.target.value)}
//                         />
//                     </div>
//                     <button id="confirm-button" type="submit">SUBMIT</button>
//                 </form>
//             </div> */}
//         </>
//     );
// };

// export default Confirm;