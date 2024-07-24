'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { fetchBitcoinPrice, setManualBitcoinPrice as setManualBitcoinPriceApi } from '../lib/coingecko-api';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { createBoughtAmountTransaction, createExportedAmountTransaction, createSoldAmountTransaction } from '../lib/transactions';

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

interface HPMContextType {
  bitcoinPrice: number;
  vatopGroups: VatopGroup[];
  vatopCombinations: VatopCombinations;
  hpap: number;
  buyAmount: number;
  sellAmount: number;
  exportAmount: number;
  importAmount: number;
  totalExportedWalletValue: number;
  youWillLose: number;
  soldAmounts: number;
  setBuyAmount: (amount: number) => void;
  setSellAmount: (amount: number) => void;
  setExportAmount: (amount: number) => void;
  setSoldAmount: (amount: number) => void;
  setImportAmount: (amount: number) => void;
  handleBuy: (amount: number) => void;
  handleSell: (amount: number) => void;
  handleExport: (amount: number, recipientAddress: string) => void;
  setManualBitcoinPrice: (price: number) => void;
  updateVatopCombinations: (groups: VatopGroup[]) => VatopCombinations;
  email: string;
}

const HPMContext = createContext<HPMContextType | undefined>(undefined);

export const HPMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bitcoinPrice, setBitcoinPrice] = useState<number>(0);
  const [buyAmount, setBuyAmount] = useState<number>(0);
  const [sellAmount, setSellAmount] = useState<number>(0);
  const [exportAmount, setExportAmount] = useState<number>(0);
  const [importAmount, setImportAmount] = useState<number>(0);
  const [vatopGroups, setVatopGroups] = useState<VatopGroup[]>([]);
  const [vatopCombinations, setVatopCombinations] = useState<VatopCombinations>({
    acVatops: 0,
    acVacts: 0,
    acVactTas: 0,
    acdVatops: 0,
    acVactsAts: 0,
    acVactTaAts: 0,
  });
  const [hpap, setHpap] = useState<number>(0);
  const [totalExportedWalletValue, setTotalExportedWalletValue] = useState<number>(0);
  const [youWillLose, setYouWillLose] = useState<number>(0);
  const [email, setEmail] = useState<string>('');
  const [balance, setBalance] = useState<number | null>(null);
  const [bitcoinAddress, setBitcoinAddress] = useState<string>('');
  const [bitcoinPrivateKey, setBitcoinPrivateKey] = useState<string>('');
  const [soldAmounts, setSoldAmount] = useState<number>(0);
  const [refreshData, setRefreshData] = useState<boolean>(false);

  const updateVatopCombinations = (groups: VatopGroup[]): VatopCombinations => {
    const acVatops = groups.reduce((acc: number, group: VatopGroup) => acc + group.cVatop, 0);
    const acVacts = groups.reduce((acc: number, group: VatopGroup) => acc + group.cVact, 0);
    const acVactTas = groups.reduce((acc: number, group: VatopGroup) => acc + group.cVactTa, 0);
    const acdVatops = groups.reduce((acc: number, group: VatopGroup) => group.cdVatop > 0 ? acc + group.cdVatop : acc, 0);
  
    let acVactsAts = 0;
    let acVactTaAts = 0;
  
    if (acdVatops > 0) {
      acVactsAts = groups.reduce((acc: number, group: VatopGroup) => group.cdVatop > 0 ? acc + group.cVact : acc, 0);
      acVactTaAts = groups.reduce((acc: number, group: VatopGroup) => group.cdVatop > 0 ? acc + group.cVactTa : acc, 0);
    }
  
    const updatedCombinations: VatopCombinations = {
      acVatops,
      acVacts,
      acVactTas,
      acdVatops,
      acVactsAts,
      acVactTaAts,
    };
  
    setVatopCombinations(updatedCombinations);
    return updatedCombinations;
  };

  useEffect(() => {
    const fetchPrice = async () => {
      const price = await fetchBitcoinPrice();
      setBitcoinPrice(price);
    };
    fetchPrice();
  }, []);

  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const attributesResponse = await fetchUserAttributes();
        const emailAttribute = attributesResponse.email;
        const bitcoinAddressAttribute = attributesResponse['custom:bitcoinAddress'];
        const bitcoinPrivateKeyAttribute = attributesResponse['custom:bitcoinPrivateKey'];
    
        if (emailAttribute) setEmail(emailAttribute);
        if (bitcoinAddressAttribute) setBitcoinAddress(bitcoinAddressAttribute);
        if (bitcoinPrivateKeyAttribute) setBitcoinPrivateKey(bitcoinPrivateKeyAttribute);
  
        if (bitcoinAddressAttribute) {
          const fetchBalance = async () => {
            const res = await fetch(`/api/balance?address=${bitcoinAddressAttribute}`);
            const data = await res.json();
            setBalance(data);
          };
          fetchBalance();
        }
      } catch (error) {
        console.error('Error fetching user attributes:', error);
      }
    };
  
    fetchAttributes();
  }, [setEmail, setBitcoinAddress, setBitcoinPrivateKey]);











  const fetchVatopGroups = useCallback(async () => {
    try {
      if (!email) {
        console.warn('No email provided, skipping fetchVatopGroups');
        return;
      }
  
      const response = await axios.get('/api/fetchVatopGroups', { params: { email } });
      const fetchedVatopGroups: VatopGroup[] = response.data.vatopGroups || [];
      const fetchedVatopCombinations: VatopCombinations = response.data.vatopCombinations || {};
      const fetchedSoldAmounts: number = response.data.soldAmounts || 0;

  
      const updatedVatopGroups = fetchedVatopGroups.map((group: VatopGroup) => {
        const newCVact = group.cVactTa * bitcoinPrice;
        const newCdVatop = (group.cVactTa * bitcoinPrice) - group.cVatop;
  
        return {
          ...group,
          cVact: newCVact,
          cdVatop: newCdVatop,
          cVatop: group.cVatop,
          cpVatop: group.cpVatop,
          cVactTa: group.cVactTa,
        };
      }).filter(group => group.cVact > 0 && group.cVatop > 0);
  
      setVatopGroups(updatedVatopGroups);
  
      if (fetchedSoldAmounts !== soldAmounts) {
        setSoldAmount(fetchedSoldAmounts);
      }
  
      const updatedCombinations = updateVatopCombinations(updatedVatopGroups);
      setVatopCombinations(updatedCombinations);
  
    } catch (error) {
      console.error('Error fetching vatop groups:', error);
    }
  }, [email, bitcoinPrice, soldAmounts]);
  










  const formatNumber = (value: number | null | undefined, decimals: number = 7): string => {
    if (value === null || value === undefined) {
      return '0.00';
    }
    const valueInBTC = value / 100000000; // Convert from satoshis to bitcoins
    return valueInBTC.toFixed(decimals); // Format with specified decimals
  };

  const checkForImports = useCallback(async () => {
    try {
      if (!email) {
        console.warn('No email provided, skipping import check');
        return;
      }
  
      const response = await axios.get('/api/fetchVatopGroups', {
        params: { email },
      });
  
      const fetchedVatopGroups: VatopGroup[] = response.data.vatopGroups || [];
      const fetchedVatopCombinations: VatopCombinations = response.data.vatopCombinations || vatopCombinations;
  
      // Calculate total cVactTa from fetched Vatop Groups
      const totalCVactTas = fetchedVatopGroups.reduce((acc, group) => acc + group.cVactTa, 0);
  
      // Ensure balance is formatted correctly
      const formattedBalance = parseFloat(formatNumber(balance, 7));
  
      // Check for discrepancies
      if (formattedBalance > totalCVactTas) {
        const remainingAmount = formattedBalance - totalCVactTas;
  
        // Create new VatopGroup just like handleBuy
        const newVatop: VatopGroup = {
          cVatop: remainingAmount * bitcoinPrice,
          cpVatop: bitcoinPrice,
          cVact: remainingAmount * bitcoinPrice,
          cVactTa: remainingAmount,
          cdVatop: 0,
        };
  
        // Update vatop groups state
        const updatedVatopGroups = [...fetchedVatopGroups, newVatop];
        setVatopGroups(updatedVatopGroups);
  
        // Wait for state update before continuing
        await new Promise((resolve) => setTimeout(resolve, 0));
  
        // Update vatop combinations after updating groups
        const updatedVatopCombinations = updateVatopCombinations(updatedVatopGroups);
  
        try {
          const saveResponse = await axios.post('/api/saveVatopGroups', { email, vatopGroups: updatedVatopGroups, vatopCombinations: updatedVatopCombinations });
          setRefreshData(true); // Set flag to refresh data
        } catch (error) {
          console.error('Error saving vatop groups:', error);
        }
      }
    } catch (error) {
      console.error('Error checking for imports:', error);
    }
  }, [email, vatopCombinations.acVactTas, bitcoinPrice, updateVatopCombinations, balance]);

  useEffect(() => {
    const interval = setInterval(() => {
    fetchVatopGroups();
    checkForImports();
    }, 1000); // Set the interval to 10 seconds
    // Cleanup function to clear the interval
    return () => clearInterval(interval);
  }, [fetchVatopGroups, checkForImports]);

  useEffect(() => {
  const updatedVatopGroups = vatopGroups
  .map((group) => ({...group,
  cVact: group.cVactTa * bitcoinPrice,
  cdVatop: (group.cVactTa * bitcoinPrice) - group.cVatop,
  }))
  .filter((group) => group.cVact > 0 && group.cVatop > 0); // Remove groups with cVact and cVatop both = 0
  setVatopGroups(updatedVatopGroups);
  updateVatopCombinations(updatedVatopGroups);
  }, [bitcoinPrice]);

  useEffect(() => {
  const highestCpVatop = Math.max(...vatopGroups.map((group) => group.cpVatop), 0);
  if (bitcoinPrice > highestCpVatop) {
  setHpap(bitcoinPrice);
  } else {
  setHpap(highestCpVatop);
  }
  }, [vatopGroups, bitcoinPrice]);











