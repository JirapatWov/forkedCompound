// core import
const config = require('../config.json');
const address = require('../address.json');
const ethers = require('ethers');
const provider = new ethers.providers.JsonRpcProvider(`http://${config.ip}:${config.port}`);
const { cEthAbi, comptrollerAbi, priceFeedAbi, cErcAbi, erc20Abi } = require('../customAbi/contracts.json');
const { abi } = require('../artifacts/contracts/SimplePriceOracle.sol/SimplePriceOracle.json');
const BigNumber = require('evm-bn');

// page function
const privateKey = config.privateKeyLiquidator;
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
    let myWalletCTokenBalance = await cToken.callStatic.balanceOf(myWalletAddress) / 1e8;
    let myWalletUnderlyingBalance = await underlying.callStatic.balanceOf(myWalletAddress) / Math.pow(10, underlyingDecimals);

    console.log("My Wallet's  ETH Balance:", myWalletEthBalance);
    console.log("My Wallet's cETH Balance:", myWalletCEthBalance);
    console.log(`My Wallet's  ${assetName} Balance:`, myWalletUnderlyingBalance);
    console.log(`My Wallet's c${assetName} Balance:`, myWalletCTokenBalance);

    console.log('........................');
    console.log('........................');
    console.log('........................');

    let balance = await cToken.callStatic.borrowBalanceCurrent(myWalletAddress);
    balance = balance / Math.pow(10, underlyingDecimals);
    console.log(`Borrow ${assetName} balance is ${balance} ${assetName}`);
    let balance2 = await cEth.callStatic.borrowBalanceCurrent(myWalletAddress);
    balance2 = balance2 / Math.pow(10, underlyingDecimals);
    console.log(`Borrow cETH balance is ${balance2} cETH`);

    let markets = [cTokenAddress]; // This is the cToken contract(s) for your collateral
    let enterMarkets = await comptroller.enterMarkets(markets);
    await enterMarkets.wait(1);
    let {1:liquidity} = await comptroller.callStatic.getAccountLiquidity(myWalletAddress);
    liquidity = (+liquidity / 1e6).toString();
    let {1:collateralFactor} = await comptroller.callStatic.markets(cTokenAddress);
    collateralFactor = (collateralFactor / Math.pow(10, underlyingDecimals)) * 100; // Convert to percent
    let underlyingPriceInUsd = await priceFeed.callStatic.getUnderlyingPrice(cTokenAddress);
    underlyingPriceInUsd = underlyingPriceInUsd / 1e6; // Price feed provides price in USD with 6 decimal places
    let borrowRate = await cEth.callStatic.borrowRatePerBlock();
    borrowRate = borrowRate / 1e18;

    console.log(`\nYou have ${liquidity} of LIQUID assets (worth of USD) pooled in the protocol.`);
    console.log(`You can borrow up to ${collateralFactor}% of your TOTAL assets supplied to the protocol as ETH.`);
    console.log(`1 ${assetName} == ${underlyingPriceInUsd.toFixed(6)} USD`);
    console.log(`You can borrow up to ${liquidity} USD worth of assets from the protocol.`);
    console.log(`NEVER borrow near the maximum amount because your account will be instantly liquidated.`);
    console.log(`\nYour borrowed amount INCREASES (${borrowRate} * borrowed amount) ETH per block.\nThis is based on the current borrow rate.`);

    resolve();
  });
};

const main = async () => {
  await logBalances();
};

main().catch((err) => {
  console.error('ERROR:', err);
});