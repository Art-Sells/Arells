import React, {useState} from "react";

import useSigner from "../../../state/signer";
import { useFormikContext } from "formik";

// Change below link after test
import '../../../app/css/prototype/asset/asset.css';
import '../../../app/css/modals/connect-wallet.css';

import Image from 'next/image';

const SubmitButton = () => {
  const { isSubmitting, submitForm } = useFormikContext();
	const { address, connectWallet} = useSigner();

  const handleCreateArt = () => {
    if (!address) {
      connectWallet();
    } else {
      submitForm();
    }
  };

  return (
    <>
      <button 
          type="button"
          id="post-created-art"
          data-loading={isSubmitting} 
          onClick={handleCreateArt}>
        CREATE ART
      </button>
    </>
  );
};

export default SubmitButton;
