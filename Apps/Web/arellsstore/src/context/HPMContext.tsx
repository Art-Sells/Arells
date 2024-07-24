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
  //handleExport: (amount: number) => void;
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
  const [soldAmounts, setSoldAmount] = useState<number>(0);
  const [refreshData, setRefreshData] = useState<boolean>(false);

  const updateVatopCombinations = (groups: VatopGroup[]): VatopCombinations => {
  
    const acVatops = groups.reduce((acc: number, group: VatopGroup) => acc + group.cVatop, 0);
    const acVacts = groups.reduce((acc: number, group: VatopGroup) => acc + group.cVact, 0);
    const acVactTas = groups.reduce((acc: number, group: VatopGroup) => acc + group.cVactTa, 0);
    const acdVatops = groups.reduce((acc: number, group: VatopGroup) => {
      return group.cdVatop > 0 ? acc + group.cdVatop : acc;
    }, 0);
    const acVactsAts = groups.reduce((acc: number, group: VatopGroup) => group.cdVatop > 0 ? acc + group.cVact : acc, 0);
    const acVactTaAts = groups.reduce((acc: number, group: VatopGroup) => group.cdVatop > 0 ? acc + group.cVactTa : acc, 0);
  
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
    const fetchEmail = async () => {
      try {
        const attributesResponse = await fetchUserAttributes();
        const emailAttribute = attributesResponse.email;
        if (emailAttribute) {
          setEmail(emailAttribute);
        }
      } catch (error) {
        console.error('Error fetching user attributes:', error);
      }
    };

    fetchEmail();
  }, []);











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
  
      updateVatopCombinations(updatedVatopGroups);
  
    } catch (error) {
      console.error('Error fetching vatop groups:', error);
    }
  }, [email, bitcoinPrice, soldAmounts]);
  












//   const checkForImports = useCallback(async () => {
//     try {
//       if (!email) {
//         console.warn('No email provided, skipping import check');
//         return;
//       }
  
//       const response = await axios.get('/api/fetchVatopGroups', {
//         params: { email },
//       });

  
//       const fetchedVatopGroups: VatopGroup[] = response.data.vatopGroups || [];
//       const fetchedVatopCombinations: VatopCombinations = response.data.vatopCombinations || vatopCombinations;

  
//       // Calculate total cVactTa from fetched Vatop Groups
//       const totalCVactTas = fetchedVatopGroups.reduce((acc, group) => acc + group.cVactTa, 0);
  
//       const fetchedAcVactTas = fetchedVatopCombinations.acVactTas;
  
//       // Check for discrepancies
//       if (fetchedAcVactTas > totalCVactTas) {
//         const remainingAmount = fetchedAcVactTas - totalCVactTas;
  
//         // Create new VatopGroup just like handleBuy
//         const newVatop: VatopGroup = {
//           cVatop: remainingAmount * bitcoinPrice,
//           cpVatop: bitcoinPrice,
//           cVact: remainingAmount * bitcoinPrice,
//           cVactTa: remainingAmount,
//           cdVatop: 0,
//         };
  
//         // Update vatop groups state
//         const updatedVatopGroups = [...fetchedVatopGroups, newVatop];
//         setVatopGroups(updatedVatopGroups);
  
//         // Wait for state update before continuing
//         await new Promise((resolve) => setTimeout(resolve, 0));
  
//         // Update vatop combinations after updating groups
//         const updatedVatopCombinations = updateVatopCombinations(updatedVatopGroups);
  
//         try {
//           const saveResponse = await axios.post('/api/saveVatopGroups', { email, vatopGroups: updatedVatopGroups, vatopCombinations: updatedVatopCombinations });
//           setRefreshData(true); // Set flag to refresh data
//         } catch (error) {
//           console.error('Error saving vatop groups:', error);
//         }
//       }
//     } catch (error) {
//       console.error('Error checking for imports:', error);
//     }
//   }, [email, vatopCombinations.acVactTas, bitcoinPrice, updateVatopCombinations]);

//     useEffect(() => {
//     const interval = setInterval(() => {
//     fetchVatopGroups();
//     checkForImports();
//     }, 1000); // Set the interval to 10 seconds
//     // Cleanup function to clear the interval
// return () => clearInterval(interval);}, [fetchVatopGroups, checkForImports]);





useEffect(() => {
  fetchVatopGroups();
  const interval = setInterval(() => {
  fetchVatopGroups();
  //checkForImports();
  }, 10000); // Set the interval to 10 seconds
  // Cleanup function to clear the interval
return () => clearInterval(interval);}, [fetchVatopGroups, 
  //checkForImports
]);


