const hre = require("hardhat");

async function main() {
    // Deploy WBTC contract
    const WBTC = await hre.ethers.getContractFactory("aBTC");
    const wbtc = await WBTC.deploy();
    await wbtc.deployed();
    console.log("aBTC deployed to:", wbtc.address);

    // Replace with the USDC contract address on Mumbai Testnet
    const usdcAddress = "0xYourUSDCContractAddress";

    // Deploy TokenSwapper contract
    const TokenSwapper = await hre.ethers.getContractFactory("TokenSwapper");
    const tokenSwapper = await TokenSwapper.deploy(wbtc.address, usdcAddress);
    await tokenSwapper.deployed();
    console.log("TokenSwapper deployed to:", tokenSwapper.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });