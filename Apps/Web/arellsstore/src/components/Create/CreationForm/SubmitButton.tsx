import React, {useEffect, useState} from "react";

import useSigner from "../../../state/signer";
import { useFormikContext } from "formik";

// Change below link after test
import '../../../app/css/prototype/asset/asset.css';
import '../../../app/css/modals/connect-wallet.css';

const SubmitButton = () => {
  const { isSubmitting, submitForm } = useFormikContext();


  return (
    <>
      <button 
          type="button"
          id="post-created-art"
          disabled={isSubmitting}
          data-loading={isSubmitting} 
          onClick={submitForm}>
        CREATE ART
      </button>
    </>
  );
};

export default SubmitButton;
