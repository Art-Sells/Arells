'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useHPM } from '../../context/HPMContext';
import { Transactions, createWithdrewAmountTransaction, ParsedTransaction } from '../../lib/transactions';

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
    //handleExport,
    updateVatopCombinations,
    email,
    soldAmounts,
  } = useHPM();

  const [localExportAmount, setLocalExportAmount] = useState<number>(0);
  const [localImportAmount, setLocalImportAmount] = useState<number>(0);
  const [localTotalExportedWalletValue, setLocalTotalExportedWalletValue] = useState<number>(0);
  const [localYouWillLose, setLocalYouWillLose] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transactions[]>([]);

  const handleBuyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBuyAmount(Number(e.target.value));
  };

  const handleSellAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSellAmount(Number(e.target.value));
  };

  // const handleExportAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setLocalExportAmount(Number(e.target.value));
  // };

  // const handleImportAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setLocalImportAmount(Number(e.target.value));
  // };





// // Export Losses Calculations
//   useEffect(() => {
//     setLocalTotalExportedWalletValue(localExportAmount * bitcoinPrice);
//   }, [localExportAmount, bitcoinPrice]);
//   useEffect(() => {
//     const calculateYouWillLose = () => {
//       if (vatopGroups.length === 0 || localExportAmount === 0) {
//         setLocalYouWillLose(0);
//         return;
//       }
  
//       // Calculate the combined loss for all negative cdVatop groups
//       const totalLoss = vatopGroups
//         .filter(group => group.cdVatop < 0)
//         .reduce((acc, group) => {
//           const lossFraction = Math.min(localExportAmount / group.cVactTa, 1);
//           const groupLoss = group.cdVatop * lossFraction;
//           return acc + groupLoss;
//         }, 0); 
//       setLocalYouWillLose(Math.abs(totalLoss));
//     };
  
