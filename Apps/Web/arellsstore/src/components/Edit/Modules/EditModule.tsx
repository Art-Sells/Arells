"use client";

import { useRouter } from 'next/router';
import '../../../app/css/prototype/asset/asset.css';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from "next-auth/react";

import Image from 'next/image';

// Change below link after test
import '../../../app/css/edit/edit.css';

//Loader Styles
import '../../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../../app/css/modals/loading/spinner.module.css';
import Link from 'next/link';

const EditModule = () => {
    // Sign in/out
	const { data: session } = useSession();
    // Sign in/out

    const [showLoading, setLoading] = useState(true);
    const imageLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
        return `${src}?w=${width}&q=${quality || 100}`;
    };

    const router = useRouter();
    const storeAddressFromURL = useMemo(() => {
        const address = Array.isArray(router.query.storeAddress)
            ? router.query.storeAddress[0]
            : router.query.storeAddress;
        return address ? address.toLowerCase() : null;
    }, [router.query.storeAddress]);


    useEffect(() => {
        if (storeAddressFromURL) {
            setLoading(false);
        }
    }, [storeAddressFromURL]);

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
        {/* {session && (
        )} */}
        {/* {!session && (
            <p>RETURN HOME</p>
        )} */}
        <p id="edit-store-title">
            EDIT</p>
        <p id="edit-store-brand-words">
            Store | Brand Logo</p>
        <div id="edit-profile-img-container">
        <Image
            loader={imageLoader}
            alt=""
            width={100}  
            height={100}
            id="edit-profile-photo" 
            src="/images/market/Market-Default-Icon.jpg"/>
		</div>	
		<div id="edit-name-div">
            <p id="edit-store-brand-words">
               Store | Brand Name</p>
            <p id="edit-name">My Store</p>
            <input
                id="edit-input"
                type="text"
                placeholder="My Store"                     
            />   
		</div>
		<div id="edit-store-address-wrapper">
			<p id="edit-store-location">
				Store Addresses | Locations
			</p>
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
                <button id="claim-address" >
                    CLAIM ADDRESS</button>
                <Link legacyBehavior href={`/own/${storeAddressFromURL}`} passHref>
                <button id="visit-location" >
                    VISIT LOCATION</button>
                </Link>
            </div>
		</div> 

        </>
    );
};

export default EditModule;
