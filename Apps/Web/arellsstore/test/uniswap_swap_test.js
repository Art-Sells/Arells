import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// ✅ Uniswap Contract Addresses
const QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a";
const FACTORY_ADDRESS = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";

// ✅ Token Addresses
const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const CBBTC = "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf";
const AddressZero = "0x0000000000000000000000000000000000000000";

// ✅ Fetch ABI from BaseScan
async function fetchQuoterABI() {
    try {
        console.log("\n🔍 Fetching Quoter ABI from BaseScan...");
        const response = await axios.get(
            `https://api.basescan.org/api?module=contract&action=getabi&address=${QUOTER_ADDRESS}&apikey=${process.env.BASESCAN_API_KEY}`
        );

        if (response.data.status !== "1") throw new Error(`BaseScan API Error: ${response.data.message}`);

        const abi = typeof response.data.result === "string" ? JSON.parse(response.data.result) : response.data.result;
        if (!Array.isArray(abi)) {
            throw new Error("Fetched ABI is not an array. Possible malformed ABI.");
        }

        console.log(`✅ ABI Fetched Successfully: ${abi.length} functions loaded.`);
        return abi;
    } catch (error) {
        console.error("❌ Failed to fetch ABI from BaseScan:", error.message);
        return null;
    }
}

async function main() {
    console.log("\n🚀 Debugging Uniswap Swap with Pool & Quoter Analysis...");

    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const userWallet = new ethers.Wallet(process.env.PRIVATE_KEY_TEST, provider);
    const balance = await provider.getBalance(userWallet.address);
    console.log(`💰 Wallet Balance: ${ethers.formatUnits(balance, "ether")} ETH`);

    // ✅ Fetch ABI
    const quoterABI = await fetchQuoterABI();
    if (!quoterABI) {
        console.error("❌ ERROR: Quoter ABI is invalid or empty.");
        return;
    }

    // ✅ Create Interface
    const iface = new ethers.Interface(quoterABI);
    console.log("✅ Interface Parsed Successfully!");
    console.log("🔍 Interface Methods:", iface.fragments.map(f => f.name));

    // ✅ Create Quoter Contract
    const quoter = new ethers.Contract(QUOTER_ADDRESS, quoterABI, provider);
    console.log("✅ Quoter Contract Initialized!");

    // 🔍 Validate `quoteExactInputSingle` exists
    if (!quoter.interface.getFunction("quoteExactInputSingle")) {
        console.error("❌ ERROR: `quoteExactInputSingle` is NOT available in ABI!");
        console.log("🔍 Available functions:", quoter.interface.fragments.map(f => f.name));
        return;
    }
    console.log("\n✅ `quoteExactInputSingle` function exists in ABI!");

    // ✅ Struct Parameters
    const params = {
        tokenIn: USDC,
        tokenOut: CBBTC,
        amountIn: ethers.parseUnits("1", 6),
        fee: 500,
        sqrtPriceLimitX96: 0
    };

    // 🔥 **Manually Encode & Call Function**
    console.log("\n🔍 Manually Encoding Call...");
    const encodedData = iface.encodeFunctionData("quoteExactInputSingle", [params]);
    console.log("🔍 Encoded Call Data:", encodedData);

    try {
        // ✅ **Using `provider.call()`**
        const rawResponse = await provider.call({ to: QUOTER_ADDRESS, data: encodedData });
        console.log("✅ Raw Response:", rawResponse);

        // ✅ **Decode Response**
        const decoded = iface.decodeFunctionResult("quoteExactInputSingle", rawResponse);
        console.log("✅ Decoded Output:", decoded);

        // 🎯 **Final Output**
        console.log("\n🎯 Final Swap Estimate:");
        console.log(`   - Amount Out: ${ethers.formatUnits(decoded[0], 8)} CBBTC`);
        console.log(`   - sqrtPriceX96After: ${decoded[1]}`);
        console.log(`   - Initialized Ticks Crossed: ${decoded[2]}`);
        console.log(`   - Gas Estimate: ${decoded[3]}`);
    } catch (error) {
        console.error("❌ Raw Encoding Call Failed:", error.message);
    }
}

main().catch(console.error);