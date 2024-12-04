import { ethers } from "ethers";

const provider = new ethers.providers.JsonRpcProvider("https://rpc-mumbai.maticvigil.com");
const signer = provider.getSigner();

const wbtcAddress = "0xYourWBTCContractAddress";
const swapperAddress = "0xYourSwapperContractAddress";

const wbtcAbi = [...]; // ABI for WBTC contract
const swapperAbi = [...]; // ABI for Swapper contract

const wbtcContract = new ethers.Contract(wbtcAddress, wbtcAbi, signer);
const swapperContract = new ethers.Contract(swapperAddress, swapperAbi, signer);

const mintWBTC = async (address, amount) => {
    const tx = await wbtcContract.mint(address, ethers.utils.parseUnits(amount.toString(), 18));
    await tx.wait();
};

const swapWBTCtoUSDC = async (amount) => {
    const tx = await swapperContract.swapWBTCtoUSDC(ethers.utils.parseUnits(amount.toString(), 18));
    await tx.wait();
};

const swapUSDCtoWBTC = async (amount) => {
    const tx = await swapperContract.swapUSDCtoWBTC(ethers.utils.parseUnits(amount.toString(), 18));
    await tx.wait();
};