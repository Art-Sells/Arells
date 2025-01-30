// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ArellsBTC.sol"; // Import the actual aBTC contract
import "./ArellsUSD.sol"; // Import the actual aUSD contract
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "hardhat/console.sol";

contract MASSsmartContract {
    string public constant aBTCName = "Arells Bitcoin";
    string public constant aBTCNameSymbol = "aBTC";
    string public constant aUSDName = "Arells USD";
    string public constant aUSDNameSymbol = "aUSD";

    IERC20 public cbBTC; // The cbBTC token contract
    aBTC public aBTCContract;
    aUSD public aUSDContract;
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

    constructor(
        address _cbBTCAddress,
        address _aBTCAddress,
        address _aUSDAddress, 
        address _reserveAddress
    ) {
        cbBTC = IERC20(_cbBTCAddress);
        aBTCContract = aBTC(_aBTCAddress); // Correctly using the aBTC contract
        aUSDContract = aUSD(_aUSDAddress); // Correctly using the aUSD contract
        reserveAddress = _reserveAddress;
        admin = msg.sender;
    }

    // View aBTC Balance
    function aBTCBalance(address user) external view returns (uint256) {
        return aBTCBalances[user];
    }

    // View aUSD Balance
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
        aBTCContract.mint(msg.sender, cbBTCAmount);

        // Update internal balance mapping
        aBTCBalances[msg.sender] += cbBTCAmount;
        totalaBTC += cbBTCAmount;

        emit aBTCMinted(msg.sender, cbBTCAmount);
    }

    // Burn aBTC and Mint aUSD
    function supplicateABTCtoAUSD(address to, uint256 aBTCAmount, uint256 bitcoinPrice) external {
        console.log("Burning aBTC Amount:", aBTCAmount);
        console.log("Bitcoin Price:", bitcoinPrice);
        console.log("Raw Calculation:", aBTCAmount * bitcoinPrice);
        console.log("Expected USD (Before Division):", (aBTCAmount * bitcoinPrice) / 1e8);
        console.log("Expected USD (If ERC20):", (aBTCAmount * bitcoinPrice) / 1e18);

        require(aBTCBalances[msg.sender] >= aBTCAmount, "Insufficient aBTC balance");
        require(aBTCAmount > 0, "Amount must be greater than zero");
        require(bitcoinPrice > 0, "Bitcoin price must be greater than zero");

        uint256 aUSDAmount = getUSDEquivalent(aBTCAmount, bitcoinPrice);
        
        console.log("Before Burning: User aBTC:", aBTCBalances[msg.sender]);
        console.log("Burning Amount: ", aBTCAmount);
        console.log("Calculated USD Amount:", aUSDAmount);

        // Update Local Balances
        aBTCBalances[msg.sender] -= aBTCAmount;
        totalaBTC -= aBTCAmount;

        aUSDBalances[to] += aUSDAmount;  // ✅ Fix: Ensure aUSD balance is updated correctly
        totalaUSD += aUSDAmount;

        console.log("After Burning: User aBTC:", aBTCBalances[msg.sender]);
        console.log("After Minting: User aUSD:", aUSDBalances[to]);

        // Burn and Mint Tokens
        aBTCContract.burn(msg.sender, aBTCAmount);
        aUSDContract.mint(to, aUSDAmount); // ✅ FIX: Explicitly send aUSD to the correct address

        emit aBTCBurned(msg.sender, aBTCAmount);
        emit aUSDMinted(to, aUSDAmount);
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

        aUSDContract.burn(msg.sender, aUSDAmount);

        aBTCContract.mint(msg.sender, aBTCAmount); 


        emit aUSDBurned(msg.sender, aUSDAmount);
        emit aBTCMinted(msg.sender, aBTCAmount);
    }

    function getUSDEquivalent(uint256 aBTCAmount, uint256 bitcoinPrice) public pure returns (uint256) {
        uint256 rawUSD = (aBTCAmount * bitcoinPrice) / 1e6; 
        console.log("Raw USD Calculation:", rawUSD);

        return rawUSD; 
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