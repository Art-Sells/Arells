"use client";

import { useRouter } from 'next/router';
import '../../../app/css/prototype/asset/asset.css';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from "next-auth/react";

import Image from 'next/image';

// Change below link after test
import '../../../app/css/prototype/seller-created.css';
import '../../../app/css/prototype/buyer-collected.css';

//Loader Styles
import '../../../app/css/modals/loading/spinnerBackground.css';
import styles from '../../../app/css/modals/loading/spinner.module.css';

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
        		<div id="profile-img-container-buyer-collected">
			<Image
				loader={imageLoader}
				alt=""
				width={100}  
				height={100}
				id="profile-photo-buyer-collected" 
				src="/images/market/Market-Default-Icon.jpg"/>
		</div>	
		<div id="name-div">
			<h1 id="name-buyer-collected">My Store</h1>
		</div>
		<div id="store-address-wrapper">
			<span>
				<Image
					loader={imageLoader}
					alt=""
					width={13}  
					height={20}
					id="location" 
					src="/images/market/location-ebony.png"/>
			</span>
			<span id="store-location">
				Store Address | Location
			</span>
			<p id="store-address">
				{storeAddressFromURL}
			</p> 
		</div> 

        </>
    );
};

export default EditModule;
