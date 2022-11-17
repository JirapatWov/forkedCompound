const { expect } = require("chai");
const BigNumber = require('evm-bn');

describe("Compound", function () {
    let owner, player1, player2, liquidator;
    let comptroller, oracle, CEther, JPT, cJPT;
    before(async () => {
        [owner, player1, player2, liquidator] = await ethers.getSigners();
  
        const WhitePaperInterestRateModel1 = await ethers.getContractFactory("WhitePaperInterestRateModel");
        const WhitePaperInterestRateModel = await WhitePaperInterestRateModel1.deploy(
            0, 
            '200000000000000000'
        );

        const Comptroller1 = await ethers.getContractFactory("Comptroller");
        const Comptroller = await Comptroller1.deploy();

        const SimplePriceOracle1 = await ethers.getContractFactory("SimplePriceOracle");
        oracle = await SimplePriceOracle1.deploy();

        const Comp1 = await ethers.getContractFactory("Comp");
        const Comp = await Comp1.deploy(owner.address);

        const JumpRateModel1 = await ethers.getContractFactory("JumpRateModel");
        const JumpRateModel = await JumpRateModel1.deploy(
            '25000000000000000', 
            '312500000000000000', 
            '6250000000000000000', 
            '800000000000000000'
        );

        const CErc20Delegate1 = await ethers.getContractFactory("CErc20Delegate");
        const CErc20Delegate = await CErc20Delegate1.deploy();

        const Unitroller1 = await ethers.getContractFactory("Unitroller");
        const Unitroller = await Unitroller1.deploy();

        const _setPendingImplementation = await Unitroller._setPendingImplementation(Comptroller.address);
        const _acceptImplementation = await Unitroller._acceptImplementation();
        const _become = await Comptroller._become(Unitroller.address);
        comptroller = Comptroller.attach(Unitroller.address);
        
        const CEther1 = await ethers.getContractFactory("CEther");
        CEther = await CEther1.deploy(
            Unitroller.address, 
            WhitePaperInterestRateModel.address, 
            '200000000000000000000000000', 
            'Compound Ether', 
            'cETH', 
            '8', 
            owner.address
        );

        const JPT1 = await ethers.getContractFactory("JPT");
        JPT = await JPT1.deploy(
            '20000000000000000000000000'
        );

        const cJPT1 = await ethers.getContractFactory("CErc20Delegator");
        cJPT = await cJPT1.deploy(
            JPT.address, 
            Unitroller.address, 
            JumpRateModel.address, 
            '200000000000000000000000000', 
            'Jirapat Token', 
            'cJPT', 
            '8', 
            owner.address, 
            CErc20Delegate.address, 
            '0x00'
        );

        // support market
        await comptroller._supportMarket(CEther.address);
        await comptroller._supportMarket(cJPT.address);

        // set price cJPT => 1,000 USD
        await oracle.setDirectPrice(JPT.address, '1000000000');
        await oracle.setDirectPrice(
            '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', 
            '2000000000');

        // set priceOracle to simplePriceOracle
        await comptroller._setPriceOracle(oracle.address);

        // set Collateral Factor to 80%
        await comptroller._setCollateralFactor(
            cJPT.address, 
            '800000000000000000'
        );
        await comptroller._setCollateralFactor(
            CEther.address, 
            '800000000000000000'
        );

        // set Liquidation Incentive to 1.08
        await comptroller._setLiquidationIncentive(
            '1080000000000000000'
        );

        // set Close Factor to 85%
        await comptroller._setCloseFactor(
            '850000000000000000'
        );
    })

    it("can supply ETH", async function () {
        // Mint some cETH by supplying ETH to the Compound Protocol
        let tx = await CEther.connect(player1).mint({
            value: ethers.utils.parseUnits('1', 'ether')
        });
        let cETHBalance = CEther.balanceOf(player1.address);
        await expect(tx).to.emit(CEther, "Mint")
    });

    it("can supply JPT", async function () {
        // Tell the contract to allow 10 tokens to be taken by the cToken contract
        const underlyingTokensToSupply = '10';
        const underlyingTokensToSupplyBN = BigNumber.toBn(underlyingTokensToSupply, 18);
        let txJPT = await JPT.connect(owner).approve(
            cJPT.address,
            underlyingTokensToSupplyBN 
        );
        // Mint cTokens by supplying underlying tokens to the Compound Protocol
        txJPT = cJPT.connect(owner).mint(underlyingTokensToSupplyBN);
        await expect(txJPT).to.emit(cJPT, "Mint")
    });

    it("can redeem ETH", async function () {
        const amountToRedeem = '1';
        const amountToRedeemBN = BigNumber.toBn(amountToRedeem, 8);
        let txRedeem = CEther.connect(player1).redeem(amountToRedeemBN);
        await expect(txRedeem).to.emit(CEther, "Redeem")
    });

    it("can redeem JPT", async function () {
        const amountToRedeemJPT = '1';
        const amountToRedeemJPTBN = BigNumber.toBn(amountToRedeemJPT, 8);
        let txRedeemJPT = cJPT.connect(owner).redeem(amountToRedeemJPTBN);
        await expect(txRedeemJPT).to.emit(cJPT, "Redeem")
    });

    it("can borrow ETH", async function () {
        let markets = [CEther.address, cJPT.address];
        let enterMarkets = await comptroller.enterMarkets(markets);
        let borrow = CEther.connect(owner).borrow(ethers.utils.parseEther('0.35'));
        await expect(borrow).to.emit(CEther, "Borrow")
    });

    it("can borrow JPT", async function () {
        let markets = [CEther.address, cJPT.address];
        let enterMarkets = await comptroller.connect(player1).enterMarkets(markets);
        const borrowA = '1.5';
        const borrowABN = BigNumber.toBn(borrowA, 18);
        let borrowJPT = cJPT.connect(player1).borrow(borrowABN);
        await expect(borrowJPT).to.emit(cJPT, "Borrow")
    });

    it("can make Liquidity", async function () {
        // make owner account underwate by dropping JPT price
        await oracle.setDirectPrice(
            '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', 
            '500000000');

        // transfer JPT to Liquidator (Prepare for liquidity)
        const transferAmountFinal = BigNumber.toBn('200', 18);
        let tx = await JPT.connect(owner).approve(
            owner.address, 
            transferAmountFinal.toString()
        );
        const transfer = await JPT.connect(owner).transferFrom(
            owner.address, 
            liquidator.address, 
            transferAmountFinal.toString()
        );
        let markets2 = [cJPT.address, CEther.address];
        let enterMarkets2 = await comptroller.connect(liquidator).enterMarkets(markets2);

        // call liquidity
        const liquidityAmountFinal = BigNumber.toBn('1',8);

        let txa = await JPT.connect(liquidator).approve(
            cJPT.address, 
            liquidityAmountFinal.toString()
        );
        let txLiquid = cJPT.connect(liquidator).liquidateBorrow(
            player1.address, 
            liquidityAmountFinal.toString(), 
            cJPT.address
        );
        await expect(txLiquid).to.emit(cJPT, "LiquidateBorrow")
    });
  });