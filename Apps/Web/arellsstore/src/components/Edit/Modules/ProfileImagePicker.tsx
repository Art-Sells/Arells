import React, { useState, ChangeEvent } from 'react';
import Image from 'next/image';
import AWS from 'aws-sdk';

// AWS S3 configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.DYNAMODB_ACCESS_KEY_ID,
  secretAccessKey: process.env.DYNAMODB_SECRET_ACCESS_KEY,
  region: 'us-west-1',
});

type ImagePickerProps = {
    onFileChange: (url: string) => void;
  };

const ProfileImagePicker: React.FC<ImagePickerProps> = ({ onFileChange }) => {
  const [previewURL, setPreviewURL] = useState<string>('');
  const [uploadCount, setUploadCount] = useState(0);

  const imageLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
    return `/${src}?w=${width}&q=${quality || 100}`;
  };


  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const objectURL = URL.createObjectURL(file);

    const imgElement = document.createElement('img');
    imgElement.src = objectURL;

    imgElement.onload = async () => {

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = imgElement.width;
      canvas.height = imgElement.height;

      ctx.drawImage(imgElement, 0, 0);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], `cropped-${file.name}`, { type: 'image/png' });

        const uploadResult = await uploadImageToS3(croppedFile);
        if (uploadResult) {
          setPreviewURL(uploadResult);
          onFileChange(uploadResult);
          setUploadCount(count => count + 1); 
        }
      }, 'image/png');

      URL.revokeObjectURL(objectURL);
    };
  };


  const uploadImageToS3 = async (file: File): Promise<string> => {
    const fileName = `profile-images/${file.name}-${Date.now()}`;
    console.log('S3_BUCKET_NAME from env:', process.env.NEXT_PUBLIC_S3_BUCKET_NAME);
    const params = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
      Key: fileName,
      Body: file,
      ContentType: 'image/png',
      ACL: 'public-read',
    };

    try {
      console.log('Uploading with params:', params);
      const { Location } = await s3.upload(params).promise();
      return Location; 
    } catch (error) {
      console.error("Error uploading image to S3:", error);
      console.log("Detailed error:", error);
      throw new Error('Failed to upload image');
    }
  };

  return (
    <>
        <div id="edit-profile-img-container">
            <div id="edit-profile-photo-no-upload"
            key={uploadCount}>
                {previewURL ? (
                    <div id="edit-profile-photo-no-upload">
                        <Image
                            loader={imageLoader}
                            src={previewURL 
                                || 
                                "images/market/Market-Default-Icon.jpg"} 
                            id="edit-profile-photo"
                            alt=""
                            width={100}
                            height={100}
                            key={uploadCount}
                        />
                    </div>
                ) : (
                    <Image
                        loader={imageLoader}
                        src="images/market/Market-Default-Icon.jpg"
                        alt=""
                        width={100}
                        height={100}
                        id="edit-profile-photo"
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
                onChange={handleFileChange}
            />
        </div>
    </>
);
};

export default ProfileImagePicker;