useEffect(() => {
  const updatedVatopGroups = vatopGroups
  .map((group) => ({...group,
  cVact: group.cVactTa * bitcoinPrice,
  cdVatop: (group.cVactTa * bitcoinPrice) - group.cVatop,
  }))
  .filter((group) => group.cVact > 0 && group.cVatop > 0); 
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
     // transactions: updatedTransactions,
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

  console.log('New soldAmounts before state update:', soldAmounts);


  // Prepare payload
  const payload = {
    email,
    vatopGroups: updatedVatopGroups,
    vatopCombinations: updatedVatopCombinations,
    soldAmounts: amount, // Pass only the amount sold in this transaction
  };

  console.log('Payload:', payload);

  try {
    const response = await axios.post('/api/saveVatopGroups', payload);
    console.log('Response from server:', response.data);

    // Fetch the latest soldAmounts from the server after saving to ensure consistency
    const latestResponse = await axios.get('/api/fetchVatopGroups', { params: { email } });
    const latestSoldAmounts = latestResponse.data.soldAmounts || 0;
    setSoldAmount(latestSoldAmounts); // Update soldAmounts state here

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



















// const handleExport = async (amount: number) => {
//   console.log('handleExport called with amount:', amount);

//   if (amount > vatopCombinations.acVactTas) {
//     console.log('Amount exceeds acVactTas');
//     return;
//   }

//   let remainingAmount = amount;
//   const updatedVatopGroups = [...vatopGroups];
//   updatedVatopGroups.sort((a, b) => b.cpVatop - a.cpVatop);

//   let totalValue = 0;
//   let totalLoss = 0;

//   for (let i = 0; i < updatedVatopGroups.length && remainingAmount > 0; i++) {
//     const group = updatedVatopGroups[i];
//     const exportAmount = Math.min(group.cVactTa, remainingAmount);
//     remainingAmount -= exportAmount;

//     const originalCdVatop = group.cdVatop;
//     const originalCVactTa = group.cVactTa;
//     const lossFraction = exportAmount / originalCVactTa;

//     const newCdVatop = originalCdVatop * lossFraction;

//     totalValue += exportAmount * bitcoinPrice;
//     if (newCdVatop < 0) {
//       totalLoss += newCdVatop;
//     }

//     group.cVatop -= exportAmount * bitcoinPrice;
//     group.cVact -= exportAmount * bitcoinPrice;
//     group.cVactTa -= exportAmount;
//     group.cdVatop = group.cVact - group.cVatop;

//     if (group.cVatop <= 0 && group.cVact <= 0) {
//       const largestCactTaGroup = updatedVatopGroups.reduce((maxGroup, currentGroup) => {
//         return currentGroup.cVactTa > maxGroup.cVactTa ? currentGroup : maxGroup;
//       }, updatedVatopGroups[0]);
//       largestCactTaGroup.cVactTa += group.cVactTa;
//       updatedVatopGroups.splice(i, 1);
//       i--;
//     }
//   }

//   // Set state
//   setVatopGroups(updatedVatopGroups);
//   const updatedVatopCombinations = updateVatopCombinations(updatedVatopGroups);

//   setTotalExportedWalletValue(totalValue);
//   setYouWillLose(Math.abs(totalLoss));

//   try {
//     // Fetch updated transactions
//     const responseTransactions = await axios.get(`/api/fetchVatopGroups?email=${email}`);
//     const updatedTransactions = responseTransactions.data.transactions || [];

//     console.log('Fetched Updated Transactions:', updatedTransactions);

//     // Create export transaction
//     const transactionHash = "dskjfdslkfj5tdfDFGdfg"; // Replace with actual transaction hash
//     await createExportedAmountTransaction(email, amount, transactionHash);

//     // Prepare payload
//     const payload = {
//       email,
//       vatopGroups: updatedVatopGroups,
//       vatopCombinations: updatedVatopCombinations,
//       soldAmounts,
//       transactions: [
//         ...updatedTransactions,
//         {
//           type: 'export',
//           amount,
//           timestamp: new Date().toISOString(),
//           transactionHash,
//         },
//       ],
//     };

//     console.log('Payload for /api/saveVatopGroups:', payload);

//     // Save updated vatop groups and transactions
//     const response = await axios.post('/api/saveVatopGroups', payload);
//     console.log('Response from server:', response.data);

//     // Ensure data is refreshed
//     setRefreshData(true);

//   } catch (error: unknown) {
//     if (axios.isAxiosError(error)) {
//       console.error('Error handling export:', error.response?.data || error.message);
//     } else {
//       console.error('Unexpected error:', error);
//     }
//   }
// };









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
//handleExport,
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