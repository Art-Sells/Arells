import React from "react";

import { useField } from "formik";

// Removed the TypeScript type definitions

const FormikInput = (props) => {
  const [, { error, value }, { setValue }] = useField(props.name);

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      error={error}
      {...props}
    />
  );
};

export default FormikInput;
