const hre = require("hardhat");

async function main() {
    console.log("\n🚀 Deploying Contracts on Base...");

    // Define Uniswap V3 pool addresses on Base Mainnet
    const uniswapPool = "0xfBB6Eed8e7aa03B138556eeDaF5D271A5E1e43ef"; // USDC/CBBTC Pool
    const uniswapRouter = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; // Uniswap V3 Router
    const tokenA = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // USDC
    const tokenB = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf"; // CBBTC

    // Deploy UniswapTickHelper
    const TickHelper = await hre.ethers.getContractFactory("UniswapTickHelper");
    const tickHelper = await TickHelper.deploy();
    await tickHelper.waitForDeployment();
    console.log(`✅ UniswapTickHelper deployed at: ${await tickHelper.getAddress()}`);

    // Deploy MASSTester with the TickHelper Address
    const MASSTester = await hre.ethers.getContractFactory("MASSTester");
    const massTester = await MASSTester.deploy(
        uniswapPool,
        uniswapRouter,
        await tickHelper.getAddress(),
        tokenA,
        tokenB
    );
    await massTester.waitForDeployment();
    console.log(`✅ MASSTester deployed at: ${await massTester.getAddress()}`);

    console.log("\n🎯 Deployment Complete!");
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
});