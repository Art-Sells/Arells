// Assuming these are already imported
import React, { createContext, useContext, useState, ReactNode } from "react";
import { ethers } from "ethers";
import CryptoJS from 'crypto-js';

interface SignerContextType {
    address: string;
    privateKey: string;
    createMASSwallet: () => Promise<void>;
}

const SignerContext = createContext<SignerContextType | undefined>(undefined);

export const SignerProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [address, setAddress] = useState("");
    const [privateKey, setPrivateKey] = useState("");

    const createMASSwallet = async () => {
        const newWallet = ethers.Wallet.createRandom();
        const encryptedPrivateKey = CryptoJS.AES.encrypt(newWallet.privateKey, 'your-secret-key').toString();
        setAddress(newWallet.address);
        setPrivateKey(encryptedPrivateKey);

        // Optionally save wallet details using an API, etc.
        // Logging the address and encrypted private key
        console.log("New Wallet Address:", newWallet.address);
        console.log("Encrypted Private Key:", encryptedPrivateKey);
    };

    return (
        <SignerContext.Provider value={{ address, privateKey, createMASSwallet }}>
            {children}
        </SignerContext.Provider>
    );
};

export const useSigner = () => {
    const context = useContext(SignerContext);
    if (!context) throw new Error('useSigner must be used within a SignerProvider');
    return context;
};