// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MASSsmartContract {
    address public owner;
    ERC20 public wbtc;
    ERC20 public usdc;

    constructor(address _wbtc, address _usdc) {
        owner = msg.sender;
        wbtc = ERC20(_wbtc);
        usdc = ERC20(_usdc);
    }

    function swapWBTCtoUSDC(uint256 amount) external {
        require(wbtc.transferFrom(msg.sender, address(this), amount), "WBTC transfer failed");
        uint256 usdcAmount = getUSDCEquivalent(amount);
        usdc.transfer(msg.sender, usdcAmount);
    }

    function swapUSDCtoWBTC(uint256 amount) external {
        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        uint256 wbtcAmount = getWBTCEquivalent(amount);
        wbtc.transfer(msg.sender, wbtcAmount);
    }

    function getUSDCEquivalent(uint256 wbtcAmount) public pure returns (uint256) {
        return wbtcAmount * 1000; // Example: 1 WBTC = 1000 USDC
    }

    function getWBTCEquivalent(uint256 usdcAmount) public pure returns (uint256) {
        return usdcAmount / 1000; // Example: 1000 USDC = 1 WBTC
    }
}