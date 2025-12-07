import axios from 'axios';

const DATE_API_URL = 'http://worldtimeapi.org/api/timezone/America/Los_Angeles';

let manualDate: string | null = null;

export const setManualDate = (date: string): void => {
  manualDate = date;
};

export const fetchCurrentDatePST = async (): Promise<string> => {
  try {
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

export const updateManualDate = async (): Promise<string> => {
  const currentDate = await fetchCurrentDatePST();
  setManualDate(currentDate);
  return currentDate;
};

export interface Transactions {
  soldAmount?: string | number;
  boughtAmount?: string | number;
  withdrewAmount?: string | number;
  exportedAmount?: string | number;
  parsedSoldAmount?: ParsedTransaction;
  parsedBoughtAmount?: ParsedTransaction;
  parsedWithdrewAmount?: ParsedTransaction;
  parsedExportedAmount?: ParsedTransaction;
  timestamp?: number; // Add timestamp field
}

export interface ParsedTransaction {
  date: string;
  bitcoinAmount: number;
  amount: number;
  link?: string;
}

const createTransactionString = (date: string, amount1: number, amount2: number): string => {
  return JSON.stringify({ date, bitcoinAmount: amount1, amount: amount2 });
};

const createTransactionStringTwo = (date: string, amount: number, link: string): string => {
  return JSON.stringify({ date, bitcoinAmount: amount, link });
};

const appendTransaction = async (email: string, newTransaction: Transactions): Promise<void> => {
  try {
    const response = await axios.get(`/api/fetchVavityAggregator?email=${email}`);
    const currentTransactions = response.data.transactions || [];
    const transactionsArray: Transactions[] = Array.isArray(currentTransactions) ? currentTransactions : [];
    const updatedTransactions = [...transactionsArray, newTransaction];
    const payload = {
      email,
      transactions: updatedTransactions,
    };
    await axios.post('/api/saveVavityAggregator', payload);
  } catch (error) {
    console.error('Error appending transaction:', error);
    throw new Error('Could not append transaction');
  }
};

export const createSoldAmountTransaction = async (email: string, bitcoinAmount: number, soldAmount: number): Promise<void> => {
  const date = await fetchCurrentDatePST();
  const transactionString = createTransactionString(date, bitcoinAmount, soldAmount);
  const newTransaction: Transactions = {
    soldAmount: transactionString,
    boughtAmount: '',
    withdrewAmount: '',
    exportedAmount: '',
    timestamp: Date.now(), // Add timestamp
  };
  await appendTransaction(email, newTransaction);
};

export const createBoughtAmountTransaction = async (email: string, bitcoinAmount: number, boughtAmount: number): Promise<void> => {
  const date = await fetchCurrentDatePST();
  const transactionString = createTransactionString(date, bitcoinAmount, boughtAmount);
  const newTransaction: Transactions = {
    soldAmount: '',
    boughtAmount: transactionString,
    withdrewAmount: '',
    exportedAmount: '',
    timestamp: Date.now(), // Add timestamp
  };
  await appendTransaction(email, newTransaction);
};

export const createWithdrewAmountTransaction = async (email: string, withdrewAmount: number): Promise<Transactions> => {
  const date = await fetchCurrentDatePST();
  const bankAccountLink = 'https://arells.com/bankaccount';
  const transactionString = createTransactionStringTwo(date, withdrewAmount, bankAccountLink);
  const newTransaction: Transactions = {
    soldAmount: '',
    boughtAmount: '',
    withdrewAmount: transactionString,
    exportedAmount: '',
    timestamp: Date.now(), // Add timestamp
  };
  await appendTransaction(email, newTransaction);
  return newTransaction; // Return the created transaction
};

export const createExportedAmountTransaction = async (email: string, exportedAmount: number, transactionHash: string): Promise<Transactions> => {
  const date = await fetchCurrentDatePST();
  const transactionLink = `${transactionHash}`;
  const transactionString = createTransactionStringTwo(date, exportedAmount, transactionLink);
  const newTransaction: Transactions = {
    soldAmount: '',
    boughtAmount: '',
    withdrewAmount: '',
    exportedAmount: transactionString,
    timestamp: Date.now(), // Add timestamp
  };
  await appendTransaction(email, newTransaction);
  return newTransaction; // Return the created transaction
};

// Example usage: Fetch and set the current date in PST without logging
(async () => {
  await updateManualDate();
})();