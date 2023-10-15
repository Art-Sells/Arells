"use client"

import React from "react";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import Web3Modal from "web3modal";
import { ReactNode, createContext, useContext, useState, useEffect } from "react";

type SignerContextType = {
    signer?: JsonRpcSigner;   // The type can be more specific based on the signer object structure
    address?: string;
    loadingWallet: boolean;
    connectMetamask: () => Promise<void>;
}

const SignerContext = createContext<SignerContextType>({} as any);

const useSigner = () => useContext(SignerContext);

export const SignerProvider = ({ children }: { children: ReactNode }) => {
    const [signer, setSigner] = useState<JsonRpcSigner>();
    const [address, setAddress] = useState("");
    const [loadingWallet, setLoadingWallet] = useState(false);

    
    useEffect(() => {
        const web3modal = new Web3Modal();
        if (web3modal.cachedProvider) {
            connectMetamask();
        }
        window.ethereum.on("accountsChanged", connectMetamask);
    }, []); 

    const web3ModalConfig = {
        cacheProvider: true, 
        network: "mumbai" 
    };

    const connectMetamask = async () => {
        setLoadingWallet(true);
        try {
            const web3modal = new Web3Modal(web3ModalConfig);
            const newInstance = await web3modal.connect();
            const provider = new Web3Provider(newInstance);
            const signer = provider.getSigner();
            const address = await signer.getAddress();

            setSigner(signer);
            setAddress(address);

            // if (typeof window !== 'undefined') {
            //     window.location.reload();
            // }
            
        } catch (e) {
            console.log(e);
        }
        setLoadingWallet(false);
    };

    const contextValue = { signer, address, loadingWallet, connectMetamask };

    return (
        <SignerContext.Provider value={ contextValue }>
            {children}
        </SignerContext.Provider>
    );
};

export default useSigner;
