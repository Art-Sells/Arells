import React, { InputHTMLAttributes } from "react";

import { useField } from "formik";
import useSigner from "../../../state/signer";

//change below link after test
import '../../../app/css/prototype/asset/asset.css';

type FormikInputProps = {
  name: string;
} & InputHTMLAttributes<HTMLInputElement>;

const FormikInput = (props: FormikInputProps) => {
  const [, { value }, { setValue }] = useField(props.name);

  return (
    <>
    <input
      id="input"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      {...props}
    />
    </>
  );
};

export default FormikInput;
