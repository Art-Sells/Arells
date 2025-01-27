// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract MASSsmartContract {
    string public constant aBTCName = "Arells Bitcoin";
    string public constant aBTCNameSymbol = "aBTC";
    string public constant aUSDCName = "Arells USDC";
    string public constant aUSDCNameSymbol = "aUSDC";

    IERC20 public cbBTC; // The cbBTC token contract
    address public reserveAddress; // Address where cbBTC is deposited

    uint256 public totalaBTC;
    uint256 public totalaUSDC;

    mapping(address => uint256) public aBTCBalances;
    mapping(address => uint256) public aUSDCBalances;

    address public admin;

    event aBTCMinted(address indexed user, uint256 amount);
    event aUSDCMinted(address indexed user, uint256 amount);
    event aBTCBurned(address indexed user, uint256 amount);
    event aUSDCBurned(address indexed user, uint256 amount);

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
    function setBalances(address user, uint256 aBTCAmount, uint256 aUSDCAmount) external onlyAdmin {
        require(user != address(0), "Invalid address");
        
        aBTCBalances[user] = aBTCAmount;
        aUSDCBalances[user] = aUSDCAmount;

        totalaBTC += aBTCAmount;
        totalaUSDC += aUSDCAmount;
    }


    // View aBTC Balance
    function aBTCBalance(address user) external view returns (uint256) {
        return aBTCBalances[user];
    }

    // View aUSDC Balance
    function aUSDCBalance(address user) external view returns (uint256) {
        return aUSDCBalances[user];
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

    // Burn aBTC and Mint aUSDC
    function supplicateABTCforAUSDC(uint256 aBTCAmount, uint256 bitcoinPrice) external {
        require(aBTCBalances[msg.sender] >= aBTCAmount, "Insufficient aBTC balance");
        require(aBTCAmount > 0, "Amount must be greater than zero");
        require(bitcoinPrice > 0, "Bitcoin price must be greater than zero");

        uint256 aUSDCAmount = getUSDCEquivalent(aBTCAmount, bitcoinPrice);

        // Burn aBTC
        aBTCBalances[msg.sender] -= aBTCAmount;
        totalaBTC -= aBTCAmount;

        // Mint aUSDC
        aUSDCBalances[msg.sender] += aUSDCAmount;
        totalaUSDC += aUSDCAmount;

        emit aBTCBurned(msg.sender, aBTCAmount);
        emit aUSDCMinted(msg.sender, aUSDCAmount);
    }

    // Burn aUSDC and Mint aBTC
    function supplicateAUSDCforABTC(uint256 aUSDCAmount, uint256 bitcoinPrice) external {
        require(aUSDCBalances[msg.sender] >= aUSDCAmount, "Insufficient aUSDC balance");
        require(aUSDCAmount > 0, "Amount must be greater than zero");
        require(bitcoinPrice > 0, "Bitcoin price must be greater than zero");

        uint256 aBTCAmount = getABTCEquivalent(aUSDCAmount, bitcoinPrice);

        // Burn aUSDC
        aUSDCBalances[msg.sender] -= aUSDCAmount;
        totalaUSDC -= aUSDCAmount;

        // Mint aBTC
        aBTCBalances[msg.sender] += aBTCAmount;
        totalaBTC += aBTCAmount;

        emit aUSDCBurned(msg.sender, aUSDCAmount);
        emit aBTCMinted(msg.sender, aBTCAmount);
    }

    // Calculate USDC equivalent for a given aBTC amount
    function getUSDCEquivalent(uint256 aBTCAmount, uint256 bitcoinPrice) public pure returns (uint256) {
        return (aBTCAmount * bitcoinPrice) / 1e8; // aBTC has 8 decimals, aUSDC has 6
    }

    // Calculate aBTC equivalent for a given aUSDC amount
    function getABTCEquivalent(uint256 aUSDCAmount, uint256 bitcoinPrice) public pure returns (uint256) {
        require(bitcoinPrice > 0, "Bitcoin price must be greater than zero");
        return (aUSDCAmount * 1e8) / bitcoinPrice; // aBTC has 8 decimals, aUSDC has 6
    }


    // Admin withdraw function (optional for safety)
    function withdrawaBTC(uint256 amount) external onlyAdmin {
        require(totalaBTC >= amount, "Insufficient total aBTC supply");
        totalaBTC -= amount;
    }
}