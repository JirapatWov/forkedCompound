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
    let myWalletCTokenBalance = await cToken.callStatic.balanceOf(myWalletAddress) / 1e8;
    let myWalletUnderlyingBalance = await underlying.callStatic.balanceOf(myWalletAddress) / Math.pow(10, underlyingDecimals);

    console.log("My Wallet's  ETH Balance:", myWalletEthBalance);
    console.log(`My Wallet's c${assetName} Balance:`, myWalletCTokenBalance);
    console.log(`My Wallet's  ${assetName} Balance:`, myWalletUnderlyingBalance);

    resolve();
  });
};

const main = async () => {
  await logBalances();

  const ethToRepay = config.ethToRepay; // set number of ETH you want to repay

  console.log('\nFetching your ETH borrow balance from cETH contract...');
  let balance = await cEth.callStatic.borrowBalanceCurrent(myWalletAddress);
  balance = balance / 1e18; // because DAI is a 1e18 scaled token.
  console.log(`Borrow balance is ${balance} ETH`);

  console.log(`\nThis part is when you do something with those borrowed assets!\n`);

  console.log(`Now repaying the borrow...`);
  
  const repayBorrow = await cEth.repayBorrow({
    value: ethers.utils.parseEther(ethToRepay.toString())
  });
  const repayBorrowResult = await repayBorrow.wait(1);

  failure = repayBorrowResult.events.find(_ => _.event === 'Failure');
  if (failure) {
    const errorCode = failure.args.error;
    console.error(`repayBorrow error, code ${errorCode}`);
    process.exit(1);
  }

  console.log(`\nBorrow repaid.\n`);
  await logBalances();

};

main().catch((err) => {
  console.error('ERROR:', err);
});