"use client";

import React from "react";

// Change below link after test
import '../../../../app/css/prototype/asset/blue-orange.css';
import '../../../../app/css/stayupdated.css';

//Loader Styles
import '../../../../app/css/modals/loading/spinnerBackground.css';

import { useEffect, useState} from 'react';

import Image from 'next/image';

const ImagePicker = ({ onFileChange }) => {

    const imageLoader = ({ src, width, quality }) => {
        return `/${src}?w=${width}&q=${quality || 100}`
    }

{/*<!-- loader functions below -->*/}
    const [showLoading, setLoading] = useState(false);
    const [componentsLoaded, setComponentsLoaded] = useState({
        imagePlacer: false,
		imagePreview: false,
    });
    const handleComponentLoaded = (componentName) => {
        setComponentsLoaded(prevState => ({ 
            ...prevState, 
            [componentName]: true 
        }));
    };
    useEffect(() => {
        if (Object.values(componentsLoaded).every(Boolean)) {
            setLoading(false);
        }
    }, [componentsLoaded]);

{/*<!-- loader functions above -->*/}

{/*<!-- image uploader functions below -->*/}

    const [file, setFile] = useState(null);
    console.log("Selected file:", file);
	const [previewURL, setPreviewURL] = useState(''); 


{/*<!-- image uploader functions above -->*/}	

    return (
        <>
{/*<!-- Modals below link after test -->*/}

        {showLoading && (
			<div id="spinnerBackground">
			<Image 
				loader={imageLoader}
				alt="" 
				width={29}
				height={30}
				id="arells-loader-icon" 
				src="images/Arells-Icon.png"/>        
			</div>
		)}
		{showLoading && (
			<div className={styles.spinner}></div>
		)}

{/*<!-- Modals Above -->*/}            
            <div id="photo-div">
                <div
                id="photo-no-upload">
                    {previewURL && 
                        <Image 
                        src={previewURL} 
                        loader={imageLoader}
                        onLoad={() => handleComponentLoaded('imagePlacer')}
                        id="photo-blue-orange"
                        alt="" 
                        width={400}
                        height={400}/>
                    }
                </div>
                <label htmlFor="uploader" style={{ cursor: 'pointer' }}>
                    <Image 
                    loader={imageLoader}
                    id="add-art-icon"
                    alt=""
                    width={27}
                    height={25}  
                    src="images/prototype/Add-Ivory.png"/>
                </label>							
            </div>
            <div id="enter-content">
                <input
                    id="uploader"
                    type="file"
                    style={{ display: 'none' }}
                    accept="image/png,image/jpeg"
                    onChange={(e) => {
                        const file = e.target.files ? e.target.files[0] : undefined;
                        console.log('Input change triggered', e.target.files);
                        if (file) {
                            console.log('File identified:', file);
                            onFileChange(file);
                            const newURL = URL.createObjectURL(file);
                            setFile(file);
                            setPreviewURL(newURL);
                            
                            // Convert image to Base64 and store in localStorage
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                localStorage.setItem("uploaded-image", reader.result);
                            };
                            reader.readAsDataURL(file);
                        }
                    }}
                />
            </div>	
        </>

    );

};

export default ImagePicker;