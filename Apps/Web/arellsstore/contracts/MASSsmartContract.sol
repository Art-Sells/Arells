// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MASSsmartContract {
    mapping(address => uint256) public wbtcBalances; // Stores WBTC balances of wallets
    mapping(address => uint256) public usdcBalances; // Stores USDC balances of wallets
    mapping(address => address) public userToUsdcAddress; // Maps users to their USDC address

    uint256 public totalMinted;
    uint256 public constant MIN_MINT_THRESHOLD = 1; // 1 Satoshi

    event Supplicate(address indexed from, uint256 amount, string supplicateType);
    event Mint(address indexed to, uint256 amount);
    event MASSCreated(address indexed user, address usdcAddress);

    function createMASS() external {
        require(userToUsdcAddress[msg.sender] == address(0), "MASS already created by this user");

        // Register the user's address
        userToUsdcAddress[msg.sender] = msg.sender;

        emit MASSCreated(msg.sender, msg.sender);
    }

    function mint(uint256 aBTC, uint256 acVactTas) external {
        uint256 amountToMint = aBTC > acVactTas ? aBTC - acVactTas : 0;
        require(amountToMint >= MIN_MINT_THRESHOLD, "Amount to mint is too small");

        wbtcBalances[msg.sender] += amountToMint; // Assign minted WBTC to the sender
        totalMinted += amountToMint;

        emit Mint(msg.sender, amountToMint);
    }

    function supplicateWBTCtoUSDC(uint256 usdcAmount, uint256 bitcoinPrice) external {
        uint256 wbtcEquivalent = getWBTCEquivalent(usdcAmount, bitcoinPrice);

        require(wbtcBalances[msg.sender] >= wbtcEquivalent, "Insufficient WBTC balance");

        wbtcBalances[msg.sender] -= wbtcEquivalent; // Deduct WBTC from the sender
        usdcBalances[msg.sender] += usdcAmount; // Add USDC to the user's USDC balance

        emit Supplicate(msg.sender, usdcAmount, "WBTC to USDC");
    }

    function supplicateUSDCtoWBTC(uint256 wbtcAmount, uint256 bitcoinPrice) external {
        uint256 usdcEquivalent = getUSDCEquivalent(wbtcAmount, bitcoinPrice);

        require(usdcBalances[msg.sender] >= usdcEquivalent, "Insufficient USDC balance");

        usdcBalances[msg.sender] -= usdcEquivalent; // Deduct USDC from the user's USDC balance
        wbtcBalances[msg.sender] += wbtcAmount; // Credit WBTC to the sender

        emit Supplicate(msg.sender, wbtcAmount, "USDC to WBTC");
    }

    function getUSDCEquivalent(uint256 wbtcAmount, uint256 bitcoinPrice) public pure returns (uint256) {
        return (wbtcAmount * bitcoinPrice * 100) / 1e8;
    }

    function getWBTCEquivalent(uint256 usdcAmount, uint256 bitcoinPrice) public pure returns (uint256) {
        require(bitcoinPrice > 0, "Bitcoin price must be greater than zero");
        return ((usdcAmount * 1e8) / 100) / bitcoinPrice;
    }
}