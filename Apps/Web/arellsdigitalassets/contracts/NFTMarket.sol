// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721/sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    address payable creator;
    address payable owner;
    uint256 mintingPrice = 0.025 ether;

    constructor() {
        owner = payable(msg.sender);
    }

    struct MarketItem {
        uint itemId;
        address nftContract;
        uint256 tokenId;
        address payable creator;
        address payable seller;
        address payable owner;
        uint256 price;
        uint256 priceAfterPurchase;
        bool sold;
    }

    mapping (uint256 => MarketItem) private idToMarketItem;

    struct MarketItemCreated {
        uint indexed itemId;
        address indexed nftContract;
        uint256 indexed tokenId;
        address creator;
        address seller;
        address owner;
        uint256 price;
        bool sold;
    }

    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 priceAfterPurchase,
    ) public payable nonReentrant {
        require (price > 0, "Price must be at least 1 wei");
        require (priceAfterPurchase > price, "PAP must be greater than price");

    }
}