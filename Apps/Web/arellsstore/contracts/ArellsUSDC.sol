// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract aUSDC is ERC20, Ownable {
    constructor() ERC20("Arells USDC", "aUSDC") {}

    // Mint new aUSDC tokens (Only Owner)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // Burn aUSDC tokens (Only Owner)
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}