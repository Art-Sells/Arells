// 'use client';

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { useHPM } from '../../context/HPMContext';
// import { Transactions, createWithdrewAmountTransaction, ParsedTransaction } from '../../lib/transactions';

// const HPMTester: React.FC = () => {
//   const {
//     bitcoinPrice,
//     vatopGroups,
//     vatopCombinations,
//     hpap,
//     buyAmount,
//     setBuyAmount,
//     sellAmount,
//     setSellAmount,
//     setImportAmount,
//     handleBuy,
//     handleSell,
//     //handleExport,
//     updateVatopCombinations,
//     email,
//   } = useHPM();

//   const [localExportAmount, setLocalExportAmount] = useState<number>(0);
//   const [localImportAmount, setLocalImportAmount] = useState<number>(0);
//   const [localTotalExportedWalletValue, setLocalTotalExportedWalletValue] = useState<number>(0);
//   const [localYouWillLose, setLocalYouWillLose] = useState<number>(0);
//   const [transactions, setTransactions] = useState<Transactions[]>([]);

//   const handleBuyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setBuyAmount(Number(e.target.value));
//   };

//   const handleSellAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSellAmount(Number(e.target.value));
//   };

//   const handleWithdraw = async () => {
//     console.log('Withdrawing sold amount');
  
//     // Create Withdraw Transaction
//     let withdrewTransaction;
//     try {
//       withdrewTransaction = await createWithdrewAmountTransaction(email, 0); // Await the result
//       console.log('Withdrew transaction: ', withdrewTransaction); // Log the result
//     } catch (error) {
//       console.error('Error creating withdrew amount transaction:', error);
//       return; // Exit if transaction creation fails
//     }
  
//     try {
//       const newSoldAmount = 0; 
//       console.log('Sending withdraw request with payload:', { email, soldAmounts: newSoldAmount });
  
//       const updatedVatopCombinations = updateVatopCombinations(vatopGroups);
  
//       // Fetch updated transactions
//       const responseTransactions = await axios.get(`/api/fetchVatopGroups?email=${email}`);
//       const updatedTransactions = responseTransactions.data.transactions || [];
  
//       const payload = {
//         email,
//         vatopGroups,
//         vatopCombinations: updatedVatopCombinations,
//       };
  
//       console.log('Payload:', payload);
  
//       const response = await axios.post('/api/saveVatopGroups', payload);
//       console.log('Withdraw response:', response.data);
  
//       updateVatopCombinations(vatopGroups); // Update the combinations
//     } catch (error) {
//       console.error('Error withdrawing sold amount:', error);
//     }
//   };

//   return (
//     <div>
//       <h1>HPM Tester</h1>
//       <div>
//         <label>
//           Bitcoin Price: ${bitcoinPrice}
//         </label>
//       </div>
//       <div>
//         <label>
//           Buy Amount:
//           <input type="number" value={buyAmount} onChange={handleBuyAmountChange} />
//         </label>
//         <button onClick={() => handleBuy(buyAmount)}>Buy</button>
//       </div>
//       <div>
//         <label>
//           Sell Amount:
//           <input type="number" value={sellAmount} onChange={handleSellAmountChange} />
//         </label>
//         <button onClick={() => handleSell(sellAmount)}>Sell</button>
//       </div>
//     {/* <div>
//         <label>
//           Export Amount:
//           <input type="number" value={localExportAmount} onChange={handleExportAmountChange} />
//         </label>
//         <button onClick={() => handleExport(localExportAmount)}>Export</button>
//       </div>
//       <div>
//         <label>
//           Import Amount:
//           <input type="number" value={localImportAmount} onChange={handleImportAmountChange} />
//         </label>
//         <button onClick={handleImportClick}>Import</button>
//       </div> */}
//       {/* <div>
//         <h2>Total Exported Wallet Value: {formatCurrency(localTotalExportedWalletValue)}</h2>
//         <h2>You Will Lose: {formatCurrency(localYouWillLose)}</h2>
//       </div> */}
//       <div>
//         <h2>HPAP: {formatCurrency(hpap)}</h2>
//         <h2>Vatop Groups:</h2>
//         {vatopGroups.length > 0 ? (
//           vatopGroups.map((group, index) => (
//             <div key={index}>
//               <h3>Vatop Group {index + 1}</h3>
//               <p>cVatop: {formatCurrency(group.cVatop)}</p>
//               <p>cpVatop: {formatCurrency(group.cpVatop)}</p>
//               <p>cVact: {formatCurrency(group.cVact)}</p>
//               <p>cVactTa: {formatNumber(group.cVactTa)}</p>
//               <p>cdVatop: {formatCurrency(group.cdVatop)}</p>
//             </div>
//           ))
//         ) : (
//           <p>No Vatop Groups available</p>
//         )}
//       </div>
//       <div>
//         <h2>Vatop Group Combinations:</h2>
//         <p>acVatops: {formatCurrency(vatopCombinations.acVatops)}</p>
//         <p>acVacts: {formatCurrency(vatopCombinations.acVacts)}</p>
//         <p>acVactTas: {formatNumber(vatopCombinations.acVactTas)}</p>
//         <p>acdVatops: {formatCurrency(vatopCombinations.acdVatops)}</p>
//         <p>acVactsAts: {formatCurrency(vatopCombinations.acVactsAts)}</p>
//         <p>acVactTaAts: {formatNumber(vatopCombinations.acVactTaAts)}</p>
//       </div>
//       {/* <div>
//         <h2>Transactions</h2>
//         {renderTransactions()}
//       </div> */}
//     </div>
//   );
// };

// const formatCurrency = (value: number): string => {
//   return `$${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
// };

// const formatNumber = (value: number): string => {
//   return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 });
// };

// export default HPMTester;

// function setRefreshData(arg0: boolean) {
//   throw new Error('Function not implemented.');
// }


