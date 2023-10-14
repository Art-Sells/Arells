"use client"

import React from "react";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import Web3Modal from "web3modal";
import { ReactNode, createContext, useContext, useState, useEffect } from "react";

type SignerContextType = {
    signer?: JsonRpcSigner;   // The type can be more specific based on the signer object structure
    address?: string;
    connectMetamask: () => Promise<void>;
}

const SignerContext = createContext<SignerContextType>({} as any);

const useSigner = () => useContext(SignerContext);

export const SignerProvider = ({ children }: { children: ReactNode }) => {
    const [walletIsConnected, setWalletIsConnected] = useState<string | null>(null);
    const [instance, setInstance] = useState<any>();

    useEffect(() => {
        const sessionValue = sessionStorage.getItem('walletConnectedSession');
        setWalletIsConnected(sessionValue);
    }, []);
    
    const [signer, setSigner] = useState<JsonRpcSigner>();
    const [address, setAddress] = useState<string>("");

    const web3ModalConfig = {
        cacheProvider: true, 
        network: "mumbai" 
    };

    const disconnectWallet = () => {
        sessionStorage.setItem('walletConnectedSession', 'false');
        setWalletIsConnected('false');
        setSigner(undefined);
        setAddress("");
        if (instance && instance.off) {
            instance.off("accountsChanged");
        }
    };

    const connectMetamask = async () => {
        console.log("connectMetamask function invoked");
        try {
            const web3modal = new Web3Modal(web3ModalConfig);
            const newInstance = await web3modal.connect();
            setInstance(newInstance);

            if (newInstance.on) {
                newInstance.on("accountsChanged", (accounts: string[]) => {
                    if (accounts.length === 0) {
                        // Wallet is probably disconnected
                        disconnectWallet();
                    }
                });
            }

            const provider = new Web3Provider(newInstance);
            const signerInstance = provider.getSigner();
            const addressValue = await signerInstance.getAddress();

            console.log("Connected address for Signer:", addressValue);
            setSigner(signerInstance);
            setAddress(addressValue);
            sessionStorage.setItem('walletConnectedSession', 'true');
            setWalletIsConnected('true');
        } catch (e) {
            console.log(e);
        }
    };

    // useEffect to clean up event listeners when component unmounts
    useEffect(() => {
        return () => {
            if (instance && instance.off) {
                instance.off("accountsChanged");
            }
        };
    }, [instance]);

    const contextValue = { signer, address, connectMetamask };

    return (
        <SignerContext.Provider value={ contextValue }>
            {children}
        </SignerContext.Provider>
    );
};

export default useSigner;
