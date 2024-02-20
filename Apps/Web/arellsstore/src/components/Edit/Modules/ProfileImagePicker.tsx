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

  const cropImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = Math.min(img.width, img.height);
          canvas.width = maxSize;
          canvas.height = maxSize;
          const ctx = canvas.getContext('2d');
          if (!ctx) { // Check if ctx is null
            reject(new Error("Failed to get canvas context"));
            return; // Exit the function if no context
          }
          ctx.drawImage(img, (img.width - maxSize) / 2, (img.height - maxSize) / 2, maxSize, maxSize, 0, 0, maxSize, maxSize);
          canvas.toBlob(blob => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            resolve(blob);
          }, 'image/png');
        };
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };
  

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file) return;

    try {
      const croppedBlob = await cropImage(file);
      const croppedFile = new File([croppedBlob], `cropped-${file.name}`, { type: 'image/png' });
      const uploadResult = await uploadImageToS3(croppedFile);
      if (uploadResult) {
        setPreviewURL(uploadResult);
        onFileChange(uploadResult);
        setUploadCount(count => count + 1); // Ensure the component updates with the new preview
      }
    } catch (error) {
      console.error("Error processing image:", error);
    }
  };

  const uploadImageToS3 = async (file: File): Promise<string> => {
    const fileName = `profile-images/${file.name}-${Date.now()}`;
    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: fileName,
      Body: file,
      ContentType: 'image/png', // Since we're converting all images to PNG
      ACL: 'public-read',
    };

    try {
      const { Location } = await s3.upload(params).promise();
      return Location; // URL of the uploaded image
    } catch (error) {
      console.error("Error uploading image to S3:", error);
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
