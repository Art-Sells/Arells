'use client';

import React from 'react';
import { useHPM } from '../../context/HPMContext';

// Define the VatopGroup type
interface VatopGroup {
    cVatop: number;
    cpVatop: number;
    cVact: number;
    cVactTa: number;
    cdVatop: number;
}

// Define the VatopCombinations type
interface VatopCombinations {
    acVatops: number;
    acVacts: number;
    acVactTas: number;
    acdVatops: number;
    acVactsAts: number;
    acVactTaAts: number;
}

const HPMTester: React.FC = () => {
    const {
        bitcoinPrice,
        vatopGroups,
        vatopCombinations,
        hpap,
        buyAmount,
        setBuyAmount,
        sellAmount,
        setSellAmount,
        handleBuy,
        handleSell
    } = useHPM();

    const handleBuyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBuyAmount(Number(e.target.value));
    };

    const handleSellAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSellAmount(Number(e.target.value));
    };

    return (
        <div>
            <h1>HPM Tester</h1>
            <div>
                <label>
                    Bitcoin Price: $
                    {bitcoinPrice}
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
                {vatopGroups.map((group: VatopGroup, index: number) => (
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