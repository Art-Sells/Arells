'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { fetchBitcoinPrice, setManualBitcoinPrice as setManualBitcoinPriceApi } from '../lib/coingecko-api';
import { fetchUserAttributes } from 'aws-amplify/auth';

interface VatopGroup {
  cVatop: string;
  cpVatop: string;
  cVact: string;
  cVactTa: string;
  cdVatop: string;
}

interface VatopCombinations {
  acVatops: string;
  acVacts: string;
  acVactTas: string;
  acdVatops: string;
  acVactsAts: string;
  acVactTaAts: string;
}

interface HPMContextType {
  bitcoinPrice: number;
  vatopGroups: VatopGroup[];
  vatopCombinations: VatopCombinations;
  hpap: string;
  buyAmount: number;
  sellAmount: number;
  exportAmount: number;
  importAmount: number;
  totalExportedWalletValue: string;
  youWillLose: string;
  setBuyAmount: (amount: number) => void;
  setSellAmount: (amount: number) => void;
  setExportAmount: (amount: number) => void;
  setImportAmount: (amount: number) => void;
  handleBuy: (amount: number) => void;
  handleSell: (amount: number) => void;
  handleExport: (amount: number) => void;
  setManualBitcoinPrice: (price: number) => void;
  updateVatopCombinations: (groups: VatopGroup[]) => void;
  email: string; // Add email to the context type
}

const HPMContext = createContext<HPMContextType | undefined>(undefined);