const handleBuy = async (amount: number) => {

  try {

    // Add Plaid/Bank Account Transaction completion here first


    await createBoughtAmountTransaction(email, amount / bitcoinPrice, amount);

  // Step 1: Update local VatopGroups and VatopCombinations
  const newVatop: VatopGroup = {
    cVatop: amount,
    cpVatop: bitcoinPrice,
    cVact: amount,
    cVactTa: amount / bitcoinPrice,
    cdVatop: 0,
  };
  const updatedVatopGroups = [...vatopGroups, newVatop];
  setVatopGroups(updatedVatopGroups);

  const updatedVatopCombinations = updateVatopCombinations(updatedVatopGroups);

    // Step 3: Fetch updated transactions
    const responseTransactions = await axios.get(`/api/fetchVatopGroups?email=${email}`);
    const updatedTransactions = responseTransactions.data.transactions || [];

    // Step 4: Prepare payload
    const payload = {
      email,
      vatopGroups: updatedVatopGroups,
      vatopCombinations: updatedVatopCombinations,
      soldAmounts,
      transactions: updatedTransactions, // Ensure transactions is the updated list
    };

    console.log('Payload being sent to the server:', payload);

    const response = await axios.post('/api/saveVatopGroups', payload);
    console.log('Response from server:', response.data);
    setRefreshData(true); // Set flag to refresh data
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error saving vatop groups:', error.response?.data || error.message, 'Full response:', error.response);
    } else {
      console.error('Unexpected error:', error);
    }
  }
};













