import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-toolbox";
import "@nomiclabs/hardhat-ethers";
import fs from 'fs';

const privateKey: string = fs.readFileSync('.secret', 'utf-8');
const projectId: string = "2b4efb18d4df4884bf0cd54db5719d7f";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    // hardhat: {
    //   chainId: 1337
    // },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${projectId}`,
      accounts: [privateKey]
    },
    // mainnet: {
    //   url: `https://polygon-mainnet.infura.io/v3/${projectId}`,
    //   accounts: [privateKey]
    // }
  }
};

export default config;
