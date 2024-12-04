const { ethers } = require("ethers");
// Import Hardhat environment
require("@nomicfoundation/hardhat-toolbox");

const provider = new ethers.providers.JsonRpcProvider("https://rpc-mumbai.maticvigil.com");

console.log("Provider initialized:", provider);

const wbtcAddress = "0xYourWBTCContractAddress";
const swapperAddress = "0xYourSwapperContractAddress";

// Ensure ABI arrays are properly defined
const wbtcAbi: never[] = [/* ABI for WBTC */];
const swapperAbi: never[] = [/* ABI for Swapper */];

// Initialize contracts
const signer = provider.getSigner(); // Assuming you’re testing with a signer
const wbtcContract = new ethers.Contract(wbtcAddress, wbtcAbi, signer);
const swapperContract = new ethers.Contract(swapperAddress, swapperAbi, signer);

const mintWBTC = async (address: any, amount: { toString: () => any; }) => {
    const tx = await wbtcContract.mint(address, ethers.utils.parseUnits(amount.toString(), 18));
    await tx.wait();
};

const swapWBTCtoUSDC = async (amount: number) => {
    const tx = await swapperContract.swapWBTCtoUSDC(ethers.utils.parseUnits(amount.toString(), 18));
    await tx.wait();
};

const swapUSDCtoWBTC = async (amount: number) => {
    const tx = await swapperContract.swapUSDCtoWBTC(ethers.utils.parseUnits(amount.toString(), 18));
    await tx.wait();
};

console.log("Test setup complete.");