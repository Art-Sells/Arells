"use client"

import React from "react";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import Web3Modal from "web3modal";
import { ReactNode, createContext, useContext, useState, useEffect } from "react";

import '../app/css/modals/walletConnected.css';
import '../app/css/modals/loading/spinnerBackground.css';
import '../app/css/modals/connect-wallet.css';
import Image from 'next/image';

type SignerContextType = {
    signer?: JsonRpcSigner;   
    address?: string;
    loadingWallet: boolean;
    connectWallet(): any;
    
}

const SignerContext = createContext<SignerContextType>({} as any);

const useSigner = () => useContext(SignerContext);

export const SignerProvider = ({ children }: { children: ReactNode }) => {
    const imageLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
        return `/${src}?w=${width}&q=${quality || 100}`;
    };

    const [showDownloadWallet, setShowDownloadWallet] = useState(false);
    const [showConnectWallet, setShowConnectWallet] = useState(false);
    const [signer, setSigner] = useState<JsonRpcSigner>();
    const [address, setAddress] = useState("");
    const [showLoadingWalletConnection, setLoadingWalletConnection] = useState(false);
    const [loadingWallet, setLoadingWallet] = useState(false);
    const [connected, setConnected] = useState(false);
    const [checkWallet, setCheckWallet] = useState(false);
    const [disconnected, setDisconnected] = useState(false);

// Connect Wallet function/s below 
    const connectWallet = () => {
        if (!window.ethereum) {
            setShowDownloadWallet(true);
        } else {
            setShowConnectWallet(true);
        }
    };
    const downloadWalletFunction = () => {
            // No Ethereum-compatible wallet detected, redirecting to MetaMask website
            window.open('https://metamask.io/', '_blank');
            setShowDownloadWallet(false);
            setLoadingWalletConnection(true);
    };
	const connectWalletFunction = () => {
            connectMetamask();
            setShowConnectWallet(false);
    };
// Connect Wallet functions/s above

    const handleDisconnect = () => {
        setDisconnected(true);
        localStorage.removeItem("walletConnected");
        localStorage.removeItem("savedAddress");
    };
    
    useEffect(() => {
        async function initialize() {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' }); // Get accounts
                
                if (accounts.length === 0) {
                    console.error("No account connected");
                    return;
                }
                
                const provider = new Web3Provider(window.ethereum);
                const signerInstance = provider.getSigner();
                setSigner(signerInstance);
                
                const currentAddress = await signerInstance.getAddress();
                
                setAddress(currentAddress);
   
                const savedAddress = localStorage.getItem("savedAddress");
    
                // If savedAddress is not the same as currentAddress, update it in localStorage
                if (savedAddress !== currentAddress) {
                    localStorage.setItem("savedAddress", currentAddress);
                }
    
                window.ethereum.on("accountsChanged", async (accounts: string[]) => {
                    if (accounts.length === 0) {
                        handleDisconnect();
                        setSigner(undefined);  // Clear signer state
                        setAddress("");  // Clear address state
                    } else {
                        const provider = new Web3Provider(window.ethereum);
                        const signerInstance = provider.getSigner();
                        setSigner(signerInstance);
                        
                        const newAddress = await signerInstance.getAddress();
                        setAddress(newAddress);
                    }
                });          
    
                window.ethereum.on("disconnect", handleDisconnect);
    
                const wasWalletConnected = localStorage.getItem("walletConnected") === "true";
                setConnected(wasWalletConnected);
            }
        }
    
        initialize();
    
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener("accountsChanged", connectMetamask);
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
            const signerInstance = provider.getSigner();
            const currentAddress = await signerInstance.getAddress();
       
            setSigner(signerInstance);
                
            localStorage.setItem("savedAddress", currentAddress);
            setConnected(true);
            localStorage.setItem("walletConnected", "true");
        } catch (e) {
            console.log(e);
            setLoadingWalletConnection(false);
            setCheckWallet(true);
            localStorage.removeItem("walletConnected");
        }
    
        setLoadingWallet(false);
        setLoadingWalletConnection(false);
    };
   

    const closeProviderModals = () => {  // New function to close the modal
        setConnected(false);
        setCheckWallet(false);
        setDisconnected(false);
        setLoadingWalletConnection(false);
        localStorage.removeItem("walletConnected"); // Clear the flag
        window.location.reload();

    };

    return (
        <SignerContext.Provider value={{ 
            signer, address, loadingWallet, connectWallet }}>
            {children}
            {showDownloadWallet && (
			<div id="connectWalletBuy">
				<div className="connect-wallet-content">
					<p id="connect-wallet-words">CONNECT WALLET</p>
					<button id="connectWallet"
						onClick={downloadWalletFunction}
						disabled={loadingWallet}>
						<Image 
						loader={imageLoader}
						id="wallet-icon"
						alt=""
						width={50}
						height={50}  
						src="images/prototype/coinbase-wallet-logo.png"/>
					</button>		
				</div>
			</div>	  
		    )}    
            {showConnectWallet && (
			<div id="connectWalletBuy">
				<div className="connect-wallet-content">
					<p id="connect-wallet-words">CONNECT WALLET</p>
					<button id="connectWallet"
						onClick={connectWalletFunction}
						disabled={loadingWallet}>
						<Image 
						loader={imageLoader}
						id="wallet-icon"
						alt=""
						width={50}
						height={50}  
						src="images/prototype/coinbase-wallet-logo.png"/>
					</button>		
				</div>
			</div>	  
		    )}   
            {showLoadingWalletConnection && (
                <div id="walletConnected">
                    <div id="wallet-connected-modalGood">
                        <p>RELOADING CONNECTION</p>
                        <button id="reloading-connection-close" onClick={closeProviderModals}>OK</button>    
                    </div>
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
                        <p id="connectingWalletWords">CHECK OPEN WALLET</p>
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