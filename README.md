# forked Compound
_Project Forked Compound by Jirapat Wor_

### How to deploy forked compound?

Start with the following code

```
mrdir yourfolder
cd yourfolder
npm init -y
npx hardhat // Create an empty hardhat.config.js
npm install --save hardhat @nomiclabs/hardhat-ethers @nomiclabs/hardhat-waffle 
    chai ethereum-waffle solidity-coverage @openzeppelin/contracts evm-bn
```

#### Then Copy all files in zip to your folder

```
npm run local // start node
```

Then Setting config file in config.json

```
{
    "ip" : your ip address
    "port" : your port,
    "adminAddress" : your first public key on node,
    "privateKey": your first private key on node,
    "liquidatorAddress": public key (unlike adminAddress),
    "privateKeyLiquidator":private key (unlike admin),
    "ethToSupply": Number of ETH you want to supply,
    "JPTToSupply": Number of JPT you want to supply,
    "ethToBorrow": Number of ETH you want to borrow,
    "JPTToBorrow": Number of JPT you want to borrow,
    "ethToRepay": Number of ETH you want to repay,
    "JPTToRepay": Number of ETH you want to repay,
    "onlyBorrowETH": ETH you want to borrow without supply,
    "transferAmount": Number of JPT you want to Transfer,
    "liquidityAmount": Number of JPT you want to liquidate
}
```

Then run the following code to deploy

```
npm run build // compile
npm run deploy // deploy all contracts
// in this step address.json will auto created
// and custom ERC20 token name “JPT” will be created
// and supply token to adminAddress

npm run admin // set defualt values

// if you want to change price in priceOracle run
npm run setprice // set your price in script first
```

## Now you app is ready... let’s try using functions

#### Try to supply some ETH
```
npm run supplyeth
```
location : operation_scripts/supplyETH.js
#### Try to supply some JPT
```
npm run supplyerc
```
location : operation_scripts/supplyERC.js
#### Try to redeem all ETH
```
npm run redeemeth
```
location : operation_scripts/redeemETH.js
#### Try to redeem all JPT
```
npm run redeemerc
```
location : operation_scripts/redeemERC20.js
#### Try to borrow some ETH
```
npm run borroweth
```
location : operation_scripts/borrowETH.js
#### Try to borrow some JPT
```
npm run borrowerc
```
location : operation_scripts/borrowERC.js
#### Try to repay some ETH
```
npm run repayeth
```
location : operation_scripts/repayETH.js
#### Try to repay some JPT
```
npm run repayerc
```
location : operation_scripts/repayERC.js
#### Try to borrow ETH without supply collateral
```
npm run onlyborroweth
```
location : operation_scripts/onlyBorrowEth.js
#### Try to make liquidity situation
```
npm run makeliquid
```
location : operation_scripts/makeLiquidity.js
#### Try to make liquidity situation
```
npm run makeliquid
```
location : operation_scripts/makeLiquidity.js
#### Try to transfer JPT
```
npm run transfer
```
location : operation_scripts/transferJPT.js
#### Try to call liquidity
```
npm run callliquid
```
location : operation_scripts/callLiquidity.js
#### Try to check balance of main account
```
npm run checkbalance
```
location : operation_scripts/checkbalance.js
#### Try to check liquidator’s balance
```
npm run checkbalanceliquidator
```
location : operation_scripts/checkBalanceLiquidator.js


> if you want to test liquidity you need to run onlyborroweth to make your liquidity as low as possible (use checkbalance to checck your liquidity) then run makeliquid to drop JPT’s price by half. Now main account is underwater. After that, run transfer to transfer JPT to liquidator account and then callliquid to make liquidity


> Don’t forget to supply token to contract before run borrow function


have a nice day...
