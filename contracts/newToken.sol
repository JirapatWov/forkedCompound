//SPDX-License-Identifier: UNLICENSED

// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// This is the main building block for smart contracts.
contract JPT is ERC20 {
    constructor(uint256 initialSupply) ERC20("Jirapat Token", "JPT"){
        _mint(msg.sender, initialSupply);
    }
}