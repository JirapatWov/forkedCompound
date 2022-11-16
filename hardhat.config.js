require('@nomiclabs/hardhat-waffle');
require('solidity-coverage');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.10",
  networks: {
    hardhat: {
      forking: {
        url: "https://mainnet.infura.io/v3/2380ad1e6f4d48fe930bb8e0f71336b9",
      },
      gasPrice: 0,
      initialBaseFeePerGas: 0,
      loggingEnabled: true,
      allowUnlimitedContractSize: true,
      chainId: 1,
    }
  }
};