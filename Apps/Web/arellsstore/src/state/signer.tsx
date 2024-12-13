'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";
import CryptoJS from 'crypto-js';
import axios from 'axios';
import { fetchUserAttributes } from 'aws-amplify/auth';

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
}

const SignerContext = createContext<SignerContextType | undefined>(undefined);

export const SignerProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [MASSaddress, setMASSaddress] = useState("");
    const [MASSsupplicationAddress, setMASSsupplicationAddress] = useState("");
    const [email, setEmail] = useState<string>('');

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
        } catch (error) {
            console.error('Error creating MASS wallet:', error);
        }
    };

    const saveWalletDetails = async (MASSaddress: string, MASSsupplicationAddress: string, MASSkey: string, MASSsupplicationKey: string, email: string) => {
        try {
            const response = await fetch('/api/saveMASS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    MASSaddress,
                    MASSsupplicationAddress,
                    MASSkey,
                    MASSsupplicationKey,
                    email
                })
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
            return data;
        } catch (error) {
            console.error('Error reading MASS file:', error);
            return null;
        }
    };

    return (
        <SignerContext.Provider value={{ MASSaddress, MASSsupplicationAddress, createMASSwallet, readMASSFile }}>
            {children}
        </SignerContext.Provider>
    );
};

export const useSigner = () => {
    const context = useContext(SignerContext);
    if (!context) throw new Error('useSigner must be used within a SignerProvider');
    return context;
};