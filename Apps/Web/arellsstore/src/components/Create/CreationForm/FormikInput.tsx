import React, { InputHTMLAttributes } from "react";

import { useField } from "formik";
import useSigner from "../../../state/signer";

type FormikInputProps = {
  name: string;
} & InputHTMLAttributes<HTMLInputElement>;

const FormikInput = (props: FormikInputProps) => {
  const [, { value }, { setValue }] = useField(props.name);

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      {...props}
    />
  );
};

export default FormikInput;
