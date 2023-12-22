"use client"

import React, { useMemo } from "react";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import Web3Modal from "web3modal";
import { ReactNode, createContext, useContext, useState, useEffect } from "react";

import '../app/css/modals/walletConnected.css';
import '../app/css/modals/loading/spinnerBackground.css';
import '../app/css/modals/connect-wallet.css';
import Image from 'next/image';
import { ethers } from "ethers";


const polygonNetwork = {
    chainId: `0x${Number(137).toString(16)}`, // Polygon Mainnet chain ID in hexadecimal
    chainName: 'Polygon Mainnet',
    nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
    },
    rpcUrls: ['https://polygon-rpc.com/'],
    blockExplorerUrls: ['https://polygonscan.com/']
};



type SignerContextType = {
    signer?: JsonRpcSigner;   
    address?: string;
    loadingWallet: boolean;
    connectWallet(): any;
    
}

let CoinbaseWalletSDK: any;

if (typeof window !== 'undefined') {
    CoinbaseWalletSDK = require('@coinbase/wallet-sdk').CoinbaseWalletSDK;
}

const SignerContext = createContext<SignerContextType>({} as any);

const useSigner = () => useContext(SignerContext);
const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};


export const SignerProvider = ({ children }: { children: ReactNode }) => {
    

    const imageLoader = ({ src, width, quality }: { src: string, width: number, quality?: number }) => {
        return `/${src}?w=${width}&q=${quality || 100}`;
    }; 

    const [showDownloadWallet, setShowDownloadWallet] = useState(false);
    const [showConnectWallet, setShowConnectWallet] = useState(false);
    const [showMetaMask, setShowMetaMask] = useState(true);
    const [signer, setSigner] = useState<JsonRpcSigner>();
    const [address, setAddress] = useState("");
    const [showLoadingWalletConnection, setLoadingWalletConnection] = useState(false);
    const [loadingWallet, setLoadingWallet] = useState(false);
    const [connected, setConnected] = useState(false);
    const [checkWallet, setCheckWallet] = useState(false);
    const [disconnected, setDisconnected] = useState(false);

    const delay = (ms: number | undefined) => 
        new Promise(resolve => setTimeout(resolve, ms));

// Connect Wallet function/s below 
    const connectWallet = () => {
        if (!window.ethereum) {
            setShowDownloadWallet(true);
        } 
        else {
            setShowConnectWallet(true);
        }
    };
    const downloadCoinbaseFunction = () => {
        setShowDownloadWallet(false);
        if (isMobileDevice()) {
            if (isIOSDevice()) {
                window.location.href = "https://apps.apple.com/us/app/coinbase-wallet/id1278383455";
            } else if (isAndroidDevice()) {
                window.location.href = "https://play.google.com/store/apps/details?id=org.toshi";
            }
        } else {
            window.open('https://www.coinbase.com/wallet', '_blank');
        }
    };

    const downloadMetaMaskFunction = () => {
        setShowDownloadWallet(false);
        if (isIOSDevice()) {
            window.location.href = "https://apps.apple.com/us/app/metamask/id1438144202";
        } else if (isAndroidDevice()) {
            window.location.href = "https://play.google.com/store/apps/details?id=io.metamask";
        }
        else {
            window.open('https://metamask.io/download.html', '_blank');
            window.location.reload();
        }
    };
    
    const connectCoinbaseFunction = () => {
        if (window.ethereum) {
            connectCoinbase();
        } else if (isMobileDevice()) {
            if (isIOSDevice()) { 
                window.location.href = "cbwallet://dapp?cb_url=https%3A%2F%2Farells.com";
                window.location.reload();
            } else if (isAndroidDevice()) {
                window.location.href = "https://go.cb-w.com/dapp?cb_url=https%3A%2F%2Farells.com";
                window.location.reload();
            }
        } else {
            connectCoinbase();
        }
        setShowConnectWallet(false);
    };

    const connectMetaMaskFunction = () => {
        if (window.ethereum) {
            connectMetaMask();
        } else if (isMobileDevice()) {
            if (isIOSDevice()) {
                const dappUrl = 'https://arells.com'; // Replace with your dapp URL
                const deepLinkUrl = `https://metamask.app.link/dapp/${dappUrl}`;
                window.location.href = deepLinkUrl;
            } else if (isAndroidDevice()) {
                const dappUrl = 'https://arells.com'; // Replace with your dapp URL
                const deepLinkUrl = `https://metamask.app.link/dapp/${dappUrl}`;
                window.location.href = deepLinkUrl;
            }
        } else {
            connectMetaMask();
        }
        setShowConnectWallet(false);
    };
    
    const isIOSDevice = () => {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent);
    };
    
    const isAndroidDevice = () => {
        return /Android/i.test(navigator.userAgent);
    };


    // Below for Testing Purposes (check hardhat.config.ts)
        // const connectWallet = () => {
        //     if (!window.ethereum) {
        //         setShowDownloadWallet(true);
        //     } 
        //     else {
        //         setShowConnectWallet(true);
        //     }
        // };
        // const downloadWalletFunction = () => {
        //     setShowDownloadWallet(false);
        //     if (isMobileDevice()) {
        //         if (isIOSDevice()) {
        //             window.location.href = "https://apps.apple.com/app/metamask/id1438144202";
        //         } else if (isAndroidDevice()) {
        //             window.location.href = "https://play.google.com/store/apps/details?id=io.metamask";
        //         }
        //     } else {
        //         window.open('https://metamask.io/', '_blank');
        //     }
        // };
        // const connectWalletFunction = () => {
        //     if (window.ethereum) {
        //         connectMetamask();
        //     } else if (isMobileDevice()) {
        //         if (isIOSDevice()) {
        //             window.location.href = "https://apps.apple.com/app/metamask/id1438144202";
        //         } else if (isAndroidDevice()) {
        //             window.location.href = "https://play.google.com/store/apps/details?id=io.metamask";
        //         }
        //     } else {
        //         connectMetamask();
        //     }
        //     setShowConnectWallet(false);
        // };

        //For Testing Purposes
    // const web3ModalConfig = {
    //     cacheProvider: true, 
    //     network: "mumbai" 
    // };
    // Above for Testing Purposes (check hardhat.config.ts)    

