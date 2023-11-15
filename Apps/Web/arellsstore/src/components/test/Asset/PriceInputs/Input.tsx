// Change below link after test
import '../../../app/css/prototype/asset/asset.css';
import { InputHTMLAttributes } from "react";

type InputProps = { error?: string } & InputHTMLAttributes<HTMLInputElement>;

export const Input = (props: InputProps) => {
  // Spread the rest of the props directly into the input element
  return <input {...props} />;
};

