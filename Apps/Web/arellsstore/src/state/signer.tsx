'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";
import CryptoJS from 'crypto-js';
import axios from 'axios';
import { fetchUserAttributes } from 'aws-amplify/auth';

import { JsonRpcProvider } from "ethers";

const provider = new JsonRpcProvider(
    `https://polygon-mainnet.infura.io/v3/4885ed01637e4a6f91c2c7fcd1714f68`
);

const fetchNativeBalance = async (address: string) => {
    const balance = await provider.getBalance(address);
    return balance.toString(); // Returns balance in wei
};

export { provider, fetchNativeBalance };

// Token contract addresses on Polygon
const TOKEN_ADDRESSES = {
    WBTC: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", // WBTC contract address
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC contract address
};

interface SignerContextType {
    MASSaddress: string;
    MASSsupplicationAddress: string;
    createMASSwallet: () => Promise<void>;
    readMASSFile: () => Promise<{
        MASSaddress: string;
        MASSsupplicationAddress: string;
        MASSkey: string;
        MASSsupplicationKey: string;
    } | null>;
    fetchBalances: () => Promise<{
        POL: string;
        WBTC: string;
        USDC: string;
        POL_MASS: string;
        POL_SUPPLICATION: string;
    }>;
}

const SignerContext = createContext<SignerContextType | undefined>(undefined);

export const SignerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [MASSaddress, setMASSaddress] = useState("");
    const [MASSsupplicationAddress, setMASSsupplicationAddress] = useState("");
    const [email, setEmail] = useState<string>("");

    useEffect(() => {
        const fetchAttributes = async () => {
            try {
                const attributesResponse = await fetchUserAttributes();
                setEmail(attributesResponse.email ?? '');
            } catch (error) {
                console.error('Error fetching user attributes:', error);
            }
        };

        fetchAttributes();
    }, []);

    const checkWalletFileExists = async (): Promise<boolean> => {
        if (!email) {
            console.warn('Email is not set. Cannot check wallet file existence.');
            return false;
        }

        try {
            const response = await axios.get(`/api/readMASS`, { params: { email } });
            console.log('MASS Wallet exists');
            return true; // File exists
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                console.log('MASSwallet does not exist.');
                return false; // File does not exist
            }
            console.error('Error checking MASSwallet file existence:', error);
            throw error;
        }
    };

    const createMASSwallet = async () => {
        try {
            const fileExists = await checkWalletFileExists();
            if (fileExists) {
                console.log('Skipping wallet creation.');
                return;
            }

            const newWallet = ethers.Wallet.createRandom();
            const newSupplicationWallet = ethers.Wallet.createRandom();
            const encryptedPrivateKey = CryptoJS.AES.encrypt(newWallet.privateKey, 'your-secret-key').toString();
            const encryptedSupplicationPrivateKey = CryptoJS.AES.encrypt(newSupplicationWallet.privateKey, 'your-secret-key').toString();

            console.log("New Wallet Address:", newWallet.address);
            console.log("Encrypted Private Key for MASS Wallet:", encryptedPrivateKey);
            console.log("New MASS Supplication Wallet Address:", newSupplicationWallet.address);
            console.log("Encrypted Private Key for MASS Supplication Wallet:", encryptedSupplicationPrivateKey);

            await saveWalletDetails(newWallet.address, newSupplicationWallet.address, encryptedPrivateKey, encryptedSupplicationPrivateKey, email);
            setMASSaddress(newWallet.address);
            setMASSsupplicationAddress(newSupplicationWallet.address);
        } catch (error) {
            console.error('Error creating MASS wallet:', error);
        }
    };

    const saveWalletDetails = async (
        MASSaddress: string,
        MASSsupplicationAddress: string,
        MASSkey: string,
        MASSsupplicationKey: string,
        email: string
    ) => {
        try {
            const response = await fetch('/api/saveMASS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    MASSaddress,
                    MASSsupplicationAddress,
                    MASSkey,
                    MASSsupplicationKey,
                    email,
                }),
            });
            const data = await response.json();
            console.log('Save MASS Response:', data);
        } catch (error) {
            console.error('Error saving wallet details:', error);
        }
    };

    const readMASSFile = async (): Promise<{
        MASSaddress: string;
        MASSsupplicationAddress: string;
        MASSkey: string;
        MASSsupplicationKey: string;
    } | null> => {
        try {
            if (!email) {
                console.warn("Reading email... Please wait");
                return null;
            }

            const response = await axios.get('/api/readMASS', { params: { email } });
            const data = response.data;
            console.log('Read MASS File:', data);
            setMASSaddress(data.MASSaddress);
            setMASSsupplicationAddress(data.MASSsupplicationAddress);
            return data;
        } catch (error) {
            console.error('Error reading MASS file:', error);
            return null;
        }
    };

    const fetchBalances = async () => {
        try {
            if (!MASSaddress || !MASSsupplicationAddress) {
                console.warn('Wallet addresses are not set.');
                return {
                    POL: "0",
                    WBTC: "0",
                    USDC: "0",
                    POL_MASS: "0",
                    POL_SUPPLICATION: "0",
                };
            }
    
            const WBTCContract = new ethers.Contract(
                TOKEN_ADDRESSES.WBTC,
                ["function balanceOf(address owner) view returns (uint256)"],
                provider
            );
            const USDCContract = new ethers.Contract(
                TOKEN_ADDRESSES.USDC,
                ["function balanceOf(address owner) view returns (uint256)"],
                provider
            );
    
            const WBTCBalance = await WBTCContract.balanceOf(MASSaddress); // WBTC for MASSaddress
            const USDCBalance = await USDCContract.balanceOf(MASSsupplicationAddress); // USDC for MASSSupplicationAddress
            const POLBalance_MASS = await provider.getBalance(MASSaddress); // POL for MASSaddress
            const POLBalance_SUPPLICATION = await provider.getBalance(MASSsupplicationAddress); // POL for MASSSupplicationAddress
    
            // Add POL as a duplicate field for clarity (as POL_MASS and POL_SUPPLICATION are distinct)
            return {
                POL: ethers.formatEther(POLBalance_MASS), // Use POL_MASS as the default POL field
                WBTC: ethers.formatUnits(WBTCBalance, 8), // WBTC balance
                USDC: ethers.formatUnits(USDCBalance, 6), // USDC balance
                POL_MASS: ethers.formatEther(POLBalance_MASS), // POL balance for MASSaddress
                POL_SUPPLICATION: ethers.formatEther(POLBalance_SUPPLICATION), // POL balance for MASSSupplicationAddress
            };
        } catch (error) {
            console.error("Error fetching balances:", error);
            return {
                POL: "0",
                WBTC: "0",
                USDC: "0",
                POL_MASS: "0",
                POL_SUPPLICATION: "0",
            };
        }
    };

    return (
        <SignerContext.Provider
            value={{
                MASSaddress,
                MASSsupplicationAddress,
                createMASSwallet,
                readMASSFile,
                fetchBalances,
            }}
        >
            {children}
        </SignerContext.Provider>
    );
};

export const useSigner = () => {
    const context = useContext(SignerContext);
    if (!context) throw new Error('useSigner must be used within a SignerProvider');
    return context;
};