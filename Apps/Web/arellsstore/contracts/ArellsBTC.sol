// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract aBTC is ERC20, Ownable {
    constructor() ERC20("Arells Bitcoin", "aBTC") {}

    // Mint new aBTC tokens (Only Owner)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // Burn aBTC tokens (Only Owner)
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}