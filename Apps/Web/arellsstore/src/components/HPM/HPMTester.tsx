'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ImageLoaderProps } from 'next/image';
import Link from 'next/link';

import '../../app/css/import/import.css';
import '../../app/css/modals/import/import-modal.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';

interface VatopGroup {
    cVatop: number;
    cVatopTa: number;
    cpVatop: number;
    cVact: number;
    cdVatop: number;
}

interface VatopCombinations {
    acVatops: number;
    acVatopTas: number;
    acVacts: number;
    acdVatops: number;
    acVactsAts: number;
}

const initialVatopGroup: VatopGroup = {
    cVatop: 0,
    cVatopTa: 0,
    cpVatop: 0,
    cVact: 0,
    cdVatop: 0,
};

const initialVatopCombinations: VatopCombinations = {
    acVatops: 0,
    acVatopTas: 0,
    acVacts: 0,
    acdVatops: 0,
    acVactsAts: 0,
};

const HPMTester: React.FC = () => {
    const [bitcoinPrice, setBitcoinPrice] = useState<number>(60000);
    const [vatopGroups, setVatopGroups] = useState<VatopGroup[]>([]);
    const [vatopCombinations, setVatopCombinations] = useState<VatopCombinations>(initialVatopCombinations);
    const [hpap, setHpap] = useState<number>(0);

    useEffect(() => {
        // Update cVact for each vatop group when bitcoinPrice changes
        const updatedVatopGroups = vatopGroups.map(group => ({
            ...group,
            cVact: group.cVatopTa * bitcoinPrice,
            cdVatop: group.cVatopTa * bitcoinPrice - group.cVatop
        }));

        setVatopGroups(updatedVatopGroups);
        updateVatopCombinations(updatedVatopGroups);
    }, [bitcoinPrice]);

    const handleBitcoinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBitcoinPrice(Number(e.target.value));
    };

    const handleBuy = (amount: number) => {
        const newVatop: VatopGroup = {
            cVatop: amount,
            cVatopTa: amount / bitcoinPrice,
            cpVatop: bitcoinPrice,
            cVact: amount,
            cdVatop: 0,
        };

        const updatedVatopGroups = [...vatopGroups, newVatop];
        setVatopGroups(updatedVatopGroups);
        updateVatopCombinations(updatedVatopGroups);

        // Update HPAP to the highest cpVatop
        const highestCpVatop = Math.max(...updatedVatopGroups.map(group => group.cpVatop));
        setHpap(highestCpVatop);
    };

    const handleSell = (amount: number) => {
        if (amount > vatopCombinations.acVactsAts) {
            return; // Prevent the sale if the amount exceeds acVactsAts
        }

        // Implement sell logic based on the provided example
        let remainingAmount = amount;
        const updatedVatopGroups = vatopGroups.map(group => {
            if (remainingAmount <= 0) return group;

            const sellAmount = Math.min(group.cVact, remainingAmount);
            remainingAmount -= sellAmount;

            return {
                ...group,
                cVatop: group.cVatop - sellAmount,
                cVatopTa: group.cVatopTa - sellAmount / bitcoinPrice,
                cVact: group.cVact - sellAmount,
                cdVatop: group.cdVatop - sellAmount,
            };
        });

        setVatopGroups(updatedVatopGroups);
        updateVatopCombinations(updatedVatopGroups);
    };

    const updateVatopCombinations = (groups: VatopGroup[]) => {
        const acVatops = groups.reduce((acc, group) => acc + group.cVatop, 0);
        const acVatopTas = groups.reduce((acc, group) => acc + group.cVatopTa, 0);
        const acVacts = groups.reduce((acc, group) => acc + group.cVact, 0);
        const acdVatops = groups.reduce((acc, group) => {
            return group.cdVatop > 0 ? acc + group.cdVatop : acc;
        }, 0);

        const acVactsAts = groups.reduce((acc, group) => {
            return group.cdVatop > 0 ? acc + group.cVact : acc;
        }, 0);

        setVatopCombinations({ acVatops, acVatopTas, acVacts, acdVatops, acVactsAts });
    };

    return (
        <div>
            <h1>HPM Tester</h1>
            <div>
                <label>
                    Bitcoin Price:
                    <input type="number" value={bitcoinPrice} onChange={handleBitcoinPriceChange} />
                </label>
            </div>
            <div>
                <button onClick={() => handleBuy(500)}>Buy $500</button>
                <button onClick={() => handleBuy(600)}>Buy $600</button>
                <button onClick={() => handleSell(650)}>Sell $650</button>
            </div>
            <div>
                <h2>HPAP: ${hpap}</h2>
                <h2>Vatop Groups:</h2>
                {vatopGroups.map((group, index) => (
                    <div key={index}>
                        <h3>Vatop Group {index + 1}</h3>
                        <p>cVatop: ${group.cVatop}</p>
                        <p>cVatopTa: {group.cVatopTa}</p>
                        <p>cpVatop: ${group.cpVatop}</p>
                        <p>cVact: ${group.cVact}</p>
                        <p>cdVatop: ${group.cdVatop}</p>
                    </div>
                ))}
            </div>
            <div>
                <h2>Vatop Group Combinations:</h2>
                <p>acVatops: ${vatopCombinations.acVatops}</p>
                <p>acVatopTas: {vatopCombinations.acVatopTas}</p>
                <p>acVacts: ${vatopCombinations.acVacts}</p>
                <p>acdVatops: ${vatopCombinations.acdVatops}</p>
                <p>acVactsAts: ${vatopCombinations.acVactsAts}</p>
            </div>
        </div>
    );
};

export default HPMTester;