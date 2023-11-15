import { ChangeEvent, InputHTMLAttributes, useState } from "react";

type InputProps = { error?: string } & InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ onChange, ...props }: InputProps) => {
    const [inputValue, setInputValue] = useState('');

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*\.?\d*$/.test(value)) { // Allows numbers and one decimal point
            setInputValue(value);
            if (onChange) {
                onChange(e);
            }
        }
    };

    const handleBlur = (e: any) => {
        // Additional validation or correction on losing focus
        setInputValue(prev => prev.trim());
    };

    return (
        <input
            {...props}
            type="tel"
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            inputMode="decimal"
        />
    );
};
