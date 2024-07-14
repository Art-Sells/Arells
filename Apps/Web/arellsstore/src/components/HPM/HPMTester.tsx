'use client';

import React, { useEffect, useState } from 'react';

import '../../app/css/import/import.css';
import '../../app/css/modals/import/import-modal.css';
import '../../app/css/modals/loader/accountloaderbackground.css';
import styles from '../../app/css/modals/loader/accountloader.module.css';

interface VatopGroup {
    cVatop: number;
    cpVatop: number;
    cVact: number;
    cVactTa: number;
    cdVatop: number;
}

interface VatopCombinations {
    acVatops: number;
    acVacts: number;
    acVactTas: number;
    acdVatops: number;
    acVactsAts: number;
    acVactTaAts: number;
}

const initialVatopGroup: VatopGroup = {
    cVatop: 0,
    cpVatop: 0,
    cVact: 0,
    cVactTa: 0,
    cdVatop: 0,
};

const initialVatopCombinations: VatopCombinations = {
    acVatops: 0,
    acVacts: 0,
    acVactTas: 0,
    acdVatops: 0,
    acVactsAts: 0,
    acVactTaAts: 0,
};

const HPMTester: React.FC = () => {
    const [bitcoinPrice, setBitcoinPrice] = useState<number>(60000);
    const [buyAmount, setBuyAmount] = useState<number>(0);
    const [sellAmount, setSellAmount] = useState<number>(0);
    const [vatopGroups, setVatopGroups] = useState<VatopGroup[]>([]);
    const [vatopCombinations, setVatopCombinations] = useState<VatopCombinations>(initialVatopCombinations);
    const [hpap, setHpap] = useState<number>(60000);

    useEffect(() => {
        // Update cVact and cdVatop for each vatop group when bitcoinPrice changes
        const updatedVatopGroups = vatopGroups.map(group => ({
            ...group,
            cVact: group.cVactTa * bitcoinPrice,
            cdVatop: (group.cVactTa * bitcoinPrice) - group.cVatop
        }));

        setVatopGroups(updatedVatopGroups);
        updateVatopCombinations(updatedVatopGroups);
    }, [bitcoinPrice]);

    useEffect(() => {
        // Update HPAP logic
        const highestCpVatop = Math.max(...vatopGroups.map(group => group.cpVatop), 0);
        if (bitcoinPrice > highestCpVatop) {
            setHpap(bitcoinPrice);
        } else {
            setHpap(highestCpVatop);
        }
    }, [vatopGroups, bitcoinPrice]);

    const handleBitcoinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBitcoinPrice(Number(e.target.value));
    };

    const handleBuyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBuyAmount(Number(e.target.value));
    };

    const handleSellAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSellAmount(Number(e.target.value));
    };

    const handleBuy = (amount: number) => {
        const newVatop: VatopGroup = {
            cVatop: amount,
            cpVatop: bitcoinPrice,
            cVact: amount,
            cVactTa: amount / bitcoinPrice,
            cdVatop: 0,
        };

        const updatedVatopGroups = [...vatopGroups, newVatop];
        setVatopGroups(updatedVatopGroups);
        updateVatopCombinations(updatedVatopGroups);
    };

    const handleSell = (amount: number) => {
        if (amount > vatopCombinations.acVactsAts) {
            return; // Prevent the sale if the amount exceeds acVactsAts
        }

        let remainingAmount = amount;
        const updatedVatopGroups = [...vatopGroups];

        // Sort the vatop groups by cpVatop, then by index if cpVatop is the same
        updatedVatopGroups.sort((a, b) => a.cpVatop - b.cpVatop);

        for (let i = 0; i < updatedVatopGroups.length && remainingAmount > 0; i++) {
            const group = updatedVatopGroups[i];
            const sellAmount = Math.min(group.cVact, remainingAmount);
            remainingAmount -= sellAmount;

            group.cVatop -= sellAmount;
            group.cVact -= sellAmount;
            group.cVactTa -= sellAmount / bitcoinPrice;
            group.cdVatop = group.cVact - group.cVatop;

            if (group.cVatop <= 0) {
                group.cVatop = 0;
            }

            if (group.cVact <= 0) {
                group.cVact = 0;
                group.cVactTa = 0;
                group.cdVatop = 0;
                updatedVatopGroups.splice(i, 1);
                i--; // Adjust index after removal
            }
        }

        setVatopGroups(updatedVatopGroups);
        updateVatopCombinations(updatedVatopGroups);
    };

    const updateVatopCombinations = (groups: VatopGroup[]) => {
        const acVatops = groups.reduce((acc, group) => acc + group.cVatop, 0);
        const acVacts = groups.reduce((acc, group) => acc + group.cVact, 0);
        const acVactTas = groups.reduce((acc, group) => acc + group.cVactTa, 0);
        const acdVatops = groups.reduce((acc, group) => {
            return group.cdVatop > 0 ? acc + group.cdVatop : acc;
        }, 0);

        const acVactsAts = groups.reduce((acc, group) => {
            return group.cdVatop > 0 ? acc + group.cVact : acc;
        }, 0);

        const acVactTaAts = groups.reduce((acc, group) => {
            return group.cdVatop > 0 ? acc + group.cVactTa : acc;
        }, 0);

        setVatopCombinations({ acVatops, acVacts, acVactTas, acdVatops: acdVatops > 0 ? acdVatops : 0, acVactsAts, acVactTaAts });
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
                <label>
                    Buy Amount:
                    <input type="number" value={buyAmount} onChange={handleBuyAmountChange} />
                </label>
                <button onClick={() => handleBuy(buyAmount)}>Buy</button>
            </div>
            <div>
                <label>
                    Sell Amount:
                    <input type="number" value={sellAmount} onChange={handleSellAmountChange} />
                </label>
                <button onClick={() => handleSell(sellAmount)}>Sell</button>
            </div>
            <div>
                <h2>HPAP: ${hpap}</h2>
                <h2>Vatop Groups:</h2>
                {vatopGroups.map((group, index) => (
                    <div key={index}>
                        <h3>Vatop Group {index + 1}</h3>
                        <p>cVatop: ${group.cVatop}</p>
                        <p>cpVatop: ${group.cpVatop}</p>
                        <p>cVact: ${group.cVact}</p>
                        <p>cVactTa: {group.cVactTa}</p>
                        <p>cdVatop: ${group.cdVatop}</p>
                    </div>
                ))}
            </div>
            <div>
                <h2>Vatop Group Combinations:</h2>
                <p>acVatops: ${vatopCombinations.acVatops}</p>
                <p>acVacts: ${vatopCombinations.acVacts}</p>
                <p>acVactTas: {vatopCombinations.acVactTas}</p>
                <p>acdVatops: ${vatopCombinations.acdVatops}</p>
                <p>acVactsAts: ${vatopCombinations.acVactsAts}</p>
                <p>acVactTaAts: {vatopCombinations.acVactTaAts}</p>
            </div>
        </div>
    );
};

export default HPMTester;