// core import
const config = require('../config.json');
const address = require('../address.json');
const ethers = require('ethers');
const provider = new ethers.providers.JsonRpcProvider(`http://${config.ip}:${config.port}`);
const { cEthAbi, comptrollerAbi, priceFeedAbi, cErcAbi, erc20Abi } = require('../customAbi/contracts.json');
const { abi } = require('../artifacts/contracts/SimplePriceOracle.sol/SimplePriceOracle.json');
const BigNumber = require('evm-bn');

// page function
const privateKey = config.privateKey;
const wallet = new ethers.Wallet(privateKey, provider);

const SimplePriceOracle = new ethers.Contract(address.SimplePriceOracle, abi, wallet);

const main = async () => {

  // before run this script make sure that your borrow balance is low enough (near 0)
  // make liquidity by dropping JPT price (oldPrice / 2)
  const setPriceJPT = await SimplePriceOracle.setDirectPrice(address.JPT, '665000000');

  console.log('Finish Make liquidity...');

};

main().catch((err) => {
  console.error('ERROR:', err);
});