const handleSell = async (amount: number) => {
  console.log('Initial soldAmounts:', soldAmounts);
  console.log('Sell amount:', amount);

  if (amount > vatopCombinations.acVactsAts) {
    return;
  }

  let remainingAmount = amount;
  const updatedVatopGroups = [...vatopGroups];
  updatedVatopGroups.sort((a, b) => a.cpVatop - b.cpVatop);

  for (let i = 0; i < updatedVatopGroups.length && remainingAmount > 0; i++) {
    const group = updatedVatopGroups[i];
    const sellAmount = Math.min(group.cVact, remainingAmount);
    remainingAmount -= sellAmount;
    group.cVatop -= sellAmount;
    group.cVact -= sellAmount;
    group.cVactTa -= sellAmount / bitcoinPrice;
    group.cdVatop = group.cVact - group.cVatop;

    if (group.cVatop <= 0 && group.cVact <= 0) {
      const largestCactTaGroup = updatedVatopGroups.reduce((maxGroup, currentGroup) => {
        return currentGroup.cVactTa > maxGroup.cVactTa ? currentGroup : maxGroup;
      }, updatedVatopGroups[0]);
      largestCactTaGroup.cVactTa += group.cVactTa;
      updatedVatopGroups.splice(i, 1);
      i--;
    }
  }

  const updatedVatopCombinations = updateVatopCombinations(updatedVatopGroups);

  // Accumulate sold amounts correctly
  const newSoldAmounts = soldAmounts + amount;
  console.log('New soldAmounts before state update:', newSoldAmounts);

  // Create Sold Transaction
  try {
    await createSoldAmountTransaction(email, amount / bitcoinPrice, amount);
  } catch (error) {
    console.error('Error creating sold amount transaction:', error);
    return; // Exit if transaction creation fails
  }

  // Prepare payload
  const payload = {
    email,
    vatopGroups: updatedVatopGroups,
    vatopCombinations: updatedVatopCombinations,
    soldAmounts: newSoldAmounts, // Use updated sold amounts
  };

  console.log('Payload:', payload);

  try {
    const response = await axios.post('/api/saveVatopGroups', payload);
    console.log('Response from server:', response.data);
    setSoldAmount(newSoldAmounts); // Update the state only after the API call succeeds

    // Fetch updated vatop groups and combinations to ensure consistency
    await fetchVatopGroups(); // Ensure fetch operation is awaited
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error saving vatop groups:', error.response?.data || error.message, 'Full response:', error.response);
    } else {
      console.error('Unexpected error:', error);
    }
  }
};



