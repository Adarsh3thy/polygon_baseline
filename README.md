# Blockchain Ticketing System
This project was created for our Master's Project at San Jose State University.

Advisor: Prof. Gheorghi Guzun

Team Members: Adarsh Narasimhamurthy, Nidhi Tholar Kuchur, Sachin Pothukuchi, Shreyas Kulkarni

### Description
An event ticketing system based completely on the blockchain.

This project built using JavaScript, Solidity and Next.js

The project also utilizes IPFS for storing event metadata and can be deployed on the Polygon testnet too. (Localchains work too)


### Running this project

To run this project locally, follow these steps.

1. Clone the project locally, change into the directory, and install the dependencies:

```sh
git clone https://github.com/dabit3/polygon-ethereum-nextjs-marketplace.git

cd polygon-ethereum-nextjs-marketplace

# install using NPM or Yarn
npm install

# or

yarn
```

2. Start the local Hardhat node

```sh
npx hardhat node
```

3. With the network running, open a seperate terminal and set private key
```sh
# copy a private key from the previous terminal or copy your wallet's private key
echo ${PRIVATE_KEY} >> .secret
```

4. Deploy the contracts to the local network

```sh
npx hardhat run scripts/deploy.js --network localhost
```

5. Start the app

```
npm run dev
```

### Configuration

To deploy to Polygon test or main networks or to add other Ethereum networks, update the configurations located in __hardhat.config.js__.
