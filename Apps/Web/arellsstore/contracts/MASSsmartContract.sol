// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MASSsmartContract {
    mapping(address => uint256) public balances;
    mapping(address => address) public userToUsdcAddress; // Map each user to their USDC address

    uint256 public totalMinted;
    uint256 public constant MIN_MINT_THRESHOLD = 1; // 1 Satoshi

    event Supplicate(address indexed from, uint256 amount, string supplicateType);
    event Mint(address indexed to, uint256 amount);
    event MintingDetails(uint256 aBTC, uint256 acVactTas, uint256 amountToMint);
    event MASSCreated(address indexed creator, address usdcAddress);
    event DebugBalances(address indexed account, uint256 balance, uint256 required);

    function createMASS(address _usdc) external {
        require(userToUsdcAddress[msg.sender] == address(0), "MASS already created by this user");
        userToUsdcAddress[msg.sender] = _usdc;

        emit MASSCreated(msg.sender, _usdc);
    }

    function mint(uint256 aBTC, uint256 acVactTas) external {
        uint256 amountToMint = aBTC > acVactTas ? aBTC - acVactTas : 0;
        require(amountToMint >= MIN_MINT_THRESHOLD, "Amount to mint is too small");

        balances[msg.sender] += amountToMint; // Assign minted WBTC to the sender
        totalMinted += amountToMint;

        emit MintingDetails(aBTC, acVactTas, amountToMint);
        emit Mint(msg.sender, amountToMint);
    }

    function supplicateWBTCtoUSDC(uint256 usdcAmount, uint256 bitcoinPrice) external {
        uint256 wbtcEquivalent = getWBTCEquivalent(usdcAmount, bitcoinPrice);

        require(balances[msg.sender] >= wbtcEquivalent, "Insufficient WBTC balance");

        balances[msg.sender] -= wbtcEquivalent; // Deduct WBTC from the sender
        address usdcAddress = userToUsdcAddress[msg.sender];
        require(usdcAddress != address(0), "MASS not created for this user");
        balances[usdcAddress] += usdcAmount; // Add USDC to the user's USDC address

        emit Supplicate(msg.sender, usdcAmount, "WBTC to USDC");
    }

    function supplicateUSDCtoWBTC(uint256 wbtcAmount, uint256 bitcoinPrice) external {
        uint256 usdcEquivalent = getUSDCEquivalent(wbtcAmount, bitcoinPrice);

        address usdcAddress = userToUsdcAddress[msg.sender];
        require(usdcAddress != address(0), "MASS not created for this user");
        require(balances[usdcAddress] >= usdcEquivalent, "Insufficient USDC balance");

        balances[usdcAddress] -= usdcEquivalent; // Deduct USDC from the user's USDC address
        balances[msg.sender] += wbtcAmount; // Credit WBTC to the sender

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