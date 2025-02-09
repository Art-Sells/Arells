// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;  // Ensure compatibility with TickMath.sol

import "@uniswap/v3-core/contracts/libraries/TickMath.sol";

contract UniswapTickHelper {
    function getSqrtRatioAtTick(int24 tick) external pure returns (uint160) {
        return TickMath.getSqrtRatioAtTick(tick);
    }
}