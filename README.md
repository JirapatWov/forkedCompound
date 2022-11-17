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

#### Now you app is ready...

> You can try playing with functions with test script


have a nice day...
