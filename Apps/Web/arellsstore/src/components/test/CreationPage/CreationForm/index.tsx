import React from "react";

import { Form, Formik, FormikHelpers } from "formik";
import FormikInput from "./FormikInput";
import ImagePicker from "./ImagePicker";
import SubmitButton from "./SubmitButton";

import {useState, useEffect} from "react";

export type CreationValues = {
  name: string;
  image: string | File;
};

type CreationFormProps = {
  onSubmit: (values: CreationValues) => Promise<void>;
};

const CreationForm = ({ onSubmit }: CreationFormProps) => { 
  const InitialValues: CreationValues = { name: "", image: "" };

  return (
    <Formik
      initialValues={InitialValues}
      validateOnBlur={false}
      validateOnChange={false}
      validateOnMount={false}
      onSubmit={onSubmit}
    >
      <Form>
        <ImagePicker onFileChange={function (file: File): void {
          throw new Error("no image");
        } }/>
        <div>
          <FormikInput name="name" placeholder="name" />
          <SubmitButton />
        </div>
      </Form>
    </Formik>
  );
};

export default CreationForm;