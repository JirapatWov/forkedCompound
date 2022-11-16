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

  // you can set new price here
  const setPriceJPT = await SimplePriceOracle.setDirectPrice(address.JPT, '1265000000');
  const setPriceCETH = await SimplePriceOracle.setDirectPrice(address.CEther, '2265000000000000000000');
  const setPriceCJPT = await SimplePriceOracle.setDirectPrice(address.cJPT, '265000000');

  console.log('Finish Set Price...');

};

main().catch((err) => {
  console.error('ERROR:', err);
});