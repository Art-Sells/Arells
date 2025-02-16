import { expect } from "chai";
import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

describe("MASSTester Swap Test", function () {
    let massTester, tokenAContract, tokenBContract;
    let userWallet;
    let userAddress = "0xE6a1218F4E2F514a3fC215758D450AaC632B0DE3";
    let masstesterAddress = "0x97582f829eB649B908c53965B1A8611F5ae70133";

    let uniswapPool = "0xfBB6Eed8e7aa03B138556eeDaF5D271A5E1e43ef"; // USDC/CBBTC Pool
    let uniswapRouter = "0x2626664c2603336E57B271c5C0b26F421741e481"; // Uniswap V3 Router on Base

    before(async function () {
        console.log("\n🚀 Connecting to Deployed Contracts on Base...");

        userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, ethers.provider);
        console.log(`✅ Using Test Wallet: ${userWallet.address}`);

        const tokenA = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // USDC
        const tokenB = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf"; // CBBTC

        massTester = await ethers.getContractAt("MASSTester", masstesterAddress, userWallet);
        console.log(`✅ Connected to MASSTester at: ${await massTester.getAddress()}`);

        tokenAContract = await ethers.getContractAt("IERC20", tokenA, userWallet);
        tokenBContract = await ethers.getContractAt("IERC20", tokenB, userWallet);

        console.log(`✅ Uniswap V3 Pool: ${uniswapPool}`);
        console.log(`✅ Uniswap V3 Router: ${uniswapRouter}`);
    });

    it("Should execute a zero-fee swap", async function () {
        console.log("\n🔄 Initiating Zero-Fee Swap...");

        const amountIn = ethers.parseUnits("5", 6); // 5 USDC
        console.log(`➡️ Swapping ${ethers.formatUnits(amountIn, 6)} USDC for CBBTC`);

        // ✅ Check Uniswap Pool Liquidity
        const poolContract = await ethers.getContractAt("IUniswapV3Pool", uniswapPool, ethers.provider);
        const poolLiquidity = await poolContract.liquidity();
        console.log(`💧 Uniswap Pool Liquidity: ${poolLiquidity}`);

        if (BigInt(poolLiquidity) === BigInt(0)) {
            throw new Error("❌ Uniswap Pool has no liquidity!");
        }

        // ✅ Check User's USDC Balance
        const userBalance = await tokenAContract.balanceOf(userAddress);
        console.log(`💰 User USDC Balance: ${ethers.formatUnits(userBalance, 6)}`);

        if (BigInt(userBalance) < BigInt(amountIn)) {
            throw new Error("❌ User does not have enough USDC for the test.");
        }

        // ✅ Check Current Allowance
        let currentAllowance = await tokenAContract.allowance(userAddress, masstesterAddress);
        console.log(`🔎 Current Allowance Before Approval: ${ethers.formatUnits(currentAllowance, 6)} USDC`);

        // ✅ Approve USDC
        console.log("🔄 Approving 5 USDC for MASSTester...");
        const approveTx = await tokenAContract.connect(userWallet).approve(masstesterAddress, amountIn, {
            gasPrice: ethers.parseUnits(".35", "gwei"), // Adjust gas price
        });
        await approveTx.wait();
        console.log("✅ 5 USDC Approved");

        // ✅ Perform Swap
        const tx = await massTester.connect(userWallet).executeZeroFeeSwap(amountIn, userAddress);
        await tx.wait();
        console.log("✅ Swap Executed Successfully");

        // ✅ Check Router's Balance (Uniswap must receive USDC)
        const routerBalance = await tokenAContract.balanceOf(uniswapRouter);
        console.log(`💡 Uniswap Router USDC Balance: ${ethers.formatUnits(routerBalance, 6)}`);

        // ✅ Check if the user received the output token
        const balanceAfter = await tokenBContract.balanceOf(userAddress);
        console.log(`💰 User received CBBTC: ${ethers.formatEther(balanceAfter)}`);

        expect(balanceAfter).to.be.gt(0);
    });
});