"use client"

import React from "react";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import Web3Modal from "web3modal";
import { ReactNode, createContext, useContext, useState, useEffect } from "react";

import '../app/css/modals/walletConnected.css';
import '../app/css/modals/loading/spinnerBackground.css';
import styles from '../app/css/modals/loading/spinner.module.css';

import Image from 'next/image';

type SignerContextType = {
    signer?: JsonRpcSigner;   
    address?: string;
    loadingWallet: boolean;
    connectMetamask: () => Promise<void>;
}

const SignerContext = createContext<SignerContextType>({} as any);

const useSigner = () => useContext(SignerContext);

export const SignerProvider = ({ children }: { children: ReactNode }) => {
    const imageLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
        return `/${src}?w=${width}&q=${quality || 100}`;
    };

    const [signer, setSigner] = useState<JsonRpcSigner>();
    const [address, setAddress] = useState("");
    const [showLoadingWalletConnection, setLoadingWalletConnection] = useState(false);
    const [loadingWallet, setLoadingWallet] = useState(false);
    const [connected, setConnected] = useState(false);
    const [checkWallet, setCheckWallet] = useState(false);
    const [disconnected, setDisconnected] = useState(false);

    const handleDisconnect = () => {
        setDisconnected(true);
        localStorage.removeItem("walletConnected");
        localStorage.removeItem("savedAddress");
    };
    
    useEffect(() => {
        async function initialize() {
            if (window.ethereum) {
                // Fetch and set the address from localStorage if it exists
                const savedAddress = localStorage.getItem("savedAddress");
                if (savedAddress) {
                    setAddress(savedAddress);
                }
    
                window.ethereum.on("accountsChanged", async (accounts: string[]) => {
                    if (accounts.length === 0) {
                        handleDisconnect();
                    } else {
                        await connectMetamask();
                        // Update savedAddress on account change
                        localStorage.setItem("savedAddress", accounts[0]);
                    }
                });
                window.ethereum.on("disconnect", handleDisconnect);
    
                const wasWalletConnected = localStorage.getItem("walletConnected") === "true";
                if (wasWalletConnected && window.ethereum.isConnected()) {
                    setConnected(true);
    
                    const provider = new Web3Provider(window.ethereum);
                    const signerInstance = provider.getSigner();
    
                    // Fetch the address only if savedAddress is not available
                    if (!savedAddress) {
                        const addressInstance = await signerInstance.getAddress();
                        setAddress(addressInstance);
                        localStorage.setItem("savedAddress", addressInstance);
                    }
    
                    setSigner(signerInstance);
                }
            }
        }
    
        initialize();
    
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener("accountsChanged", connectMetamask); // Remove listener
                window.ethereum.removeListener("disconnect", handleDisconnect);
            }
        };
    }, []);
    

    useEffect(() => {
       if (signer && !address) {
           const getAddress = async () => {
               const retrievedAddress = await signer.getAddress();
               setAddress(retrievedAddress);
           };
           getAddress();
       }
    }, [signer]);

    const web3ModalConfig = {
        cacheProvider: true, 
        network: "mumbai" 
    };

    const connectMetamask = async () => {
        setLoadingWallet(true);
        setLoadingWalletConnection(true);
        try {
            const web3modal = new Web3Modal(web3ModalConfig);
            const newInstance = await web3modal.connect();
            const provider = new Web3Provider(newInstance);
            const signer = provider.getSigner();
            const address = await signer.getAddress();

            setSigner(signer);
            setAddress(address);
            localStorage.setItem("savedAddress", address); 
            
            setConnected(true); // Show the modal once connected
            localStorage.setItem("walletConnected", "true"); // Store flag

        } catch (e) {
            console.log(e);
            setLoadingWalletConnection(false);
            setCheckWallet(true); // Show the modal once connected
            localStorage.removeItem("walletConnected");
        }
        setLoadingWallet(false);
        setLoadingWalletConnection(false);
    };

    const closeProviderModals = () => {  // New function to close the modal
        setConnected(false);
        setCheckWallet(false);
        setDisconnected(false);
        localStorage.removeItem("walletConnected"); // Clear the flag
        window.location.reload();

    };

    return (
        <SignerContext.Provider value={{ signer, address, loadingWallet, connectMetamask }}>
            {children}
            {showLoadingWalletConnection && (
                <div id="connectingBackground">
                    <p id="connectingWalletWords">CONNECTING</p>          
                </div>
            )}
            {connected && (   // Display the modal if walletConnected is true
                <div id="walletConnected">
                    <div id="wallet-connected-modalGood">
                        <p>CONNECTED</p>
                        <button id="wallet-connected-close" onClick={closeProviderModals}>OK</button>    
                    </div>
                </div>  
            )}
            {checkWallet && (   // Display the modal if walletConnected is true
                <div id="connectingBackground">
                    <div id="wallet-connected-modal">
                        <p id="connectingWalletWords">REVIEW CONNECTION</p>
                        <button id="wallet-connecting-close" onClick={closeProviderModals}>OK</button>    
                    </div>
                </div>  
            )}
            {disconnected && (   // Display the modal if walletConnected is true
                <div id="walletConnected">
                    <div id="wallet-connected-modalGood">
                        <p>DISCONNECTED</p>
                        <button id="wallet-connected-close" onClick={closeProviderModals}>OK</button>    
                    </div>
                </div>  
            )}

        </SignerContext.Provider>
    );
};

export default useSigner;
