require("@nomiclabs/hardhat-waffle");
const fs = require('fs');
// const infuraId = fs.readFileSync(".infuraid").toString().trim() || "";
const privateKey = fs.readFileSync(".secret").toString();
//const projectId="92d451dad4924a55be3ebeab3cade25e"
const projectId="5d2750ac4f6c2a96f88ad06472c5d3a0"

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337
    },
    
    mumbai: {
      // Infura
       url: `https://polygon-mumbai.infura.io/v3/92d451dad4924a55be3ebeab3cade25e`,
      //url: "https://rpc-mumbai.matic.today",
      accounts: [privateKey]
    },
    /*matic: {
      // Infura
      // url: `https://polygon-mainnet.infura.io/v3/${infuraId}`,
      url: "https://rpc-mainnet.maticvigil.com",
      accounts: [process.env.privateKey]
    }
    */
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};