const [feeRate, setFeeRate] = useState<number>(10);
useEffect(() => {
  const fetchFeeRate = async () => {
    try {
      const res = await fetch('https://mempool.space/api/v1/fees/recommended');
      const data = await res.json();
      setFeeRate(data.fastestFee); // Use the fastest fee rate for the example
    } catch (error) {
      console.error('Error fetching fee rate:', error);
      setFeeRate(10); // Fallback to 10 satoshis per byte if the fetch fails
    }
  };
  fetchFeeRate();
}, []);



const handleExport = async (amount: number, recipientAddress: string) => {
  console.log('handleExport called with amount:', amount, 'and recipientAddress:', recipientAddress);

  if (amount > vatopCombinations.acVactTas) {
    console.log('Amount exceeds acVactTas');
    return;
  }

  let remainingAmount = amount;
  const updatedVatopGroups = [...vatopGroups];
  updatedVatopGroups.sort((a, b) => b.cpVatop - a.cpVatop);

  let totalValue = 0;
  let totalLoss = 0;

  for (let i = 0; i < updatedVatopGroups.length && remainingAmount > 0; i++) {
    const group = updatedVatopGroups[i];
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

    group.cVatop -= exportAmount * bitcoinPrice;
    group.cVact -= exportAmount * bitcoinPrice;
    group.cVactTa -= exportAmount;
    group.cdVatop = group.cVact - group.cVatop;

    if (group.cVatop <= 0 && group.cVact <= 0) {
      const largestCactTaGroup = updatedVatopGroups.reduce((maxGroup, currentGroup) => {
        return currentGroup.cVactTa > maxGroup.cVactTa ? currentGroup : maxGroup;
      }, updatedVatopGroups[0]);
      largestCactTaGroup.cVactTa += group.cVactTa;
      updatedVatopGroups.splice(i, 1);
      i--;
    }
  }

  if (!bitcoinAddress || !bitcoinPrivateKey) {
    alert('Please sign in to send Bitcoin.');
    return;
  }

  const minAmount = 0.0001; // Minimum amount in BTC (0.0001 BTC)

  if (parseFloat(amount.toString()) < minAmount) {
    alert(`The amount is too low. Minimum amount is ${minAmount} BTC.`);
    return;
  }

  try {
    const amountInSatoshis = Math.round(amount * 100000000); // Convert amount to satoshis
    const transactionSize = 100; // Estimate of transaction size in bytes
    const fee = transactionSize * feeRate;
    const totalAmount = amountInSatoshis + fee;

    console.log('Amount:', amountInSatoshis, 'satoshis');
    console.log('Fee:', fee, 'satoshis');
    console.log('Total amount needed:', totalAmount, 'satoshis');
    console.log('Balance:', balance, 'satoshis');

    if (balance === null || totalAmount > balance) {
      alert('Insufficient balance to cover the amount and the fee.');
      return;
    }

    const res = await fetch('/api/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderPrivateKey: bitcoinPrivateKey,
        recipientAddress,
        amount: amountInSatoshis,
        fee,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      alert(`Transaction sent successfully! TX ID: ${data.txId}`);
      
      const transactionHash = data.txUrl;

      console.log('Transaction URL:', transactionHash);

      await createExportedAmountTransaction(email, amount, transactionHash);

      const responseTransactions = await axios.get(`/api/fetchVatopGroups?email=${email}`);
      const updatedTransactions = responseTransactions.data.transactions || [];

      // Set state
      setVatopGroups(updatedVatopGroups);
      const updatedVatopCombinations = updateVatopCombinations(updatedVatopGroups);

      setTotalExportedWalletValue(totalValue);
      setYouWillLose(Math.abs(totalLoss));

      // Prepare payload
      const payload = {
        email,
        vatopGroups: updatedVatopGroups,
        vatopCombinations: updatedVatopCombinations,
        soldAmounts,
        transactions: [
          ...updatedTransactions,
          {
            type: 'export',
            amount,
            timestamp: new Date().toISOString(),
            transactionHash,
          },
        ],
      };

      console.log('Payload for /api/saveVatopGroups:', payload);

      // Save updated vatop groups and transactions
      const response = await axios.post('/api/saveVatopGroups', payload);
      console.log('Response from server:', response.data);

      // Ensure data is refreshed
      setRefreshData(true);
    } else {
      console.error('Response data on error:', data);
      alert(`Error: ${data.error}`);
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error handling export:', error.response?.data || error.message);
    } else {
      console.error('Unexpected error:', error);
    }
  }
};









return (
<HPMContext.Provider value={{
bitcoinPrice,
vatopGroups,
vatopCombinations,
hpap,
buyAmount,
sellAmount,
exportAmount,
importAmount,
totalExportedWalletValue,
youWillLose,
soldAmounts,
setBuyAmount,
setSellAmount,
setExportAmount,
setSoldAmount,
setImportAmount,
handleBuy,
handleSell,
handleExport,
setManualBitcoinPrice: setManualBitcoinPriceApi,
updateVatopCombinations,
email,
}}>
{children}
</HPMContext.Provider>
);
};

export const useHPM = () => {
const context = useContext(HPMContext);
if (context === undefined) {
throw new Error('useHPM must be used within an HPMProvider');
}
return context;
};