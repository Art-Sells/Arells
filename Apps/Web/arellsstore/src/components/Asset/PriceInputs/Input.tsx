import { ChangeEvent, InputHTMLAttributes, useState } from "react";

type InputProps = { error?: string } & InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ onChange, ...props }: InputProps) => {
    const [displayValue, setDisplayValue] = useState('');
    const [actualValue, setActualValue] = useState('');

    const formatNumber = (value: string) => {
        // Split the value into whole number and decimal parts
        const parts = value.split('.');
        const numericValue = parts[0].replace(/[^0-9]/g, ''); // Remove non-numeric characters from the whole number part
    
        let formattedValue = numericValue;
        if (numericValue) {
            // Format the whole number part with commas
            formattedValue = new Intl.NumberFormat('en-US', { maximumFractionDigits: 20 }).format(parseFloat(numericValue));
        }
    
        // Re-add the decimal part if it exists
        if (parts.length > 1) {
            formattedValue += '.' + parts[1];
        }
    
        return formattedValue;
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        // Replace commas for processing, but keep the decimal part intact
        let unformattedValue = value.replace(/,/g, '');
    
        if (/^\d*\.?\d*$/.test(unformattedValue)) {
            setDisplayValue(formatNumber(unformattedValue));
            setActualValue(unformattedValue);
    
            if (onChange) {
                onChange({ ...e, target: { ...e.target, value: unformattedValue } });
            }
        }
    };    

    const handleBlur = (e: any) => {
        // Additional validation or correction on losing focus
        setDisplayValue(prev => prev.trim());
        setActualValue(prev => prev.trim());
    };

    return (
        <input
            {...props}
            type="tel"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            inputMode="decimal"
        />
    );
};
