import React, { useState, useEffect, useCallback } from 'react';

const RWmodal = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => {
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    useEffect(() => {
        // This is equivalent to your init function
        // Add any additional initialization code here
    }, []);

    useEffect(() => {
        // This is equivalent to window.onclick = ...
        const handler = (event) => {
            if (event.target.id === 'RWmodal') {
                if (isOpen) {
                    close();
                }
            }
        };
        window.addEventListener('click', handler);

        // Cleanup after component unmount
        return () => {
            window.removeEventListener('click', handler);
        };
    }, [isOpen, close]);

    return isOpen ? (
        <div id="RWmodal" className="RWmodal">
            <div className="RWmodal-content">
                <p>{title}</p>
                {children}
                <p className="RWclose" onClick={close}>OK</p>
            </div>
        </div>
    ) : null;
};

export default RWmodal;