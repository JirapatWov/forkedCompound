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

const privateKeyLiquidator = config.privateKeyLiquidator;
const walletLiquidator = new ethers.Wallet(privateKeyLiquidator, provider);
const myWalletLiquidatorAddress = walletLiquidator.address;

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

    const a = config.transferAmount.toString();
    const transferAmountFinal = BigNumber.toBn(a, underlyingDecimals);
    let tx = await underlying.approve(
      myWalletAddress, transferAmountFinal.toString()
    );
    await tx.wait(1); // wait until the transaction has 1 confirmation on the blockchain
    const transfer = await underlying.transferFrom(myWalletAddress, myWalletLiquidatorAddress, transferAmountFinal.toString());

    console.log('........................');
    console.log('........................');
    console.log('........................');

    let myWalletEthBalance2 = await provider.getBalance(myWalletAddress) / 1e18;
    let myWalletCEthBalance2 = await cEth.callStatic.balanceOf(myWalletAddress) / 1e8;
    let myWalletCTokenBalance2 = await cToken.callStatic.balanceOf(myWalletAddress) / 1e8;
    let myWalletUnderlyingBalance2 = await underlying.callStatic.balanceOf(myWalletAddress) / Math.pow(10, underlyingDecimals);

    console.log("My Wallet's  ETH Balance:", myWalletEthBalance2);
    console.log("My Wallet's cETH Balance:", myWalletCEthBalance2);
    console.log(`My Wallet's  ${assetName} Balance:`, myWalletUnderlyingBalance2);
    console.log(`My Wallet's c${assetName} Balance:`, myWalletCTokenBalance2);
  });
};

const main = async () => {
  await logBalances();
};

main().catch((err) => {
  console.error('ERROR:', err);
});