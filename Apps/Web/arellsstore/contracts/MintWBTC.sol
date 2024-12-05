// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract aBTC is ERC20 {
    address public owner;

    // Tracks the total amount minted
    uint256 public totalMinted;

    constructor() ERC20("Wrapped Bitcoin as Arells Bitcoin", "WBTC~aBTC") {
        owner = msg.sender;
        totalMinted = 0;
    }

    function mint(uint256 arellsBTC, uint256 acVactTas) external {
        require(msg.sender == owner, "Only owner can mint");

        // Calculate the amount to mint in satoshis
        uint256 amountToMint = arellsBTC > acVactTas ? arellsBTC - acVactTas : 0;

        // Prevent minting if the amount is less than the threshold (0.00001 BTC = 1e3 satoshis)
        require(amountToMint >= 1e3, "Amount to mint is too small");

        totalMinted += amountToMint;

        _mint(owner, amountToMint);
    }
}