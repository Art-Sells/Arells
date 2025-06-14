import { HardhatUserConfig } from "hardhat/config";
import 'dotenv/config';
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";

 const privateKey = process.env.ARELLS_PRIVATE_KEY || "";
 const projectId: string = "4885ed01637e4a6f91c2c7fcd1714f68";

 const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      { version: "0.8.20" }, // For MASSTester.sol
      { version: "0.7.6" },  // For Uniswap V3 libraries
    ],
  },
  networks: {
    base: {
      url: `https://base-mainnet.infura.io/v3/${projectId}`,
      accounts: [privateKey],
    },
  },
};

export default config;
