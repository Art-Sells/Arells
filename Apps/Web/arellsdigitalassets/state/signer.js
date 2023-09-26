"use client";

import React from "react";
import { Web3Provider } from "@ethersproject/providers";
import Web3Modal from "web3modal";
import { createContext, useContext, useState, useEffect } from "react";

const SignerContext = createContext({});

const useSigner = () => useContext(SignerContext);

export const SignerProvider = ({ children }) => {
    const [signer, setSigner] = useState(null);
    const [address, setAddress] = useState("");

    // Only necessary settings for Web3Modal when connecting with MetaMask
    const web3ModalConfig = {
      cacheProvider: true, // Optional: cache the user's chosen provider & auto-load on page refreshes
      network: "mumbai"     // You've specified mumbai network. Ensure you're using MetaMask with the mumbai testnet selected
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

    const contextValue = { signer, address, connectMetamask };

    return (
        <SignerContext.Provider value={contextValue}>
            {children}
        </SignerContext.Provider>
    );
};

export default useSigner;
