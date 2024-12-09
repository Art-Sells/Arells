"use client";

import { ethers } from "hardhat";
import React, { createContext, useContext, useState, ReactNode } from "react";

type Wallet = InstanceType<typeof ethers.Wallet>; // Explicitly define Wallet type

const { Wallet, JsonRpcProvider } = require("ethers");

const RPC_URL = "https://polygon-amoy.infura.io/v3/4885ed01637e4a6f91c2c7fcd1714f68";
const provider = new JsonRpcProvider(RPC_URL);

type SignerContextType = {
    wallet?: Wallet;
    address?: string;
    createMASSwallet(): void;
};

const SignerContext = createContext<SignerContextType>({} as SignerContextType);

const useSigner = () => useContext(SignerContext);

export const SignerProvider = ({ children }: { children: ReactNode }) => {
    const [wallet, setWallet] = useState<Wallet>();
    const [address, setAddress] = useState<string>();

    const createMASSwallet = () => {
        const MASSwallet = Wallet.createRandom().connect(provider);
        setWallet(MASSwallet);
        setAddress(MASSwallet.address);

        // Log the wallet address and private key
        console.log("MASSwallet Address:", MASSwallet.address);
        console.log("MASSwallet Private Key:", MASSwallet.privateKey);
    };

    return (
        <SignerContext.Provider value={{ wallet, address, createMASSwallet }}>
            {children}
        </SignerContext.Provider>
    );
};

export default useSigner;