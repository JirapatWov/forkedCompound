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

  let underlyingAsCollateral = 1; // set number of Collateral you want to supply

  // Convert the token amount to a scaled up number, then a string.
  underlyingAsCollateral = underlyingAsCollateral * Math.pow(10, underlyingDecimals);
  underlyingAsCollateral = underlyingAsCollateral.toString();

  console.log(`\nApproving ${assetName} to be transferred from your wallet to the c${assetName} contract...\n`);
  const approve = await underlying.approve(cTokenAddress, underlyingAsCollateral);
  await approve.wait(1);

  console.log(`Supplying ${assetName} to the protocol as collateral (you will get c${assetName} in return)...\n`);
  let mint = await cToken.mint(underlyingAsCollateral);
  const mintResult = await mint.wait(1);

  let failure = mintResult.events.find(_ => _.event === 'Failure');
  if (failure) {
    const errorCode = failure.args.error;
    throw new Error(
      `See https://compound.finance/docs/ctokens#ctoken-error-codes\n` +
      `Code: ${errorCode}\n`
    );
  }

  await logBalances();

  console.log('\nEntering market (via Comptroller contract) for ETH (as collateral)...');
  let markets = [cTokenAddress]; // This is the cToken contract(s) for your collateral
  let enterMarkets = await comptroller.enterMarkets(markets);
  await enterMarkets.wait(1);

  console.log('Calculating your liquid assets in the protocol...');
  let {1:liquidity} = await comptroller.callStatic.getAccountLiquidity(myWalletAddress);
  liquidity = (+liquidity / 1e6).toString();

  console.log(`Fetching the protocol's ${assetName} collateral factor...`);
  let {1:collateralFactor} = await comptroller.callStatic.markets(cTokenAddress);
  collateralFactor = (collateralFactor / Math.pow(10, underlyingDecimals)) * 100; // Convert to percent

  console.log(`Fetching ${assetName} price from the price feed...`);
  let underlyingPriceInUsd = await priceFeed.callStatic.getUnderlyingPrice(cTokenAddress);
  underlyingPriceInUsd = underlyingPriceInUsd / 1e6; // Price feed provides price in USD with 6 decimal places

  console.log(`\nYou have ${liquidity} of LIQUID assets (worth of USD) pooled in the protocol.`);
  console.log(`You can borrow up to ${collateralFactor}% of your TOTAL assets supplied to the protocol as ETH.`);
  console.log(`1 ${assetName} == ${underlyingPriceInUsd.toFixed(6)} USD`);
  console.log(`You can borrow up to ${liquidity} USD worth of assets from the protocol.`);
  console.log(`NEVER borrow near the maximum amount because your account will be instantly liquidated.`);

  // Let's try to borrow 0.002 ETH (or another amount far below the borrow limit)
  const ethToBorrow = config.ethToBorrow;
  console.log(`\nNow attempting to borrow ${ethToBorrow} ETH...`);
  const borrow = await cEth.borrow(ethers.utils.parseEther(ethToBorrow.toString()));
  const borrowResult = await borrow.wait(1);

  if (isNaN(borrowResult)) {
    console.log(`\nETH borrow successful.\n`);
  } else {
    throw new Error(
      `See https://compound.finance/docs/ctokens#ctoken-error-codes\n` +
      `Code: ${borrowResult}\n`
    );
  }

  await logBalances();

  console.log('\nFetching your ETH borrow balance from cETH contract...');
  let balance = await cEth.callStatic.borrowBalanceCurrent(myWalletAddress);
  balance = balance / 1e18; // because DAI is a 1e18 scaled token.
  console.log(`Borrow balance is ${balance} ETH`);
};

main().catch((err) => {
  console.error('ERROR:', err);
});