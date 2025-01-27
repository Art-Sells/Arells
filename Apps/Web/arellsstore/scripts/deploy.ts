const hre = require("hardhat");


async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy MASS contract
    const MASS = await hre.ethers.getContractFactory("MASSsmartContract");
    const mass = await MASS.deploy();
    await mass.waitForDeployment();
    console.log("MASS deployed to:", mass.target);

    // Deploy aBTC
    const aBTC = await hre.ethers.getContractFactory("aBTC");
    const aBTCInstance = await aBTC.deploy();
    await aBTCInstance.waitForDeployment();
    console.log("aBTC deployed to:", aBTCInstance.address);

    // Deploy aUSDC
    const aUSDC = await hre.ethers.getContractFactory("aUSDC");
    const aUSDCInstance = await aUSDC.deploy();
    await aUSDCInstance.waitForDeployment();
    console.log("aUSDC deployed to:", aUSDCInstance.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });