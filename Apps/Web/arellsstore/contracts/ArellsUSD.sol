// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract aUSD is ERC20, Ownable {
    uint8 private _decimals = 6; // Match USDC's decimals

    constructor(address initialOwner) ERC20("Arells USDC", "aUSDC") Ownable(initialOwner) {
        // Optionally mint an initial supply to the owner
        _mint(initialOwner, 0); // No initial supply
    }

    // Override decimals function to return 6
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    // Admin-only minting function
    function mint(address to, uint256 amount) external onlyOwner {
        require(amount > 0, "Cannot mint zero tokens");
        _mint(to, amount);
        
        // Debug log
        console.log("Minted aUSD:", amount, "to", to);
        console.log("New Balance:", balanceOf(to));
    }

    // Admin-only burning function
    function burn(address from, uint256 amount) external onlyOwner {
        require(amount > 0, "Cannot burn zero tokens");
        _burn(from, amount);
    }
}