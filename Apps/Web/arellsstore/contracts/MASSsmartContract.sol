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
    function supplicateABTCtoAUSD(address to, uint256 usdAmount, uint256 bitcoinPrice) external {
        uint256 aBTCEquivalent = getBTCEquivalent(usdAmount, bitcoinPrice);

        require(aBTCBalances[msg.sender] >= aBTCEquivalent, "Insufficient aBTC balance");
        require(aBTCEquivalent > 0, "Amount must be greater than zero");

        // Update Local Balances
        aBTCBalances[msg.sender] -= aBTCEquivalent;
        totalaBTC -= aBTCEquivalent;

        aUSDBalances[to] += usdAmount; 
        totalaUSD += usdAmount;

        // Burn and Mint Tokens
        aBTCContract.burn(msg.sender, aBTCEquivalent);
        aUSDContract.mint(to, usdAmount);

        emit aBTCBurned(msg.sender, aBTCEquivalent);
        emit aUSDMinted(to, usdAmount);
    }
    // Burn aUSD and Mint aBTC
    function supplicateAUSDtoABTC(address to, uint256 btcAmount, uint256 bitcoinPrice) external {
        uint256 aUSDEquivalent = getUSDEquivalent(btcAmount, bitcoinPrice);

        require(aUSDBalances[msg.sender] >= aUSDEquivalent, "Insufficient aUSDC balance");
        require(aUSDEquivalent > 0, "Amount must be greater than zero");

        // Update Local Balances
        aUSDBalances[msg.sender] -= aUSDEquivalent;
        totalaUSD -= aUSDEquivalent;

        aBTCBalances[to] += btcAmount;
        totalaBTC += btcAmount;

        // Burn and Mint Tokens
        aUSDContract.burn(msg.sender, aUSDEquivalent);
        aBTCContract.mint(to, btcAmount); 

        emit aUSDBurned(msg.sender, aUSDEquivalent);
        emit aBTCMinted(to, btcAmount);
    }

    function getUSDEquivalent(uint256 aBTCAmount, uint256 bitcoinPrice) public pure returns (uint256) {
        return (aBTCAmount * bitcoinPrice * 100) / 1e8;
    }

    function getBTCEquivalent(uint256 aUSDAmount, uint256 bitcoinPrice) public pure returns (uint256) {
        return ((aUSDAmount * 1e8) / 100) / bitcoinPrice;
    }


    // Admin withdraw function (optional for safety)
    function withdrawaBTC(uint256 amount) external onlyAdmin {
        require(totalaBTC >= amount, "Insufficient total aBTC supply");
        totalaBTC -= amount;
    }
}