const formatCurrency = (value: number): string => {
  return `$${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

const formatNumber = (value: number): string => {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 });
};

const parseCurrency = (value: string | number): number => {
  if (typeof value === 'number') return value;
  return parseFloat(value.replace(/[$,]/g, ''));
};

const parseNumber = (value: string | number): number => {
  if (typeof value === 'number') return value;
  return parseFloat(value);
};

export const HPMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bitcoinPrice, setBitcoinPrice] = useState<number>(0);
  const [buyAmount, setBuyAmount] = useState<number>(0);
  const [sellAmount, setSellAmount] = useState<number>(0);
  const [exportAmount, setExportAmount] = useState<number>(0);
  const [importAmount, setImportAmount] = useState<number>(0);
  const [vatopGroups, setVatopGroups] = useState<VatopGroup[]>([]);
  const [vatopCombinations, setVatopCombinations] = useState<VatopCombinations>({
    acVatops: '$0',
    acVacts: '$0',
    acVactTas: '0',
    acdVatops: '$0',
    acVactsAts: '$0',
    acVactTaAts: '0',
  });
  const [hpap, setHpap] = useState<string>('$0');
  const [totalExportedWalletValue, setTotalExportedWalletValue] = useState<string>('$0');
  const [youWillLose, setYouWillLose] = useState<string>('$0');
  const [email, setEmail] = useState<string>('');
  const [refreshData, setRefreshData] = useState<boolean>(false);

  const updateVatopCombinations = (groups: VatopGroup[]) => {
    console.log('Updating Vatop Combinations with groups:', groups);
  
    const acVatops = groups.reduce((acc: number, group: VatopGroup) => acc + Math.max(parseCurrency(group.cVatop), parseCurrency(group.cVact)), 0);
    console.log('Calculated acVatops:', acVatops);
  
    const acVacts = groups.reduce((acc: number, group: VatopGroup) => acc + parseCurrency(group.cVact), 0);
    console.log('Calculated acVacts:', acVacts);
  
    const acVactTas = groups.reduce((acc: number, group: VatopGroup) => acc + parseNumber(group.cVactTa), 0);
    console.log('Calculated acVactTas:', acVactTas);
  
    const acdVatops = groups.reduce((acc: number, group: VatopGroup) => {
      const cdVatop = parseCurrency(group.cdVatop);
      return cdVatop > 0 ? acc + cdVatop : acc;
    }, 0);
    console.log('Calculated acdVatops:', acdVatops);
  
    const acVactsAts = groups.reduce((acc: number, group: VatopGroup) => {
      const cdVatop = parseCurrency(group.cdVatop);
      return cdVatop > 0 ? acc + parseCurrency(group.cVact) : acc;
    }, 0);
    console.log('Calculated acVactsAts:', acVactsAts);
  
    const acVactTaAts = groups.reduce((acc: number, group: VatopGroup) => {
      const cdVatop = parseCurrency(group.cdVatop);
      return cdVatop > 0 ? acc + parseNumber(group.cVactTa) : acc;
    }, 0);
    console.log('Calculated acVactTaAts:', acVactTaAts);
  
    const updatedCombinations = {
      acVatops: formatCurrency(acVatops),
      acVacts: formatCurrency(acVacts),
      acVactTas: formatNumber(acVactTas),
      acdVatops: formatCurrency(acdVatops > 0 ? acdVatops : 0),
      acVactsAts: formatCurrency(acVactsAts),
      acVactTaAts: formatNumber(acVactTaAts)
    };
  
    console.log('Calculated Updated Vatop Combinations:', updatedCombinations);
  
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

  useEffect(() => {
    const fetchAndSetVatopGroups = async () => {
      try {
        if (!email) {
          console.warn('No email provided, skipping fetchVatopGroups');
          return;
        }
        
        console.log('Fetching vatop groups for email:', email);
        const response = await axios.get('/api/fetchVatopGroups', {
          params: { email }
        });
        
        const fetchedVatopGroups = response.data.vatopGroups || [];
        const fetchedVatopCombinations = response.data.vatopCombinations || {};
  
        console.log('Fetched Vatop Groups:', fetchedVatopGroups);
        console.log('Fetched Vatop Combinations:', fetchedVatopCombinations);
  
        const updatedVatopGroups = fetchedVatopGroups.map((group: { cVactTa: string | number; cVatop: string | number; cpVatop: string | number; }) => ({
          ...group,
          cVact: formatCurrency(parseNumber(group.cVactTa) * bitcoinPrice),
          cdVatop: formatCurrency((parseNumber(group.cVactTa) * bitcoinPrice) - parseCurrency(group.cVatop)),
          cVatop: formatCurrency(parseCurrency(group.cVatop)),
          cpVatop: formatCurrency(parseCurrency(group.cpVatop)),
          cVactTa: formatNumber(parseNumber(group.cVactTa))
        })).filter((group: { cVact: string | number; cVatop: string | number; }) => parseCurrency(group.cVact) > 0 && parseCurrency(group.cVatop) > 0);
  
        setVatopGroups(updatedVatopGroups);
  
        const currentCombinations = updateVatopCombinations(updatedVatopGroups);
        console.log('Current Vatop Combinations:', currentCombinations);
  
        if (JSON.stringify(fetchedVatopCombinations) !== JSON.stringify(currentCombinations)) {
          console.log('Discrepancy found, updating vatop combinations');
          setVatopCombinations(currentCombinations);
        } else {
          console.log('No discrepancy found in fetched vatop combinations');
        }
      } catch (error) {
        console.error('Error fetching vatop groups:', error);
      }
    };
  
    // Fetch data initially when component mounts
    fetchAndSetVatopGroups();
  
    // Setup interval to fetch data every 10 seconds
    const interval = setInterval(fetchAndSetVatopGroups, 10000);
  
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [email, bitcoinPrice, updateVatopCombinations]);
  
  useEffect(() => {
    console.log('Updated Vatop Groups:', vatopGroups);
    console.log('Updated Vatop Combinations:', vatopCombinations);
  }, [vatopGroups, vatopCombinations]);

  useEffect(() => {
    const updatedVatopGroups = vatopGroups
      .map(group => ({
        ...group,
        cVact: formatCurrency(parseNumber(group.cVactTa) * bitcoinPrice),
        cdVatop: formatCurrency((parseNumber(group.cVactTa) * bitcoinPrice) - parseCurrency(group.cVatop)),
      }))
      .filter(group => parseCurrency(group.cVact) > 0 && parseCurrency(group.cVatop) > 0); // Remove groups with cVact and cVatop both = 0
    setVatopGroups(updatedVatopGroups);
    updateVatopCombinations(updatedVatopGroups);
  }, [bitcoinPrice]);

  useEffect(() => {
    const highestCpVatop = Math.max(...vatopGroups.map(group => parseCurrency(group.cpVatop)), 0);
    if (bitcoinPrice > highestCpVatop) {
      setHpap(formatCurrency(bitcoinPrice));
    } else {
      setHpap(formatCurrency(highestCpVatop));
    }
  }, [vatopGroups, bitcoinPrice]);

  const handleBuy = async (amount: number) => {
    const newVatop: VatopGroup = {
      cVatop: formatCurrency(amount),
      cpVatop: formatCurrency(bitcoinPrice),
      cVact: formatCurrency(amount),
      cVactTa: formatNumber(amount / bitcoinPrice),
      cdVatop: formatCurrency(0),
      };
      const updatedVatopGroups = [...vatopGroups, newVatop];
      setVatopGroups(updatedVatopGroups);
      const updatedVatopCombinations = updateVatopCombinations(updatedVatopGroups);
      
      try {
      console.log('Attempting to save vatop groups:', updatedVatopGroups);
      await axios.post('/api/saveVatopGroups', { email, vatopGroups: updatedVatopGroups, vatopCombinations: updatedVatopCombinations });
      setRefreshData(true); // Set flag to refresh data
      } catch (error) {
      console.error('Error saving vatop groups:', error);
      }};
      
      const handleSell = async (amount: number) => {
      if (amount > parseCurrency(vatopCombinations.acVactsAts)) {
      return;
      }let remainingAmount = amount;
      const updatedVatopGroups = [...vatopGroups];
      updatedVatopGroups.sort((a, b) => parseCurrency(a.cpVatop) - parseCurrency(b.cpVatop));
      
      for (let i = 0; i < updatedVatopGroups.length && remainingAmount > 0; i++) {
      const group = updatedVatopGroups[i];
      const sellAmount = Math.min(parseCurrency(group.cVact), remainingAmount);
      remainingAmount -= sellAmount;
      
      group.cVatop = formatCurrency(parseCurrency(group.cVatop) - sellAmount);
      group.cVact = formatCurrency(parseCurrency(group.cVact) - sellAmount);
      group.cVactTa = formatNumber(parseNumber(group.cVactTa) - (sellAmount / bitcoinPrice));
      group.cdVatop = formatCurrency(parseCurrency(group.cVact) - parseCurrency(group.cVatop));
      if (parseCurrency(group.cVatop) <= 0 && parseCurrency(group.cVact) <= 0) {
      // Find the group with the largest cVactTa
      const largestCactTaGroup = updatedVatopGroups.reduce((maxGroup, currentGroup) => {
      return parseNumber(currentGroup.cVactTa) > parseNumber(maxGroup.cVactTa) ? currentGroup : maxGroup;
      }, updatedVatopGroups[0]);
      // Add cVactTa to the group with the largest cVactTa
      largestCactTaGroup.cVactTa = formatNumber(parseNumber(largestCactTaGroup.cVactTa) + parseNumber(group.cVactTa));
      // Remove the group with cVatop and cVact both = 0
updatedVatopGroups.splice(i, 1);
i--; // Adjust index after removal
}
}

setVatopGroups(updatedVatopGroups);
const updatedVatopCombinations = updateVatopCombinations(updatedVatopGroups);

try {
console.log('Attempting to save vatop groups:', updatedVatopGroups);
await axios.post('/api/saveVatopGroups', { email, vatopGroups: updatedVatopGroups, vatopCombinations: updatedVatopCombinations });
setRefreshData(true); // Set flag to refresh data
} catch (error) {
console.error('Error saving vatop groups:', error);
}};

const handleExport = async (amount: number) => {
if (amount > parseNumber(vatopCombinations.acVactTas)) {
return;
}
let remainingAmount = amount;
const updatedVatopGroups = [...vatopGroups];
updatedVatopGroups.sort((a, b) => parseCurrency(b.cpVatop) - parseCurrency(a.cpVatop)); // Start from the highest cpVatop
let totalValue = 0;
let totalLoss = 0;

for (let i = 0; i < updatedVatopGroups.length && remainingAmount > 0; i++) {
const group = updatedVatopGroups[i];
const exportAmount = Math.min(parseNumber(group.cVactTa), remainingAmount);
remainingAmount -= exportAmount;

const originalCdVatop = parseCurrency(group.cdVatop);
const originalCVactTa = parseNumber(group.cVactTa);
const lossFraction = exportAmount / originalCVactTa;

const newCdVatop = originalCdVatop * lossFraction;

totalValue += exportAmount * bitcoinPrice;
if (newCdVatop < 0) {
totalLoss += newCdVatop;
}

group.cVatop = formatCurrency(parseCurrency(group.cVatop) - exportAmount * bitcoinPrice);
group.cVact = formatCurrency(parseCurrency(group.cVact) - exportAmount * bitcoinPrice);
group.cVactTa = formatNumber(parseNumber(group.cVactTa) - exportAmount);
group.cdVatop = formatCurrency(parseCurrency(group.cVact) - parseCurrency(group.cVatop));

if (parseCurrency(group.cVatop) <= 0 && parseCurrency(group.cVact) <= 0) {
// Find the group with the largest cVactTa
const largestCactTaGroup = updatedVatopGroups.reduce((maxGroup, currentGroup) => {
return parseNumber(currentGroup.cVactTa) > parseNumber(maxGroup.cVactTa) ? currentGroup : maxGroup;
}, updatedVatopGroups[0]);
// Add cVactTa to the group with the largest cVactTa
largestCactTaGroup.cVactTa = formatNumber(parseNumber(largestCactTaGroup.cVactTa) + parseNumber(group.cVactTa));

// Remove the group with cVatop and cVact both = 0
updatedVatopGroups.splice(i, 1);
i--; // Adjust index after removal
}
}

setVatopGroups(updatedVatopGroups);
const updatedVatopCombinations = updateVatopCombinations(updatedVatopGroups);

setTotalExportedWalletValue(formatCurrency(totalValue));
setYouWillLose(formatCurrency(Math.abs(totalLoss)));

try {
console.log('Attempting to save vatop groups:', updatedVatopGroups);
await axios.post('/api/saveVatopGroups', { email, vatopGroups: updatedVatopGroups, vatopCombinations: updatedVatopCombinations });
setRefreshData(true); // Set flag to refresh data
} catch (error) {
console.error('Error saving vatop groups:', error);
}
};

const checkForImports = useCallback(async () => {
  try {
    if (!email) {
      console.warn('No email provided, skipping import check');
      return;
    }

    console.log('Fetching vatop groups for email:', email);
    const response = await axios.get('/api/fetchVatopGroups', {
      params: { email }
    });

    const fetchedVatopGroups: VatopGroup[] = response.data.vatopGroups || [];
    const fetchedVatopCombinations: VatopCombinations = response.data.vatopCombinations || vatopCombinations;

    console.log('Fetched Vatop Groups:', fetchedVatopGroups);
    console.log('Fetched Vatop Combinations:', fetchedVatopCombinations);

    // Calculate total cVactTa from fetched Vatop Groups
    const totalCVactTas = fetchedVatopGroups.reduce((acc, group) => acc + parseNumber(group.cVactTa), 0);
    console.log('Total cVactTa from fetched Vatop Groups:', totalCVactTas);

    const fetchedAcVactTas = parseNumber(fetchedVatopCombinations.acVactTas);
    console.log('Fetched acVactTas:', fetchedAcVactTas);

    // Check for discrepancies
    if (fetchedAcVactTas > totalCVactTas) {
      const remainingAmount = fetchedAcVactTas - totalCVactTas;
      console.log('Discrepancy found, remaining amount to correct:', remainingAmount);

      const newVatopGroup: VatopGroup = {
        cVatop: formatCurrency(remainingAmount * bitcoinPrice),
        cpVatop: formatCurrency(bitcoinPrice),
        cVact: formatCurrency(remainingAmount * bitcoinPrice),
        cVactTa: formatNumber(remainingAmount),
        cdVatop: formatCurrency(0),
      };

      console.log('New Vatop Group to be added:', newVatopGroup);

      // Update vatop groups state
      const updatedVatopGroups = [...fetchedVatopGroups, newVatopGroup];
      setVatopGroups(updatedVatopGroups);

      // Wait for state update before continuing
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Update vatop combinations after updating groups
      const updatedVatopCombinations = updateVatopCombinations(updatedVatopGroups);

      try {
        console.log('Attempting to save vatop groups with import:', updatedVatopGroups);
        await axios.post('/api/saveVatopGroups', { email, vatopGroups: updatedVatopGroups, vatopCombinations: updatedVatopCombinations });
        setRefreshData(true); // Set flag to refresh data
      } catch (error) {
        console.error('Error saving vatop groups:', error);
      }
    } else {
      console.log('No discrepancy found in acVactTas');
    }
  } catch (error) {
    console.error('Error checking for imports:', error);
  }
}, [email, vatopCombinations.acVactTas, bitcoinPrice, updateVatopCombinations]);

useEffect(() => {
  const interval = setInterval(checkForImports, 10000); // Check every 10 seconds
  return () => clearInterval(interval); // Cleanup interval on unmount
}, [checkForImports]);
  
  
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
  setBuyAmount,
  setSellAmount,
  setExportAmount,
  setImportAmount,
  handleBuy,
  handleSell,
  handleExport,
  setManualBitcoinPrice: setManualBitcoinPriceApi,
  updateVatopCombinations, // Ensure the function is passed here
  email
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