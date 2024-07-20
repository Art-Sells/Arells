import axios from 'axios';

const DATE_API_URL = 'http://worldtimeapi.org/api/timezone/America/Los_Angeles';

// Variable to set the manual date manually
let manualDate: string | null = null;

// Function to set the manual date
export const setManualDate = (date: string): void => {
  manualDate = date;
};

// Function to fetch the current date in PST
export const fetchCurrentDatePST = async (): Promise<string> => {
  try {
    // If a manual date is set, return it
    if (manualDate !== null) {
      return manualDate;
    }

    const response = await axios.get(DATE_API_URL);
    const currentDate = new Date(response.data.datetime);
    const formattedDate = `${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getDate().toString().padStart(2, '0')}/${currentDate.getFullYear().toString().slice(-2)}`;
    return formattedDate;
  } catch (error) {
    console.error('Error fetching current date in PST:', error);
    throw new Error('Could not fetch current date in PST');
  }
};

// Function to manually update the date for testing
export const updateManualDate = (date: string): void => {
  setManualDate(date);
};

// Define the Transactions interface
export interface Transactions {
  soldAmount: string;
  boughtAmount: string;
  withdrewAmount: string;
  exportedAmount: string;
}

// Helper function to create transaction strings
const createTransactionString = (date: string, amount1: number, amount2: number, link?: string): string => {
  if (link) {
    return JSON.stringify({ date, amount1, amount2, link });
  }
  return JSON.stringify({ date, amount1, amount2 });
};

// Function to create a sold amount transaction
export const createSoldAmountTransaction = async (bitcoinAmount: number, soldAmount: number): Promise<string> => {
  const date = await fetchCurrentDatePST();
  return createTransactionString(date, bitcoinAmount, soldAmount);
};

// Function to create a bought amount transaction
export const createBoughtAmountTransaction = async (bitcoinAmount: number, boughtAmount: number): Promise<string> => {
  const date = await fetchCurrentDatePST();
  return createTransactionString(date, bitcoinAmount, boughtAmount);
};

// Function to create a withdrew amount transaction
export const createWithdrewAmountTransaction = async (withdrewAmount: number): Promise<string> => {
  const date = await fetchCurrentDatePST();
  const bankAccountLink = 'https://arells.com/bankaccount';
  return createTransactionString(date, withdrewAmount, 0, bankAccountLink);
};

// Function to create an exported amount transaction
export const createExportedAmountTransaction = async (exportedAmount: number, transactionHash: string): Promise<string> => {
  const date = await fetchCurrentDatePST();
  const transactionLink = `https://www.blockchain.com/explorer/transactions/btc/${transactionHash}`;
  return createTransactionString(date, exportedAmount, 0, transactionLink);
};
  // Manually set the date
  updateManualDate('07/20/24'); // Set the manual date to 07/20/24