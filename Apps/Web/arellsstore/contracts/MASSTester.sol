// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IUniswapTickHelper {
    function getSqrtRatioAtTick(int24 tick) external pure returns (uint160);
}

contract MASSTester {
    IUniswapV3Pool public immutable pool;
    ISwapRouter public immutable router;
    IUniswapTickHelper public immutable tickHelper;
    address public immutable tokenA;
    address public immutable tokenB;

    constructor(
        address _uniswapPool, 
        address _router, 
        address _tickHelper,  // NEW: Address of TickMath Wrapper
        address _tokenA, 
        address _tokenB
    ) {
        pool = IUniswapV3Pool(_uniswapPool);
        router = ISwapRouter(_router);
        tickHelper = IUniswapTickHelper(_tickHelper);  // Assign wrapper contract
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

function executeZeroFeeSwap(uint256 amountIn, address recipient) external {
    require(amountIn > 0, "MASSTester: Invalid swap amount");

    uint256 allowance = IERC20(tokenA).allowance(msg.sender, address(this));
    uint256 balance = IERC20(tokenA).balanceOf(msg.sender);

    emit Log("User Allowance", allowance);
    emit Log("User Balance", balance);
    emit Log("Swap Amount Requested", amountIn);

    require(allowance >= amountIn, "MASSTester: Insufficient token allowance");
    require(balance >= amountIn, "MASSTester: Insufficient balance");

    // Attempt Transfer
    require(IERC20(tokenA).transferFrom(msg.sender, address(this), amountIn), "MASSTester: Transfer failed");

    emit Log("Transfer Successful", amountIn);
}

    // Debugging Event
    event Log(string message, uint256 value);
}