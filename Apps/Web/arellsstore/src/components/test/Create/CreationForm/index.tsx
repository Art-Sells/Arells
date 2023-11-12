import React from "react";

import { Form, Formik, FormikHelpers } from "formik";
import FormikInput from "./FormikInput";
import ImagePicker from "./ImagePicker";
import SubmitButton from "./SubmitButton";

console.log("Rendering ImagePicker");

export type CreationValues = {
  name: string;
  image: string | File;
};

type CreationFormProps = {
  onSubmit: (values: CreationValues) => Promise<void>;
};

const CreationForm = ({ onSubmit }: CreationFormProps) => { 
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const InitialValues: CreationValues = {
    name: "",
    image: selectedImage || ""
  };
  

  return (
    <Formik
      initialValues={InitialValues}
      validateOnBlur={false}
      validateOnChange={false}
      validateOnMount={false}
      onSubmit={(values) => {
        if (selectedImage) {
          console.log("Name:", values.name);
          console.log("Image:", selectedImage);
          onSubmit({ ...values, image: selectedImage });
        } else {
          console.log("Name:", values.name);
          console.log("Image not selected");
          // Handle the case where the image hasn't been selected if needed
        }
      }}
    >
      <Form>
      <ImagePicker onFileChange={(file: File) => {
        setSelectedImage(file);
      }}/>
        <div>
          <FormikInput name="name" placeholder="name" />
          <SubmitButton />
        </div>
      </Form>
    </Formik>
  );
};

export default CreationForm;