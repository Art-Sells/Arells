'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useHPM } from '../../context/HPMContext';
import { createWithdrewAmountTransaction } from '../../lib/transactions';

interface Transaction {
  date: string;
  soldAmount?: {
    bitcoinAmount: number;
    soldAmount: number;
  };
  boughtAmount?: {
    bitcoinAmount: number;
    boughtAmount: number;
  };
  withdrewAmount?: {
    withdrewAmount: number;
    bankAccountLink: string;
  };
  exportedAmount?: {
    exportedAmount: number;
    transactionLink: string;
  };
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
    setSoldAmount,
    setImportAmount,
    handleBuy,
    handleSell,
    handleExport,
    updateVatopCombinations,
    email,
    soldAmounts,
  } = useHPM();

  const [localExportAmount, setLocalExportAmount] = useState<number>(0);
  const [localImportAmount, setLocalImportAmount] = useState<number>(0);
  const [localTotalExportedWalletValue, setLocalTotalExportedWalletValue] = useState<number>(0);
  const [localYouWillLose, setLocalYouWillLose] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const handleBuyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBuyAmount(Number(e.target.value));
  };

  const handleSellAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSellAmount(Number(e.target.value));
  };

  const handleExportAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalExportAmount(Number(e.target.value));
  };

  const handleImportAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalImportAmount(Number(e.target.value));
  };
  const handleImportClick = async () => {
  
    setImportAmount(localImportAmount);
    const newAcVactTas = vatopCombinations.acVactTas + localImportAmount;
    const updatedCombinations = {
      ...vatopCombinations,
      acVactTas: newAcVactTas,
    };

  
    // Prepare payload to update only acVactTas
    const payload = {
      email,
      acVactTas: newAcVactTas,
    };
  
    try {
      const response = await axios.post('/api/saveVatopGroups', payload);
      setRefreshData(true); // Set flag to refresh data
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Error updating acVactTas:', error.response?.data || error.message, 'Full response:', error.response);
      } else {
        console.error('Unexpected error:', error);
      }
    }
  };





  const handleWithdraw = async () => {
    const withdrawAmount = soldAmounts;
  
    // Create withdrew amount transaction
    const withdrewTransaction = await createWithdrewAmountTransaction(withdrawAmount);
  
    try {
      const newSoldAmount = 0; // Ensure soldAmount is numeric and reset to zero
      console.log('Sending withdraw request with payload:', { email, soldAmounts: newSoldAmount });
  
      const payload = {
        email,
        soldAmounts: newSoldAmount,
        transactions: {
          soldAmount: '',
          boughtAmount: '',
          withdrewAmount: withdrewTransaction,
          exportedAmount: ''
        }
      };
  
      const response = await axios.post('/api/saveVatopGroups', payload);
      console.log('Withdraw response:', response.data);
  
      // Update local state
      setSoldAmount(newSoldAmount);
      updateVatopCombinations(vatopGroups); // Trigger update to fetch new state
    } catch (error) {
      console.error('Error withdrawing sold amount:', error);
    }
  };



  

  useEffect(() => {
    // Update local state for real-time calculations
    const updateExportCalculations = () => {
      let remainingAmount = localExportAmount;
      const updatedGroups = [...vatopGroups].sort((a, b) => b.cpVatop - a.cpVatop);
      let totalValue = 0;
      let totalLoss = 0;

      for (let i = 0; i < updatedGroups.length && remainingAmount > 0; i++) {
        const group = updatedGroups[i];
        const exportAmount = Math.min(group.cVactTa, remainingAmount);
        remainingAmount -= exportAmount;

        const originalCdVatop = group.cdVatop;
        const originalCVactTa = group.cVactTa;
        const lossFraction = exportAmount / originalCVactTa;

        const newCdVatop = originalCdVatop * lossFraction;

        totalValue += exportAmount * bitcoinPrice;
        if (newCdVatop < 0) {
          totalLoss += newCdVatop;
        }
      }

      setLocalTotalExportedWalletValue(totalValue);
      setLocalYouWillLose(Math.abs(totalLoss));
    };

    updateExportCalculations();
  }, [localExportAmount, vatopGroups, bitcoinPrice]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get(`/api/fetchVatopGroups?email=${email}`);
        setTransactions(response.data.transactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchTransactions();
    const interval = setInterval(fetchTransactions, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [email]);

  const renderTransactions = () => {
    const groupedTransactions = transactions.reduce((acc, transaction) => {
      const date = transaction.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(transaction);
      return acc;
    }, {} as Record<string, Transaction[]>);

    return Object.entries(groupedTransactions).map(([date, transactions]) => (
      <div key={date}>
        <h3>Date: {date}</h3>
        {transactions.map((transaction, index) => (
          <div key={index}>
            {transaction.soldAmount && (
              <p>
                Sold: Bitcoin Amount: {transaction.soldAmount.bitcoinAmount}, For: ${transaction.soldAmount.soldAmount}
              </p>
            )}
            {transaction.boughtAmount && (
              <p>
                Bought: Bitcoin Amount: {transaction.boughtAmount.bitcoinAmount}, For: ${transaction.boughtAmount.boughtAmount}
              </p>
            )}
            {transaction.withdrewAmount && (
              <p>
                Withdrew: Amount: ${transaction.withdrewAmount.withdrewAmount}, To: {transaction.withdrewAmount.bankAccountLink}
              </p>
            )}
            {transaction.exportedAmount && (
              <p>
                Exported: Bitcoin Amount: {transaction.exportedAmount.exportedAmount}, To: {transaction.exportedAmount.transactionLink}
              </p>
            )}
          </div>
        ))}
      </div>
    ));
  };

  return (
    <div>
      <h1>HPM Tester</h1>
      <div>
        <label>
          Bitcoin Price: ${bitcoinPrice}
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
        <label>
          Export Amount:
          <input type="number" value={localExportAmount} onChange={handleExportAmountChange} />
        </label>
        <button onClick={() => handleExport(localExportAmount)}>Export</button>
      </div>
      <div>
        <label>
          Import Amount:
          <input type="number" value={localImportAmount} onChange={handleImportAmountChange} />
        </label>
        <button onClick={handleImportClick}>Import</button>
      </div>
      <div>
        <h2>Total Exported Wallet Value: {formatCurrency(localTotalExportedWalletValue)}</h2>
        <h2>You Will Lose: {formatCurrency(localYouWillLose)}</h2>
      </div>
      <div>
        <h2>HPAP: {formatCurrency(hpap)}</h2>
        <h2>Vatop Groups:</h2>
        {vatopGroups.length > 0 ? (
          vatopGroups.map((group, index) => (
            <div key={index}>
              <h3>Vatop Group {index + 1}</h3>
              <p>cVatop: {formatCurrency(group.cVatop)}</p>
              <p>cpVatop: {formatCurrency(group.cpVatop)}</p>
              <p>cVact: {formatCurrency(group.cVact)}</p>
              <p>cVactTa: {formatNumber(group.cVactTa)}</p>
              <p>cdVatop: {formatCurrency(group.cdVatop)}</p>
            </div>
          ))
        ) : (
          <p>No Vatop Groups available</p>
        )}
      </div>
      <div>
        <h2>Vatop Group Combinations:</h2>
        <p>acVatops: {formatCurrency(vatopCombinations.acVatops)}</p>
        <p>acVacts: {formatCurrency(vatopCombinations.acVacts)}</p>
        <p>acVactTas: {formatNumber(vatopCombinations.acVactTas)}</p>
        <p>acdVatops: {formatCurrency(vatopCombinations.acdVatops)}</p>
        <p>acVactsAts: {formatCurrency(vatopCombinations.acVactsAts)}</p>
        <p>acVactTaAts: {formatNumber(vatopCombinations.acVactTaAts)}</p>
      </div>
      <div>
        <h2>Sold Amount: {formatCurrency(soldAmounts)}</h2>
        <button onClick={handleWithdraw}>Withdraw</button>
      </div>
      <div>
        <h2>Transactions</h2>
        {renderTransactions()}
      </div>
    </div>
  );
};

const formatCurrency = (value: number): string => {
  return `$${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

const formatNumber = (value: number): string => {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 });
};

export default HPMTester;

function setRefreshData(arg0: boolean) {
  throw new Error('Function not implemented.');
}
