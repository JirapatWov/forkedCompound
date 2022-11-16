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
const myWalletAddress = wallet.address;

// Mainnet Contract for cETH
const cEthAddress = address.CEther;
const cEth = new ethers.Contract(cEthAddress, cEthAbi, wallet);

// Mainnet Contract for Compound's Comptroller
const comptrollerAddress = address.Unitroller;
const comptroller = new ethers.Contract(comptrollerAddress, comptrollerAbi, wallet);

// Mainnet Contract for the Open Price Feed
const priceFeedAddress = address.SimplePriceOracle;
const priceFeed = new ethers.Contract(priceFeedAddress, priceFeedAbi, wallet);

// Mainnet address of underlying token
const underlyingAddress = address.JPT; // JPT
const underlying = new ethers.Contract(underlyingAddress, erc20Abi, wallet);

// Mainnet address for a cToken (cJPT)
const cTokenAddress = address.cJPT; // cJPT
const cToken = new ethers.Contract(cTokenAddress, cErcAbi, wallet);
const assetName = 'JPT'; // for the log output lines
const underlyingDecimals = 18; // Number of decimals defined in this ERC20 token's contract

const logBalances = () => {
  return new Promise(async (resolve, reject) => {
    let myWalletEthBalance = await provider.getBalance(myWalletAddress) / 1e18;
    let myWalletCEthBalance = await cEth.callStatic.balanceOf(myWalletAddress) / 1e8;
    let myWalletUnderlyingBalance = await underlying.callStatic.balanceOf(myWalletAddress) / Math.pow(10, underlyingDecimals);

    console.log("My Wallet's  ETH Balance:", myWalletEthBalance);
    console.log("My Wallet's cETH Balance:", myWalletCEthBalance);
    console.log(`My Wallet's  ${assetName} Balance:`, myWalletUnderlyingBalance);

    resolve();
  });
};

const main = async () => {
  await logBalances();

  const ethToSupplyAsCollateral = 10; // set number of Collateral you want to supply

  console.log('\nSupplying ETH to the protocol as collateral (you will get cETH in return)...\n');
  let mint = await cEth.mint({
    value: (ethToSupplyAsCollateral * 1e18).toString()
  });

  await logBalances();

  console.log('\nEntering market (via Comptroller contract) for ETH (as collateral)...');
  let markets = [ cEthAddress ]; // This is the cToken contract(s) for your collateral
  let enterMarkets = await comptroller.enterMarkets(markets);
  await enterMarkets.wait(1);

  console.log('Calculating your liquid assets in the protocol...');
  let { 1:liquidity } = await comptroller.callStatic.getAccountLiquidity(myWalletAddress);
  liquidity = liquidity / 1e6;

  console.log('Fetching cETH collateral factor...');
  let { 1:collateralFactor } = await comptroller.callStatic.markets(cEthAddress);
  collateralFactor = (collateralFactor / 1e18) * 100; // Convert to percent

  console.log(`Fetching ${assetName} price from the price feed...`);
  let underlyingPriceInUsd = await priceFeed.callStatic.getUnderlyingPrice(cTokenAddress);
  underlyingPriceInUsd = underlyingPriceInUsd / 1e6; // Price feed provides price in USD with 6 decimal places

  console.log(`Fetching borrow rate per block for ${assetName} borrowing...`);
  let borrowRate = await cToken.callStatic.borrowRatePerBlock();
  borrowRate = borrowRate / Math.pow(10, underlyingDecimals);

  console.log(`\nYou have ${liquidity} of LIQUID assets (worth of USD) pooled in the protocol.`);
  console.log(`You can borrow up to ${collateralFactor}% of your TOTAL collateral supplied to the protocol as ${assetName}.`);
  console.log(`1 ${assetName} == ${underlyingPriceInUsd.toFixed(6)} USD`);
  console.log(`You can borrow up to ${liquidity/underlyingPriceInUsd} ${assetName} from the protocol.`);
  console.log(`NEVER borrow near the maximum amount because your account will be instantly liquidated.`);
  console.log(`\nYour borrowed amount INCREASES (${borrowRate} * borrowed amount) ${assetName} per block.\nThis is based on the current borrow rate.\n`);

  const underlyingToBorrow = config.JPTToBorrow; // set number of token you want to borrow
  console.log(`Now attempting to borrow ${underlyingToBorrow} ${assetName}...`);
  const scaledUpBorrowAmount = (underlyingToBorrow * Math.pow(10, underlyingDecimals)).toString();
  const trx = await cToken.borrow(scaledUpBorrowAmount);
  await trx.wait(1);

  await logBalances();

  console.log(`\nFetching ${assetName} borrow balance from c${assetName} contract...`);
  let balance = await cToken.callStatic.borrowBalanceCurrent(myWalletAddress);
  balance = balance / Math.pow(10, underlyingDecimals);
  console.log(`Borrow balance is ${balance} ${assetName}`);

};

main().catch((err) => {
  console.error('ERROR:', err);
});