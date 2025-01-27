// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract aBTC is ERC20, Ownable {
    uint8 private _decimals = 8; // Match Bitcoin's decimals

    constructor(address initialOwner) ERC20("Arells Bitcoin", "aBTC") Ownable(initialOwner) {
        // Optionally mint an initial supply to the owner
        _mint(initialOwner, 0); // No initial supply
    }

    // Override decimals function to return 8
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    // Admin-only minting function
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // Admin-only burning function
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}