"use client";

// Change below link after test
import '../../../app/css/edit/edit.css';

import React, { useState, ChangeEvent } from 'react';
import Image from 'next/image';

type ImagePickerProps = {
    onFileChange: (file: File) => void;
};

const ProfileImagePicker = ({ onFileChange }: ImagePickerProps) => {
    const [previewURL, setPreviewURL] = useState<string>('');
    const [uploadCount, setUploadCount] = useState(0);

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
        setUploadCount(count => count + 1);
    };

    return (
        <>
            {/* <div id="edit-profile-img-container">
                <Image
                   loader={imageLoader}
                    alt=""
                    width={100}  
                    height={100}
                    id="edit-profile-photo" 
                    src="images/market/Market-Default-Icon.jpg"
                />
            </div> */}
            <div id="edit-profile-img-container">
                <div id="edit-profile-photo-no-upload"
                key={uploadCount}>
                    {previewURL && (
                        <Image
                            loader={imageLoader}
                            src={previewURL}
                            id="edit-profile-photo"
                            alt=""
                            width={100}
                            height={100}
                            key={previewURL}
                        />
                    )}
                </div>
            </div>
            <label 
                htmlFor="uploader" 
                style={{ cursor: 'pointer' }}>
                    <Image
                        loader={imageLoader}
                        id="edit-profile-photo-icon"
                        alt=""
                        width={20}
                        height={20}
                        src="images/market/edit-profile.png"
                    />
            </label>
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

export default ProfileImagePicker;
