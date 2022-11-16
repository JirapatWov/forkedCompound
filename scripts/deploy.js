const { ethers } = require("hardhat");
const fs = require('fs');
const config = require('../config.json');

async function main() {

  const WhitePaperInterestRateModel1 = await ethers.getContractFactory("WhitePaperInterestRateModel");
  const WhitePaperInterestRateModel = await WhitePaperInterestRateModel1.deploy(0, '200000000000000000');
  console.log("WhitePaperInterestRateModel Deployed to ", WhitePaperInterestRateModel.address);

  const Comptroller1 = await ethers.getContractFactory("Comptroller");
  const Comptroller = await Comptroller1.deploy();
  console.log("Comptroller Deployed to ", Comptroller.address);

  const SimplePriceOracle1 = await ethers.getContractFactory("SimplePriceOracle");
  const SimplePriceOracle = await SimplePriceOracle1.deploy();
  console.log("SimplePriceOracle Deployed to ", SimplePriceOracle.address);

  const Comp1 = await ethers.getContractFactory("Comp");
  const Comp = await Comp1.deploy(config.adminAddress);
  console.log("Comp Deployed to ", Comp.address);

  const JumpRateModel1 = await ethers.getContractFactory("JumpRateModel");
  const JumpRateModel = await JumpRateModel1.deploy('25000000000000000', '312500000000000000', '6250000000000000000', '800000000000000000');
  console.log("JumpRateModel Deployed to ", JumpRateModel.address);

  const CErc20Delegate1 = await ethers.getContractFactory("CErc20Delegate");
  const CErc20Delegate = await CErc20Delegate1.deploy();
  console.log("CErc20Delegate Deployed to ", CErc20Delegate.address);

  const Unitroller1 = await ethers.getContractFactory("Unitroller");
  const Unitroller = await Unitroller1.deploy();
  console.log("Unitroller Deployed to ", Unitroller.address);

  const _setPendingImplementation = await Unitroller._setPendingImplementation(Comptroller.address);
  const _acceptImplementation = await Unitroller._acceptImplementation();
  const _become = await Comptroller._become(Unitroller.address);
  
  const CEther1 = await ethers.getContractFactory("CEther");
  const CEther = await CEther1.deploy(Unitroller.address, WhitePaperInterestRateModel.address, '200000000000000000000000000', 'Compound Ether', 'cETH', '8', config.adminAddress);
  console.log("CEther Deployed to ", CEther.address);

  const JPT1 = await ethers.getContractFactory("JPT");
  const JPT = await JPT1.deploy('20000000000000000000000000');
  console.log("JPT Deployed to ", JPT.address);

  const cJPT1 = await ethers.getContractFactory("CErc20Delegator");
  const cJPT = await cJPT1.deploy(JPT.address, Unitroller.address, JumpRateModel.address, '200000000000000000000000000', 'Jirapat Token', 'cJPT', '8', config.adminAddress, CErc20Delegate.address, '0x00');
  console.log("cJPT Deployed to ", cJPT.address);

  // auto create json file for all contract address
  let data = { 
    WhitePaperInterestRateModel: WhitePaperInterestRateModel.address,
    Comptroller: Comptroller.address, 
    SimplePriceOracle: SimplePriceOracle.address,
    Comp: Comp.address,
    JumpRateModel: JumpRateModel.address,
    CErc20Delegate: CErc20Delegate.address,
    Unitroller: Unitroller.address,
    CEther: CEther.address,
    JPT: JPT.address,
    cJPT: cJPT.address
  };
  let dataPrepare = JSON.stringify(data);
  fs.writeFileSync('address.json', dataPrepare);

}

main()
    .then(() => process.exit(0))
    .catch(error =>{
        console.error(error);
        process.exit(1);
    })