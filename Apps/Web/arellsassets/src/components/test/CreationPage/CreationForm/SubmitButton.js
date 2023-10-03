import React from "react";

import { useFormikContext } from "formik";

const SubmitButton = () => {
  const { isSubmitting, submitForm } = useFormikContext();

  return (
  <button 
      type="button"
      id="post-created-art"
      data-loading={isSubmitting} 
      onClick={submitForm}
      >
      CREATE ART
  </button>
  );
};

export default SubmitButton;