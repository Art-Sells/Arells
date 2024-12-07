// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract aBTC is ERC20 {
    address public owner;
    uint256 public totalMinted;

    constructor() ERC20("Wrapped Bitcoin as Arells Bitcoin", "WBTC~aBTC") {
        owner = msg.sender;
        totalMinted = 0;
    }

    function mint(uint256 arellsBTC, uint256 acVactTas) external {
        require(msg.sender == owner, "Only owner can mint");

        // Scale BTC to integer (assuming 1 BTC = 1e8 units in Ethereum)
        uint256 scaledAmountToMint = (arellsBTC * 1e8) - (acVactTas * 1e8);  // Convert to satoshis

        // Prevent minting if the amount is less than the threshold (0.00001 BTC)
        require(scaledAmountToMint >= 1e3, "Amount to mint is too small");

        totalMinted += scaledAmountToMint;

        _mint(owner, scaledAmountToMint);  // Mint the scaled amount
    }
}