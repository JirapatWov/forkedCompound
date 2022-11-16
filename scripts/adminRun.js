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

const comptrollerAddress = address.Unitroller;
const comptroller = new ethers.Contract(comptrollerAddress, comptrollerAbi, wallet);

const SimplePriceOracle = new ethers.Contract(address.SimplePriceOracle, abi, wallet);

const main = async () => {

  // support market
  let supportMarketsCEth = await comptroller._supportMarket(address.CEther);
  let supportMarketsCJPT = await comptroller._supportMarket(address.cJPT);

  // set price cJPT => 1,265 USD
  const setPriceJPT = await SimplePriceOracle.setDirectPrice(address.JPT, '1265000000');
  const setPricecETH = await SimplePriceOracle.setDirectPrice('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', '326500000000');

  // set priceOracle to simplePriceOracle
  let setPriceOracle = await comptroller._setPriceOracle(address.SimplePriceOracle);

  // set Collateral Factor to 80%
  let _setCollateralFactorCJPT = await comptroller._setCollateralFactor(address.cJPT, '800000000000000000');
  let _setCollateralFactorCEth = await comptroller._setCollateralFactor(address.CEther, '800000000000000000');

  // set Liquidation Incentive to 1.08
  let _setLiquidationIncentive = await comptroller._setLiquidationIncentive('1080000000000000000');

  // set Close Factor to 85%
  let _setCloseFactor = await comptroller._setCloseFactor('850000000000000000');

  console.log('Finish Admin Setting...');

};

main().catch((err) => {
  console.error('ERROR:', err);
});