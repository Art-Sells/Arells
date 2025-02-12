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

    event Log(string message, uint256 value);
    event LogAddress(string message, address value);

    constructor(
        address _uniswapPool, 
        address _router, 
        address _tickHelper,
        address _tokenA, 
        address _tokenB
    ) {
        pool = IUniswapV3Pool(_uniswapPool);
        router = ISwapRouter(_router);
        tickHelper = IUniswapTickHelper(_tickHelper);
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    function executeZeroFeeSwap(uint256 amountIn, address recipient) external {
        require(amountIn > 0, "MASSTester: Invalid swap amount");

        emit Log("Router Allowance Before Swap", IERC20(tokenA).allowance(address(this), address(router)));
        emit LogAddress("Router Address", address(router));
        emit LogAddress("Token In", tokenA);
        emit LogAddress("Token Out", tokenB);
        emit Log("Trade Fee Tier", 3000);
        emit Log("Amount In", amountIn);
        emit Log("Min Amount Out", 1);

        uint256 allowance = IERC20(tokenA).allowance(msg.sender, address(this));
        uint256 balance = IERC20(tokenA).balanceOf(msg.sender);

        emit Log("User Allowance", allowance);
        emit Log("User Balance", balance);
        emit Log("Swap Amount Requested", amountIn);
        emit LogAddress("Swap Recipient", recipient);

        require(allowance >= amountIn, "MASSTester: Insufficient token allowance");
        require(balance >= amountIn, "MASSTester: Insufficient balance");

        // **Transfer USDC from User to Contract**
        require(IERC20(tokenA).transferFrom(msg.sender, address(this), amountIn), "MASSTester: USDC Transfer Failed");
        emit Log("Contract USDC Balance After Transfer", IERC20(tokenA).balanceOf(address(this)));

        // **Approve Uniswap Router to Spend USDC**
        require(IERC20(tokenA).approve(address(router), amountIn), "MASSTester: Router Approval Failed");
        emit Log("Router Approved for USDC Transfer", amountIn);

        // **Check Uniswap Pool Liquidity**
        uint256 poolLiquidity = pool.liquidity();
        emit Log("Uniswap Pool Liquidity", poolLiquidity);

        require(poolLiquidity > 0, "MASSTester: Uniswap Pool has no liquidity");

        // **Check Router's USDC Balance Before Swap**
        uint256 routerPreBalance = IERC20(tokenA).balanceOf(address(router));
        emit Log("Router USDC Balance Before Swap", routerPreBalance);

        // **Execute Swap on Uniswap V3**
        emit Log("Attempting Uniswap Swap", amountIn);

        uint256 preSwapBalance = IERC20(tokenB).balanceOf(address(this));
        emit Log("Contract CBBTC Balance Before Swap", preSwapBalance);

        try router.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: tokenA,
                tokenOut: tokenB,
                fee: 3000,  // Adjust fee tier if needed (3000 = 0.3%)
                recipient: address(this),
                deadline: block.timestamp + 60, // 1-minute expiration
                amountIn: amountIn,
                amountOutMinimum: 0, // Prevent swaps returning 0
                sqrtPriceLimitX96: 0
            })
        ) returns (uint256 amountOut) {
            emit Log("Received CBBTC from Swap", amountOut);
        } catch {
            revert("MASSTester: Swap transaction failed");
        }

        uint256 postSwapBalance = IERC20(tokenB).balanceOf(address(this));
        emit Log("Contract CBBTC Balance After Swap", postSwapBalance);

        require(postSwapBalance > preSwapBalance, "MASSTester: Swap failed, no CBBTC received");

        // **Send CBBTC to Recipient**
        require(IERC20(tokenB).transfer(recipient, postSwapBalance - preSwapBalance), "MASSTester: CBBTC Transfer failed");

        emit Log("Final User CBBTC Balance", IERC20(tokenB).balanceOf(recipient));
    }
}