//     calculateYouWillLose();
//   }, [vatopGroups, localExportAmount]);









  // const handleImportClick = async () => {
  //   setImportAmount(localImportAmount);
  //   const newAcVactTas = vatopCombinations.acVactTas + localImportAmount;
  
  //   // Prepare payload to update only acVactTas
  //   const payload = {
  //     email,
  //     acVactTas: newAcVactTas,
  //   };
  
  //   try {
  //     await axios.post('/api/saveVatopGroups', payload);
  //     // No need to refresh data
  //   } catch (error: unknown) {
  //     if (axios.isAxiosError(error)) {
  //       console.error('Error updating acVactTas:', error.response?.data || error.message, 'Full response:', error.response);
  //     } else {
  //       console.error('Unexpected error:', error);
  //     }
  //   }
  // };











  const handleWithdraw = async () => {
    console.log('Withdrawing sold amount:', soldAmounts);
  
    // Create Withdraw Transaction
    let withdrewTransaction;
    try {
      withdrewTransaction = await createWithdrewAmountTransaction(email, soldAmounts); // Await the result
      console.log('Withdrew transaction: ', withdrewTransaction); // Log the result
    } catch (error) {
      console.error('Error creating withdrew amount transaction:', error);
      return; // Exit if transaction creation fails
    }
  
    try {
      const newSoldAmount = 0; 
      console.log('Sending withdraw request with payload:', { email, soldAmounts: newSoldAmount });
  
      const updatedVatopCombinations = updateVatopCombinations(vatopGroups);
  
      // Fetch updated transactions
      const responseTransactions = await axios.get(`/api/fetchVatopGroups?email=${email}`);
      const updatedTransactions = responseTransactions.data.transactions || [];
  
      const payload = {
        email,
        vatopGroups,
        vatopCombinations: updatedVatopCombinations,
        soldAmounts: newSoldAmount, // Reset the sold amounts
      };
  
      console.log('Payload:', payload);
  
      const response = await axios.post('/api/saveVatopGroups', payload);
      console.log('Withdraw response:', response.data);
  
      setSoldAmount(newSoldAmount); // Update the state after the API call succeeds
      updateVatopCombinations(vatopGroups); // Update the combinations
    } catch (error) {
      console.error('Error withdrawing sold amount:', error);
    }
  };














  // useEffect(() => {
  //   const fetchTransactions = async () => {
  //     try {
  //       const response = await axios.get<{ transactions: Transactions[] }>(`/api/fetchVatopGroups?email=${email}`);
  //       const fetchedTransactions = response.data.transactions || [];
  //       setTransactions(fetchedTransactions);
  //     } catch (error) {
  //       console.error('Error fetching transactions:', error);
  //     }
  //   };
  
  //   fetchTransactions();
  //   const interval = setInterval(fetchTransactions, 2000); // Check every 2 seconds
  
  //   return () => clearInterval(interval);
  // }, [email]);






  
  // const renderTransactions = () => {
  //   if (!Array.isArray(transactions)) {
  //     console.error('transactions is not an array:', transactions);
  //     return null;
  //   }
  
  //   const parseJSON = (jsonString: string | undefined) => {
  //     if (!jsonString) return undefined;
  //     try {
  //       return JSON.parse(jsonString) as ParsedTransaction;
  //     } catch (error) {
  //       console.error('Error parsing JSON:', error, jsonString);
  //       return undefined;
  //     }
  //   };
  
  //   const formatBitcoinAmount = (amount: number) => {
  //     const decimalPlaces = 7; 
  //     return Number(amount.toFixed(decimalPlaces)); 
  //   };
  
  //   const groupedTransactions = transactions.reduce((acc: Record<string, (Transactions & ParsedProperties)[]>, transaction: Transactions) => {
  //     // Parse transaction amounts
  //     const parsedSoldAmount = typeof transaction.soldAmount === 'string' ? parseJSON(transaction.soldAmount) : undefined;
  //     const parsedBoughtAmount = typeof transaction.boughtAmount === 'string' ? parseJSON(transaction.boughtAmount) : undefined;
  //     const parsedWithdrewAmount = typeof transaction.withdrewAmount === 'string' ? parseJSON(transaction.withdrewAmount) : undefined;
  //     const parsedExportedAmount = typeof transaction.exportedAmount === 'string' ? parseJSON(transaction.exportedAmount) : undefined;
  
  //     // Determine the transaction date
  //     const date =
  //       parsedBoughtAmount?.date ||
  //       parsedSoldAmount?.date ||
  //       parsedWithdrewAmount?.date ||
  //       parsedExportedAmount?.date ||
  //       transaction.timestamp; // Use the timestamp if available
  
  //     if (!date) {
  //       console.error('No date found for transaction:', transaction);
  //       return acc; // Skip transactions without a valid date
  //     }
  
  //     if (!acc[date]) {
  //       acc[date] = [];
  //     }
  
  //     acc[date].push({
  //       ...transaction,
  //       parsedSoldAmount,
  //       parsedBoughtAmount,
  //       parsedWithdrewAmount,
  //       parsedExportedAmount,
  //     });
  
  //     return acc;
  //   }, {} as Record<string, (Transactions & ParsedProperties)[]>);
  
  //   // Sort dates in reverse order (most recent date first)
  //   const sortedDates = Object.keys(groupedTransactions).sort((a, b) => {
  //     const dateA = new Date(a).getTime();
  //     const dateB = new Date(b).getTime();
  //     return dateB - dateA; // Sort dates in descending order
  //   });
  
  //   return sortedDates.map(date => (
  //     <div key={date}>
  //       <h3>Date: {date}</h3>
  //       {/* Sort transactions for each date from latest to earliest */}
  //       {groupedTransactions[date].sort((a, b) => {
  //         return (b.timestamp ? new Date(b.timestamp).getTime() : 0) - (a.timestamp ? new Date(a.timestamp).getTime() : 0); // Sort by timestamp in descending order
  //       }).map((transaction, index) => (
  //         <div key={index}>
  //           {transaction.parsedSoldAmount && (
  //             <p>
  //               Sold: Bitcoin Amount: {formatBitcoinAmount(transaction.parsedSoldAmount.bitcoinAmount)}, For: ${transaction.parsedSoldAmount.amount}
  //             </p>
  //           )}
  //           {transaction.parsedBoughtAmount && (
  //             <p>
  //               Bought: Bitcoin Amount: {formatBitcoinAmount(transaction.parsedBoughtAmount.bitcoinAmount)}, For: ${transaction.parsedBoughtAmount.amount}
  //             </p>
  //           )}
  //           {transaction.parsedWithdrewAmount && (
  //             <p>
  //               Withdrew: Amount: ${transaction.parsedWithdrewAmount.bitcoinAmount}, To: {transaction.parsedWithdrewAmount.link}
  //             </p>
  //           )}
  //           {transaction.parsedExportedAmount && (
  //             <p>
  //               Exported: Bitcoin Amount: {formatBitcoinAmount(transaction.parsedExportedAmount.bitcoinAmount)}, To: {transaction.parsedExportedAmount.link}
  //             </p>
  //           )}
  //         </div>
  //       ))}
  //     </div>
  //   ));
  // };
  // // Additional type to include parsed properties
  // interface ParsedProperties {
  //   parsedSoldAmount?: ParsedTransaction;
  //   parsedBoughtAmount?: ParsedTransaction;
  //   parsedWithdrewAmount?: ParsedTransaction;
  //   parsedExportedAmount?: ParsedTransaction;
  // }










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
      {/* <div>
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
      </div> */}
      {/* <div>
        <h2>Total Exported Wallet Value: {formatCurrency(localTotalExportedWalletValue)}</h2>
        <h2>You Will Lose: {formatCurrency(localYouWillLose)}</h2>
      </div> */}
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
      {/* <div>
        <h2>Transactions</h2>
        {renderTransactions()}
      </div> */}
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