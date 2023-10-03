import React from "react";

import { Form, Formik } from "formik";
import FormikInput from "./FormikInput";
import ImagePicker from "./ImagePicker";
import SubmitButton from "./SubmitButton";

import {useState, useEffect} from "react";

export const InitialValues = { 
  name: "",
  image: null,
}; 

const CreationForm = ({ onSubmit }) => { 
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
      console.log("Updated selected file:", selectedFile);
  }, [selectedFile]);


  const handleSubmit = (values) => {
      onSubmit({ ...values, image: selectedFile });
  };

  return (
    <Formik
      initialValues={InitialValues}
      validateOnBlur={false}
      validateOnChange={false}
      validateOnMount={false}
      onSubmit={handleSubmit}
    >
      <Form>
        <ImagePicker onFileChange={setSelectedFile}/>
        <div>
          <FormikInput name="name" placeholder="name" />
          <SubmitButton />
        </div>
      </Form>
    </Formik>
  );
};

export default CreationForm;