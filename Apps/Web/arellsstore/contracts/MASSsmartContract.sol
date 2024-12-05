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

    event Supplicate(address indexed from, uint256 amount, string supplicateType);

    function supplicateWBTCtoUSDC(uint256 usdcAmount, uint256 bitcoinPrice) external {
        // Convert USDC amount to WBTC equivalent before proceeding
        uint256 wbtcEquivalent = getWBTCEquivalent(usdcAmount, bitcoinPrice);
        
        require(wbtc.transferFrom(msg.sender, address(this), wbtcEquivalent), "WBTC transfer failed");
        
        usdc.transfer(msg.sender, usdcAmount); // Transfer the entered USDC amount
        emit Supplicate(msg.sender, usdcAmount, "WBTC to USDC");
    }

    function supplicateUSDCtoWBTC(uint256 wbtcAmount, uint256 bitcoinPrice) external {
        // Convert WBTC amount to USDC equivalent before proceeding
        uint256 usdcEquivalent = getUSDCEquivalent(wbtcAmount, bitcoinPrice);
        
        require(usdc.transferFrom(msg.sender, address(this), usdcEquivalent), "USDC transfer failed");
        
        emit Supplicate(msg.sender, wbtcAmount, "USDC to WBTC");

        require(wbtc.transfer(msg.sender, wbtcAmount), "WBTC transfer failed");
    }

    function getUSDCEquivalent(uint256 wbtcAmount, uint256 bitcoinPrice) public pure returns (uint256) {
        return (wbtcAmount * bitcoinPrice) / 1e8; // 1 WBTC = 1e8 satoshis
    }

    function getWBTCEquivalent(uint256 usdcAmount, uint256 bitcoinPrice) public pure returns (uint256) {
        require(bitcoinPrice > 0, "Bitcoin price must be greater than zero");
        return (usdcAmount * 1e8) / bitcoinPrice; // Scale by 1e8 for WBTC decimals
    }
}