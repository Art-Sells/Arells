const hre = require("hardhat");

async function main() {
    // Deploy WBTC contract
    const MASS = await hre.ethers.getContractFactory("MASSsmartContract");
    const mass = await MASS.deploy();
    await mass.waitForDeployment();
    console.log("MASS deployed to:", mass.target);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });