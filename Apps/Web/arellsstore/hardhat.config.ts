import "@nomiclabs/hardhat-waffle";
import fs from "fs";
import { HardhatUserConfig } from "hardhat/config";

const privateKey: string = fs.readFileSync(".secret", "utf-8");
const projectId: string = "4885ed01637e4a6f91c2c7fcd1714f68";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    matic: {
      url: `https://polygon-mainnet.infura.io/v3/${projectId}`,
      accounts: [privateKey]
    },
  }
};

export default config;


// Below for testing purposes (check signer.tsx)

  // const projectId: string = "2b4efb18d4df4884bf0cd54db5719d7f";

  // const config: HardhatUserConfig = {
  //   solidity: "0.8.19",
  //   networks: {
  //     mumbai: {
  //       url: `https://polygon-mumbai.infura.io/v3/${projectId}`,
  //       accounts: [privateKey]
  //     },
  //   }
  // };

  // export default config;

