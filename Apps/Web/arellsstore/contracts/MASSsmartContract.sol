// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IPriceOracle {
    function getBitcoinPriceInUSD() external view returns (uint256);
}

contract  {
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

    IPriceOracle public priceOracle;

    address public admin;

    event aBTCMinted(address indexed user, uint256 amount);
    event aUSDCMinted(address indexed user, uint256 amount);
    event aBTCBurned(address indexed user, uint256 amount);
    event aUSDCBurned(address indexed user, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor(address _cbBTCAddress, address _reserveAddress, address _priceOracle) {
        cbBTC = IERC20(_cbBTCAddress);
        reserveAddress = _reserveAddress;
        priceOracle = IPriceOracle(_priceOracle);
        admin = msg.sender;
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
    function supplicateABTCforAUSDC(uint256 aBTCAmount) external {
        require(aBTCBalances[msg.sender] >= aBTCAmount, "Insufficient aBTC balance");
        require(aBTCAmount > 0, "Amount must be greater than zero");

        uint256 bitcoinPrice = priceOracle.getBitcoinPriceInUSD(); // Get Bitcoin price in USD
        uint256 aUSDCAmount = aBTCAmount * bitcoinPrice / 1e8; // aBTC has 8 decimals, aUSDC has 6

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
    function supplicateAUSDCforABTC(uint256 aUSDCAmount) external {
        require(aUSDCBalances[msg.sender] >= aUSDCAmount, "Insufficient aUSDC balance");
        require(aUSDCAmount > 0, "Amount must be greater than zero");

        uint256 bitcoinPrice = priceOracle.getBitcoinPriceInUSD(); // Get Bitcoin price in USD
        uint256 aBTCAmount = aUSDCAmount * 1e8 / bitcoinPrice; // aBTC has 8 decimals, aUSDC has 6

        // Burn aUSDC
        aUSDCBalances[msg.sender] -= aUSDCAmount;
        totalaUSDC -= aUSDCAmount;

        // Mint aBTC
        aBTCBalances[msg.sender] += aBTCAmount;
        totalaBTC += aBTCAmount;

        emit aUSDCBurned(msg.sender, aUSDCAmount);
        emit aBTCMinted(msg.sender, aBTCAmount);
    }

    // View aBTC Balance
    function getaBTCBalance(address user) external view returns (uint256) {
        return aBTCBalances[user];
    }

    // View aUSDC Balance
    function getaUSDCBalance(address user) external view returns (uint256) {
        return aUSDCBalances[user];
    }

    // Admin withdraw function (optional for safety)
    function withdrawaBTC(uint256 amount) external onlyAdmin {
        require(totalaBTC >= amount, "Insufficient total aBTC supply");
        totalaBTC -= amount;
    }
}