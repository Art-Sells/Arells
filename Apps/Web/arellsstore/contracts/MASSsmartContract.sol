// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract MASSsmartContract {
    string public constant aBTCName = "Arells Bitcoin";
    string public constant aBTCNameSymbol = "aBTC";
    string public constant aUSDName = "Arells USD";
    string public constant aUSDNameSymbol = "aUSD";

    IERC20 public cbBTC; // The cbBTC token contract
    address public reserveAddress; // Address where cbBTC is deposited

    uint256 public totalaBTC;
    uint256 public totalaUSD;

    mapping(address => uint256) public aBTCBalances;
    mapping(address => uint256) public aUSDBalances;

    address public admin;

    event aBTCMinted(address indexed user, uint256 amount);
    event aUSDMinted(address indexed user, uint256 amount);
    event aBTCBurned(address indexed user, uint256 amount);
    event aUSDBurned(address indexed user, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor(address _cbBTCAddress, address _reserveAddress) {
        cbBTC = IERC20(_cbBTCAddress);
        reserveAddress = _reserveAddress;
        admin = msg.sender;
    }

    //setBalances Add Here
// Admin-only function to set balances for testing or initialization
    function setBalances(address user, uint256 aBTCAmount, uint256 aUSDAmount) external onlyAdmin {
        require(user != address(0), "Invalid address");
        
        aBTCBalances[user] = aBTCAmount;
        aUSDBalances[user] = aUSDAmount;

        totalaBTC += aBTCAmount;
        totalaUSD += aUSDAmount;
    }


    // View aBTC Balance
    function aBTCBalance(address user) external view returns (uint256) {
        return aBTCBalances[user];
    }

    // View aUSDC Balance
    function aUSDBalance(address user) external view returns (uint256) {
        return aUSDBalances[user];
    }

    // Mint aBTC by depositing cbBTC
    function mintaBTC(uint256 cbBTCAmount) external {
        require(cbBTCAmount > 0, "Amount must be greater than zero");

        // Transfer cbBTC from the user to the reserve address
        require(
            cbBTC.transferFrom(msg.sender, reserveAddress, cbBTCAmount),
            "cbBTC transfer failed"
        );

        // Mint aBTC to the user
        aBTCBalances[msg.sender] += cbBTCAmount;
        totalaBTC += cbBTCAmount;

        emit aBTCMinted(msg.sender, cbBTCAmount);
    }

    // Burn aBTC and Mint aUSD
    function supplicateABTCtoAUSD(uint256 aBTCAmount, uint256 bitcoinPrice) external {
        require(aBTCBalances[msg.sender] >= aBTCAmount, "Insufficient aBTC balance");
        require(aBTCAmount > 0, "Amount must be greater than zero");
        require(bitcoinPrice > 0, "Bitcoin price must be greater than zero");

        uint256 aUSDAmount = getUSDEquivalent(aBTCAmount, bitcoinPrice);

        // Burn aBTC
        aBTCBalances[msg.sender] -= aBTCAmount;
        totalaBTC -= aBTCAmount;

        // Mint aUSDC
        aUSDBalances[msg.sender] += aUSDAmount;
        totalaUSD += aUSDAmount;

        emit aBTCBurned(msg.sender, aBTCAmount);
        emit aUSDMinted(msg.sender, aUSDAmount);
    }

    // Burn aUSD and Mint aBTC
    function supplicateAUSDtoABTC(uint256 aUSDAmount, uint256 bitcoinPrice) external {
        require(aUSDBalances[msg.sender] >= aUSDAmount, "Insufficient aUSDC balance");
        require(aUSDAmount > 0, "Amount must be greater than zero");
        require(bitcoinPrice > 0, "Bitcoin price must be greater than zero");

        uint256 aBTCAmount = getBTCEquivalent(aUSDAmount, bitcoinPrice);

        // Burn aUSDC
        aUSDBalances[msg.sender] -= aUSDAmount;
        totalaUSD -= aUSDAmount;

        // Mint aBTC
        aBTCBalances[msg.sender] += aBTCAmount;
        totalaBTC += aBTCAmount;

        emit aUSDBurned(msg.sender, aUSDAmount);
        emit aBTCMinted(msg.sender, aBTCAmount);
    }

    function getUSDEquivalent(uint256 aBTCAmount, uint256 bitcoinPrice) public pure returns (uint256) {
        // Returns USD equivalent directly in cents (2 decimals)
        return (aBTCAmount * bitcoinPrice) / 1e8; 
    }

    function getBTCEquivalent(uint256 aUSDAmount, uint256 bitcoinPrice) public pure returns (uint256) {
        require(bitcoinPrice > 0, "Bitcoin price must be greater than zero");
        // Returns BTC equivalent directly in satoshis (8 decimals)
        return (aUSDAmount * 1e8) / bitcoinPrice; 
    }


    // Admin withdraw function (optional for safety)
    function withdrawaBTC(uint256 amount) external onlyAdmin {
        require(totalaBTC >= amount, "Insufficient total aBTC supply");
        totalaBTC -= amount;
    }
}