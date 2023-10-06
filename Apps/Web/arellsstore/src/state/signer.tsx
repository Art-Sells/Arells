// Assuming "use client" is a comment or you need to replace it with the appropriate import
// "use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import Web3Modal from "web3modal";

type ISignerContext = {
    signer: any | null; // Specify the exact type if known
    address: string;
    connectMetamask: () => void;
}

const SignerContext = createContext<ISignerContext>({} as any);

const useSigner = () => useContext(SignerContext);

interface SignerProviderProps {
    children: ReactNode;
}

export const SignerProvider = ({children} : { children: ReactNode }) => {
    const [signer, setSigner] = useState<JsonRpcSigner>(); // Specify the exact type if known
    const [address, setAddress] = useState<string>("");

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
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            setSigner(signer);
            setAddress(address);
        } catch (e) {
            console.log(e);
        }
    }

    const contextValue: ISignerContext = { signer, address, connectMetamask };

    return (
        <SignerContext.Provider value={contextValue}>
            {children}
        </SignerContext.Provider>
    );
};

export default useSigner;

