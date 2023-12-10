import React, { useEffect, useState } from "react";

import { Form, Formik, FormikHelpers } from "formik";
import FormikInput from "./FormikInput";
import ImagePicker from "./ImagePicker";
import SubmitButton from "./SubmitButton";

// change below link/s after test
import "../../../app/css/modals/create-sell-error.css";
import "../../../app/css/modals/create-art-modal.css";
import "../../../app/css/modals/created-art-modal.css";
import useSigner from "../../../state/signer";

import styles from '../../../app/css/modals/loading/loader.module.css';

import Image from 'next/image';
import Link from "next/link";

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

  const [showArtCreationModal, setArtCreationModal] = useState<boolean>(false);
  const [showArtCreatedModal, setArtCreatedModal] = useState<boolean>(false);

  const [showCreationErrorModal, setCreationErrorModal] = useState<boolean>(false);

  const [selectedImage, setSelectedImage] = useState<string | File>("");
  const InitialValues: CreationValues = {
    name: "",
    image: selectedImage || ""
  };
  
  const closeShowImageErrorModal = () => {
    setShowImageErrorModal(false);
    window.location.reload();

  };

  const closeShowNameErrorModal = () => {
    setShowNameErrorModal(false);
    window.location.reload();

  };

  const closeCreationErrorModal = () => {
    setCreationErrorModal(false);
    window.location.reload();
  };


  const { address, connectWallet} = useSigner();
  const [walletConnectionAttempted, setWalletConnectionAttempted] = useState(false);

  useEffect(() => {
    if (address) {
      setWalletConnectionAttempted(false);
    }
  }, [address]);

  const onSubmitHandler = async (
    values: { name: any; image?: string | File; }, 
    { setSubmitting }: any) => {
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

    if (showImageModal || showNameModal) {
      return; 
    }

    setArtCreationModal(true);     

    try {
      const delay = (ms: number | undefined) => 
        new Promise(resolve => setTimeout(resolve, ms));
      if (!address) {
        setShowImageErrorModal(false);
        setShowNameErrorModal(false);
        setArtCreationModal(false);
        setWalletConnectionAttempted(true);
        await connectWallet();
        return; 
      }
      await delay(1000);
      await onSubmit({ ...values, image: selectedImage });
      setArtCreationModal(false);
      setArtCreatedModal(true);
      console.log("Submission successful");
    } catch (error) {
      setArtCreationModal(false); 
      setCreationErrorModal(true);
    } finally {
      setSubmitting(false); // Reset submitting state
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
              width={80}
              height={25}
              id="error-name-image" 
              src="/images/prototype/EnterNameErrorImage.png"/>    
          <p id="needed-name-word">ENTER NAME</p>
          <button id="create-sell-error-close"
              onClick={closeShowNameErrorModal}>OK</button>	
          </div>
        </div>	
      )}

      {showArtCreationModal && (
        <div id="create-art-modal-wrapper">
          <div id="create-art-modal-content">
          <Image 
            // loader={imageLoader}
            alt="" 
            width={50}
            height={50}
            id="create-art-image" 
            src="/images/prototype/creatingArt.png"/>  
          <p id="create-art-words">CREATING ART</p>
          <div className={styles.loader}></div>
          </div>
        </div>	
      )}

      {showCreationErrorModal && (
        <div id="creation-error-wrapper">
          <div id="creation-error-content">
          <Image 
            // loader={imageLoader}
            alt="" 
            width={35}
            height={35}
            id="creation-error-image" 
            src="/images/prototype/cancelled.png"/>  
          <p id="creation-error-words">CANCELED</p>
          <button id="creation-error-close"
            onClick={closeCreationErrorModal}>OK</button>	
          </div>
        </div>	
      )}

      {showArtCreatedModal && (
        <div id="created-art-modal-wrapper">
          <div id="created-art-modal-content">
          <Image 
            // loader={imageLoader}
            alt="" 
            width={50}
            height={50}
            id="created-art-image" 
            src="/images/prototype/createdArt.png"/>  
          <p id="created-art-words">ART CREATED</p>
          <p id="created-art-paragraph">It'll take a few moments</p>
          <p id="created-art-paragraph">for your store to receive.</p>
          <Link href={`/own/${address}`} passHref>
            <button id="created-art-modal-close">RECEIVE ART</button>	
          </Link>   

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