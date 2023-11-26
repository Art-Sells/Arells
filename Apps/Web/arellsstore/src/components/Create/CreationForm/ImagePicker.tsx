"use client";

// Change below link after test
import '../../../app/css/prototype/asset/asset.css';
import '../../../app/css/stayupdated.css';

//Loader Styles
import '../../../app/css/modals/loading/spinnerBackground.css';

import React, { useState, ChangeEvent } from 'react';
import Image from 'next/image';

type ImagePickerProps = {
    onFileChange: (file: File) => void;
};

const ImagePicker = ({ onFileChange }: ImagePickerProps) => {
    const [previewURL, setPreviewURL] = useState<string>('');

    const imageLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
        return `/${src}?w=${width}&q=${quality || 100}`;
    };

    const cropImage = (file: File) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const img = document.createElement('img');
            img.src = reader.result as string;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const size = Math.min(img.width, img.height);
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');

                ctx?.drawImage(
                    img,
                    (img.width - size) / 2,
                    (img.height - size) / 2,
                    size,
                    size,
                    0,
                    0,
                    size,
                    size
                );

                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], file.name, {
                            type: 'image/png',
                        });
                        const newURL = URL.createObjectURL(newFile);
                        setPreviewURL(newURL);
                        onFileChange(newFile);
                    }
                }, 'image/png');
            };
        };
    };

    return (
        <>
            <div id="photo-div">
                <div id="photo-no-upload">
                    {previewURL && (
                        <Image
                            loader={imageLoader}
                            src={previewURL}
                            alt=""
                            width={400}
                            height={400}
                            key={previewURL}
                        />
                    )}
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
                    accept="image/png, image/jpeg"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files ? e.target.files[0] : undefined;
                        if (file) {
                            cropImage(file);
                        }
                    }}
                />
            </div>
        </>
    );
};

export default ImagePicker;