// Connect Wallet functions/s above

    const switchToPolygonNetwork = async () => {
        try {
            if (window.ethereum) {
                // Get the current network's chain ID
                const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

                // Only request a network switch if the current chain ID is not Polygon's
                if (currentChainId !== polygonNetwork.chainId) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [polygonNetwork],
                    });
                }
            } else {
                console.log('Ethereum provider is not available');
                // Handle the absence of an Ethereum provider
            }
        } catch (error) {
            console.error('Error switching to Polygon network:', error);
            // Handle any errors that occur during the switch
        }
    };

    useEffect(() => {
        const initNetwork = async () => {
            await switchToPolygonNetwork();
        };
        initNetwork();
    }, []);

    


    useEffect(() => {
        if (typeof window !== 'undefined' && CoinbaseWalletSDK) {
            const wallet = new CoinbaseWalletSDK({
                appName: 'Arells',
                appLogoUrl: 'https://arells.com/ArellsIcoIcon.png',
                darkMode: false
            });
        }
    }, []);

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
                window.ethereum.removeListener("accountsChanged", connectCoinbase);
                window.ethereum.removeListener("accountsChanged", connectMetaMask);
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
        network: "matic" 
    };




// Connect Functions below


    const connectCoinbase = async () => {
        setLoadingWallet(true);
        setLoadingWalletConnection(true);
        

        try {
            // Initialize Coinbase Wallet provider
            const coinbaseWallet = new CoinbaseWalletSDK({
                appName: 'Arells',
                appLogoUrl: 'https://arells.com/ArellsIcoIcon.png',
                darkMode: false
            });

            const ethereum = 
                coinbaseWallet.makeWeb3Provider('https://polygon-mainnet.infura.io/v3/4885ed01637e4a6f91c2c7fcd1714f68', 1); 
            await ethereum.enable();

            const provider = new Web3Provider(ethereum);
            const signer = provider.getSigner();
            const address = await signer.getAddress();

            setSigner(signer);
            setAddress(address);
            localStorage.setItem("savedAddress", address);
            setConnected(true);
            localStorage.setItem("walletConnected", "true");

            // Handle network check and switch
            const network = await provider.getNetwork();
            if (network.chainId !== 137) {
                await ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [polygonNetwork]
                });
            }
        } catch (e) {
            console.error(e);
            setLoadingWalletConnection(false);
            setCheckWallet(true);
            localStorage.removeItem("walletConnected");
        }

        setLoadingWallet(false);
        setLoadingWalletConnection(false);
    };

      
    const connectMetaMask = async () => {
        setLoadingWallet(true);
        setLoadingWalletConnection(true);
    
        try {
            // Check for mobile devices
            if (isIOSDevice() || isAndroidDevice()) {
                // Use window.ethereum directly for mobile devices
                if (window.ethereum) {
                    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
                    const accounts = await provider.send("eth_requestAccounts", []);
    
                    if (accounts.length === 0) {
                        throw new Error("No accounts found.");
                    }
    
                    const signer = provider.getSigner();
                    const address = await signer.getAddress();
                    setSigner(signer);
                    setAddress(address);
                    setConnected(true);
    
                    localStorage.setItem("walletConnected", "Generic");
                    localStorage.setItem("savedAddress", address);
    
                    const network = await provider.getNetwork();
                    if (network.chainId !== 137) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [polygonNetwork]
                        });
                    }
                } else {
                    throw new Error("Ethereum provider is not available.");
                }
            } else {
                // Use MetaMask provider for non-mobile devices
                const metamaskProvider = window.ethereum.providers?.find((provider: { isMetaMask: any; }) => provider.isMetaMask);
    
                if (metamaskProvider) {
                    const provider = new ethers.providers.Web3Provider(metamaskProvider, "any");
                    const accounts = await provider.send("eth_requestAccounts", []);
    
                    if (accounts.length === 0) {
                        throw new Error("No accounts found in MetaMask.");
                    }
    
                    const signer = provider.getSigner();
                    const address = await signer.getAddress();
                    setSigner(signer);
                    setAddress(address);
                    setConnected(true);
    
                    localStorage.setItem("walletConnected", "MetaMask");
                    localStorage.setItem("savedAddress", address);
    
                    const network = await provider.getNetwork();
                    if (network.chainId !== 137) {
                        await metamaskProvider.request({
                            method: 'wallet_addEthereumChain',
                            params: [polygonNetwork]
                        });
                    }
                } else {
                    throw new Error("MetaMask is not installed.");
                }
            }
        } catch (e) {
            console.error(e);
            setCheckWallet(true);
            setConnected(false);
            localStorage.removeItem("walletConnected");
            localStorage.removeItem("savedAddress");
        } finally {
            setLoadingWallet(false);
            setLoadingWalletConnection(false);
        }
    };
    
      
    
    
    
    

    
    


 // Connect Functions Above   
    
   

    const closeProviderModals = () => {
        setConnected(false);
        setCheckWallet(false);
        setDisconnected(false);
        setLoadingWalletConnection(false);
        localStorage.removeItem("walletConnected"); 
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
                    {showMetaMask && (
                        <>
                            <button id="connectWallet"
                            onClick={downloadMetaMaskFunction}
                            disabled={loadingWallet}>
                            <Image 
                            loader={imageLoader}
                            id="wallet-icon"
                            alt=""
                            width={50}
                            height={50}  
                            src="images/prototype/metamask-icon.png"/>
                        </button>
                        <span id="wallet-spacing"></span>	
                        </>
                    )}
                    <button id="connectWallet"
						onClick={downloadCoinbaseFunction}
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
                    {/* {showMetaMask && (
                        <>
                            <button id="connectWallet"
                                onClick={connectMetaMaskFunction}
                                disabled={loadingWallet}>
                                <Image 
                                loader={imageLoader}
                                id="wallet-icon"
                                alt=""
                                width={50}
                                height={50}  
                                src="images/prototype/metamask-icon.png"/>
                            </button>	
                            <span id="wallet-spacing"></span>		
                        </>
                    )} */}
                    <button id="connectWallet"
                        onClick={connectMetaMaskFunction}
                        disabled={loadingWallet}>
                        <Image 
                        loader={imageLoader}
                        id="wallet-icon"
                        alt=""
                        width={50}
                        height={50}  
                        src="images/prototype/metamask-icon.png"/>
                    </button>
                    <span id="wallet-spacing"></span>		
					<button id="connectWallet"
						onClick={connectCoinbaseFunction}
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
            {connected && (   
                <div id="walletConnected">
                    <div id="wallet-connected-modalGood">
                        <p>CONNECTED</p>
                        <button id="wallet-connected-close" onClick={closeProviderModals}>OK</button>   
                    </div>
                </div>  
            )}
            {checkWallet && (   
                <div id="connectingBackground">
                    <div id="wallet-connected-modal">
                        <p id="connectingWalletWords">CHECK OPEN WALLET</p>
                        <button id="wallet-connecting-close" onClick={closeProviderModals}>OK</button>    
                    </div>
                </div>  
            )}
            {disconnected && (   
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