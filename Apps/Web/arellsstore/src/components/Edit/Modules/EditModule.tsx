"use client";

import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from "next-auth/react";

import Image from 'next/image';

import ProfileImagePicker from './ProfileImagePicker';

// Change below link after test
import '../../../app/css/prototype/asset/asset.css';
import '../../../app/css/edit/edit.css';
import '../../../app/css/modals/edit-modals.css';

//Loader Styles
import '../../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../../app/css/modals/loading/spinner.module.css';
import Link from 'next/link';
import useSigner from '../../../state/signer';

const EditModule = () => {
    // Sign in/out
	    const { data: session } = useSession();
    // Sign in/out

    //Address constants below
        const [showClaimAddress, setClaimAddress] = useState<boolean>(true);
        const [showClaimedAddress, setClaimedAddress] = useState<boolean>(true);
    //Address constants above

    //Modal Functions below
        const [showClaimAddressModal, setClaimAddressModal] = useState<boolean>(false);
        const [showClaimedAddressModal, setClaimedAddressModal] = useState<boolean>(false);
        const [showChangesSavedModal, setChangesSavedModal] = useState<boolean>(false);

        const closeClaimAddressModal = () => {
            setClaimAddressModal(false);
            window.location.reload();
        };
        function openClaimedAddressModal() {
            setClaimedAddressModal(true);
        };

        const closeClaimedAddressModal = () => {
            setClaimAddressModal(false);
            window.location.reload();
        };
        function openClaimAddressModal() {
            setClaimAddressModal(true);
        };

        const closeChangesSavedModal = () => {
            setChangesSavedModal(false);
            window.location.reload();
        };
        function openChangesSavedModal() {
            setChangesSavedModal(true);
        };
    //Modal Functions Above

    const [showLoading, setLoading] = useState(true);
    const imageLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
        return `${src}?w=${width}&q=${quality || 100}`;
    };

    const { address, connectWallet } = useSigner();
    const router = useRouter();
    const storeAddressFromURL = useMemo(() => {
        const address = Array.isArray(router.query.storeAddress)
            ? router.query.storeAddress[0]
            : router.query.storeAddress;
        return address ? address.toLowerCase() : null;
    }, [router.query.storeAddress]);
    const addressMatch = address?.toLowerCase() === storeAddressFromURL?.toLowerCase();


    useEffect(() => {
        if (storeAddressFromURL) {
            setLoading(false);
        }
    }, [storeAddressFromURL]);

    //Edit Store Functions Below
        const [selectedImage, setSelectedImage] = useState<string | File>("");
        const [storeName, setStoreName] = useState('My Store');
    // Edit Store Functions Above    

    const showNotSignedInModal = !session
    const showWalletNotConnectedModal = !addressMatch && !address && session;
	const showNotOwnerModal = !addressMatch && address && session;

    return (
        <>

        
        {showLoading && (
            <div id="spinnerBackground">
            <Image 
                loader={imageLoader}
                alt="" 
                width={29}
                height={30}
                id="arells-loader-icon-asset" 
                src="/images/Arells-Icon.png"/>   
                <div className={styles.spinner}></div>     
            </div>
        )}

        {showClaimAddressModal && (
            <div id="claim-address-wrapper">
                <div id="claim-address-content">
                <Image 
                    // loader={imageLoader}
                    alt="" 
                    width={22}
                    height={35}
                    id="claim-address-image" 
                    src="/images/market/location.png"/>  
                <p id="claim-address-words">CLAIM ADDRESS</p>
                <button id="claim-address-close"
                    onClick={closeClaimAddressModal}>OK</button> 
                </div>
            </div>  
        )}

        {showClaimedAddressModal && (
            <div id="edit-modal-wrapper">
                <div id="edit-modal-content">
                <Image 
                    // loader={imageLoader}
                    alt="" 
                    width={22}
                    height={35}
                    id="claim-address-image" 
                    src="/images/market/location-ebony.png"/>  
                <p id="edit-modal-words">CLAIMED</p>
                <button id="edit-modal-close"
                    onClick={closeClaimedAddressModal}>OK</button> 
                </div>
            </div>  
        )}
        {showChangesSavedModal && (
            <div id="edit-modal-wrapper">
                <div id="edit-modal-content">
                <Image 
                    // loader={imageLoader}
                    alt="" 
                    width={35}
                    height={35}
                    id="changes-saved-image" 
                    src="/images/market/check-mark.png"/>  
                <p id="edit-modal-words">CHANGES SAVED</p>
                <button id="edit-modal-close"
                    onClick={closeChangesSavedModal}>OK</button> 
                </div>
            </div>  
        )}


        









        {showNotSignedInModal && (
            <div id="cannot-edit-modal-wrapper">
                <div id="cannot-edit-modal-content">
                <p id="cannot-edit-title">CANNOT EDIT</p>
                <p id="cannot-edit-words">You're Not Signed In</p>
                <Link legacyBehavior href={`/signin`} passHref>
                    <button id="cannot-edit-modal-close">
                        SIGN IN TO EDIT</button>  
                </Link>
                </div>
            </div>  
        )}
        {showWalletNotConnectedModal && (
            <div id="cannot-edit-modal-wrapper">
                <div id="cannot-edit-modal-content">
                <p id="cannot-edit-title">CANNOT EDIT</p>
                <p id="cannot-edit-words">Your Wallet is Not Connected</p>
                <button id="cannot-edit-modal-close"
                    onClick={connectWallet}>CONNECT WALLET</button> 
                </div>
            </div>  
        )}
        {showNotOwnerModal && (
            <div id="cannot-edit-modal-wrapper">
                <div id="cannot-edit-modal-content"> 
                <p id="cannot-edit-title">CANNOT EDIT</p>
                <p id="cannot-edit-words">You are not the Owner of this Store</p>
                <Link legacyBehavior href={`/edit/${address}`} passHref>
                    <button id="cannot-edit-modal-close">
                        EDIT MY STORE</button> 
                </Link>
                </div>
            </div>  
        )}













        {/* {session && (
        )} */}
        {/* {!session && (
            <p>RETURN HOME</p>
        )} */}
        <p id="edit-store-title">
            EDIT</p>
        <p id="edit-store-brand-words">
            Store | Brand Logo</p>
            <ProfileImagePicker onFileChange={(file: File) => {
                setSelectedImage(file);
            }}/>
		<div id="edit-name-div">
            <p id="edit-store-brand-words">
               Store | Brand Name</p>
            <p id="edit-name">{storeName}</p> 
            <input
                id="edit-input"
                type="text"
                placeholder="My Store"
                value={storeName} 
                onChange={(e) => setStoreName(e.target.value)}  
            />
		</div>
		<div id="edit-store-address-wrapper">
			<p id="edit-store-location">
				Store Addresses | Locations
			</p>
            {showClaimAddress && (
                <div id="edit-store-location-wrapper">
                    <span>
                        <Image
                            loader={imageLoader}
                            alt=""
                            width={12}  
                            height={19}
                            id="edit-location-unclaimed" 
                            src="/images/market/location.png"/>
                    </span>
                    <span id="edit-store-address">
                        {storeAddressFromURL}
                    </span> 
                    <hr id="edit-black-liner"></hr>
                    <button id="claim-address" >
                        CLAIM ADDRESS</button>
                    <Link legacyBehavior href={`/own/${storeAddressFromURL}`} passHref>
                    <button id="visit-location" >
                        VISIT LOCATION</button>
                    </Link>
                </div>  
            )}
            {showClaimedAddress && (
                <div id="edit-store-location-wrapper">
                    <span>

                        <Image
                            loader={imageLoader}
                            alt=""
                            width={12}  
                            height={19}
                            id="edit-location" 
                            src="/images/market/location-ebony.png"/>
                    </span>
                    <span id="edit-store-address">
                        {storeAddressFromURL}
                    </span> 
                    <hr id="edit-black-liner"></hr>
                    <Link legacyBehavior href={`/own/${storeAddressFromURL}`} passHref>
                    <button id="visit-location" >
                        VISIT LOCATION</button>
                    </Link>
                </div>
            )}
		</div> 
        <button id="save-changes" >
            SAVE CHANGES</button>
        </>
    );
};

export default EditModule;
