"use client";

import React from "react";
import { Web3Provider } from "@ethersproject/providers";
import Web3Modal from "web3modal";
import { ReactNode, createContext, useContext, useState, useEffect } from "react";

type SignerContextType = {
    signer: any | null;   // The type can be more specific based on the signer object structure
    address: string;
    connectMetamask: () => Promise<void>;
}

const SignerContext = createContext<SignerContextType>({} as any);

const useSigner = () => useContext(SignerContext);

export const SignerProvider = ({ children }: { children: ReactNode }) => {
    const [signer, setSigner] = useState<any | null>(null);
    const [address, setAddress] = useState<string>("");

    // Only necessary settings for Web3Modal when connecting with MetaMask
    const web3ModalConfig = {
        cacheProvider: true, 
        network: "mumbai" 
    };

    useEffect(() => {
        const web3modal = new Web3Modal(web3ModalConfig);
        if (web3modal.cachedProvider) connectMetamask();
    }, []);

    const connectMetamask = async () => {
        try {
            const web3modal = new Web3Modal(web3ModalConfig);
            const instance = await web3modal.connect();
            const provider = new Web3Provider(instance);
            const signerInstance = provider.getSigner();
            const addressValue = await signerInstance.getAddress();
            setSigner(signerInstance);
            setAddress(addressValue);
        } catch (e) {
            console.log(e);
        }
    }

    const contextValue = { signer, address, connectMetamask };

    return (
        <SignerContext.Provider value={contextValue}>
            {children}
        </SignerContext.Provider>
    );
};

export default useSigner;