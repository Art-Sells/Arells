import React, { useEffect, useState } from "react";

import { Form, Formik, FormikHelpers } from "formik";
import FormikInput from "./FormikInput";
import ImagePicker from "./ImagePicker";
import SubmitButton from "./SubmitButton";

// change below link/s after test
import "../../../app/css/modals/create-sell-error.css";
import useSigner from "../../../state/signer";

import Image from 'next/image';

export type CreationValues = {
  name: string;
  image: string | File;
};

type CreationFormProps = {
  onSubmit: (values: CreationValues) => Promise<void>;
};

const CreationForm = ({ onSubmit }: CreationFormProps) => { 
  const imageLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
    return `/${src}?w=${width}&q=${quality || 100}`;
};
  const [showImageErrorModal, setShowImageErrorModal] = useState<boolean>(false);
  const [showNameErrorModal, setShowNameErrorModal] = useState<boolean>(false);

  const [selectedImage, setSelectedImage] = useState<string | File>("");
  const InitialValues: CreationValues = {
    name: "",
    image: selectedImage || ""
  };
  
  const closeShowImageErrorModal = () => {
    setShowImageErrorModal(false);
  };

  const closeShowNameErrorModal = () => {
    setShowNameErrorModal(false);
  };

  const { address, connectWallet} = useSigner();
  const [walletConnectionAttempted, setWalletConnectionAttempted] = useState(false);

  useEffect(() => {
    if (address) {
      setWalletConnectionAttempted(false);
    }
  }, [address]);

  const onSubmitHandler = (values: { name: any; image?: string | File; }, { setSubmitting }: any) => {
    let showImageModal = false;
    let showNameModal = false;
  
    if (!selectedImage && values.name.trim() === "") {
      showImageModal = true;
    } else if (!selectedImage) {
      showImageModal = true;
    } else if (values.name.trim() === "") {
      showNameModal = true;
    }
  
    setShowImageErrorModal(showImageModal);
    setShowNameErrorModal(showNameModal);
  
    // Only check wallet connection if form fields are filled correctly
    if (!showImageModal && !showNameModal) {
      if (!address && !walletConnectionAttempted) {
        setWalletConnectionAttempted(true);
        connectWallet();
      } else {
        onSubmit({ ...values, image: selectedImage }).then(() => {
          setSubmitting(false);
        });
      }
    } else {
      setSubmitting(false); // Ensure setSubmitting is called even if there's an error
    }
  };

  return (
    <>

      {showImageErrorModal && (
        <div id="create-sell-error-wrapper">
          <div id="create-sell-error-content">
          <Image 
            // loader={imageLoader}
            alt="" 
            width={30}
            height={30}
            id="error-image" 
            src="/images/prototype/Add-Ivory.png"/>  
          <p id="needed-word">UPLOAD IMAGE</p>
          <button id="create-sell-error-close"
            onClick={closeShowImageErrorModal}>OK</button>	
          </div>
        </div>	
      )}

      {showNameErrorModal && (
        <div id="create-sell-error-wrapper">
          <div id="create-sell-error-content">
          <Image 
              // loader={imageLoader}
              alt="" 
              width={73}
              height={22}
              id="error-name-image" 
              src="/images/prototype/EnterName.png"/>    
          <p id="needed-word">ENTER NAME</p>
          <button id="create-sell-error-close"
              onClick={closeShowNameErrorModal}>OK</button>	
          </div>
        </div>	
      )}

      <Formik
        initialValues={InitialValues}
        onSubmit={onSubmitHandler}
      >
      <Form>
      <ImagePicker onFileChange={(file: File) => {
        setSelectedImage(file);
      }}/>
        <div>
          <FormikInput name="name" placeholder="Name" />
          <SubmitButton />
        </div>
      </Form>
    </Formik>
    </>
    
  );
};

export default CreationForm;