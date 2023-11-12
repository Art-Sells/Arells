"use client";

import React from "react";

// Change below link after test
import '../../../../app/css/prototype/asset/blue-orange.css';
import '../../../../app/css/stayupdated.css';

//Loader Styles
import '../../../../app/css/modals/loading/spinnerBackground.css';

import { useState, ChangeEvent } from "react";

import Image from 'next/image';

type ImagePickerProps =  {
    onFileChange: (file: File) => void;
}

const ImagePicker = ({ onFileChange }: ImagePickerProps) => {

    const imageLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
        return `/${src}?w=${width}&q=${quality || 100}`
    }
    const [componentsLoaded, setComponentsLoaded] = useState({
        imagePlacer: false,
        imagePreview: false,
    });

    const handleComponentLoaded = (componentName: keyof typeof componentsLoaded) => {
        setComponentsLoaded(prevState => ({
            ...prevState,
            [componentName]: true
        }));
    };

    const [file, setFile] = useState<File | null>(null);
    const [previewURL, setPreviewURL] = useState<string>('');

    return (
        <>

            <div id="photo-div">
                <div id="photo-no-upload">
                    {previewURL &&
                        <Image
                            src={previewURL}
                            loader={imageLoader}
                            onLoad={() => handleComponentLoaded('imagePlacer')}
                            id="photo-blue-orange"
                            alt=""
                            width={400}
                            height={400}
                            key={previewURL} 
                        />
                    }
                </div>
                <label htmlFor="uploader" style={{ cursor: 'pointer' }}>
                    <Image
                        loader={imageLoader}
                        id="add-art-icon"
                        alt=""
                        width={27}
                        height={25}
                        src="images/prototype/Add-Ivory.png"
                    />
                </label>
            </div>
            <div id="enter-content">
                <input
                    id="uploader"
                    type="file"
                    style={{ display: 'none' }}
                    accept="image/png,image/jpeg"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files ? e.target.files[0] : undefined;
                        if (file) {
                            onFileChange(file);
                            const newURL = URL.createObjectURL(file);
                            setFile(file);
                            setPreviewURL(newURL);

                            // Convert image to Base64 and store in localStorage
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                localStorage.setItem("uploaded-image", reader.result as string);
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