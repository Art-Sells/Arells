// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

struct NFTListing {
    uint256 price;
    address seller;
}

contract NFTMarket is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    Counters.Counter private _tokenIDs;
    mapping(uint256 => NFTListing) public _listings;
    mapping(uint256 => uint256) public _priceAfterPurchase; // Added to store the price after purchase
    mapping(uint256 => address) public _creators;
    mapping(uint256 => bool) public _isFirstSale;
    mapping(uint256 => string) public _intendedTokenURIs; // Store the token URIs for tokens yet to be minted

    event TokenURICreated(uint256 indexed tokenID, string tokenURI);
    event NFTTransfer(uint256 tokenID, address from, address to, string tokenURI, uint256 price);
    event PriceUpdated(uint256 tokenID, uint256 newPrice); // New event for price update
    event NewPriceAfterPurchaseSet(uint256 indexed tokenID, uint256 newPriceAfterPurchase);

    constructor() ERC721("Arells Digital Assets", "ASET") {}

    function createNFT(string memory tokenURI) public {
        _tokenIDs.increment();
        uint256 currentID = _tokenIDs.current();

        _creators[currentID] = msg.sender;
        _isFirstSale[currentID] = true; // Set to true for first sale tracking
        _intendedTokenURIs[currentID] = tokenURI; // Storing intended token URI

        emit TokenURICreated(currentID, tokenURI);
        emit NFTTransfer(currentID, address(0), msg.sender, tokenURI, 0);
    }
    function getCreatedTokenURI(uint256 tokenID) public view returns (string memory) {
        require(bytes(_intendedTokenURIs[tokenID]).length > 0, "NFTMarket: Token ID does not exist");
        return _intendedTokenURIs[tokenID];
    }

    function listNFTCreator(uint256 tokenID, uint256 price, uint256 priceAfterPurchase) public {
        require(price > 0, "AssetMarket: Price must be more than 0");
        require(priceAfterPurchase > price, 
        "AssetMarket: Price after purchase must be more than price");
        require(_creators[tokenID] == msg.sender, "AssetMarket: You're not the creator of this NFT");

        _listings[tokenID] = NFTListing(price, msg.sender);
        _priceAfterPurchase[tokenID] = priceAfterPurchase;

        emit NFTTransfer(tokenID, msg.sender, address(this), _intendedTokenURIs[tokenID], price);
        emit PriceUpdated(tokenID, priceAfterPurchase);
    }

    function listNFTCollector(uint256 tokenID, uint256 newPriceAfterPurchase) public {
        _priceAfterPurchase[tokenID] = newPriceAfterPurchase;
        
        require(newPriceAfterPurchase > 0, "AssetMarket: No valid price after purchase set");
        require(newPriceAfterPurchase > _listings[tokenID].price, "AssetMarket: New price after purchase must be more than price");
        require(ownerOf(tokenID) == msg.sender, "AssetMarket: You're not the owner of this NFT");

        _listings[tokenID].seller = msg.sender;

        // Emit the events for updating the price after purchase
        emit PriceUpdated(tokenID, newPriceAfterPurchase);
        emit NewPriceAfterPurchaseSet(tokenID, newPriceAfterPurchase);
        uint256 currentListingPrice = _listings[tokenID].price;
        emit NFTTransfer(tokenID, msg.sender, address(this), _intendedTokenURIs[tokenID], currentListingPrice);
    }


    function getListing(uint256 tokenID) public view returns (uint256 price, address seller) {
        NFTListing storage listing = _listings[tokenID];
        return (listing.price, listing.seller);
    }

    function buyNFT(uint256 tokenID) public payable {
        NFTListing memory listing = _listings[tokenID];
        require(listing.price > 0, "AssetMarket: asset not listed for sale");
        require(msg.value == listing.price, "AssetMarket: incorrect price");
        address seller = _listings[tokenID].seller;
        address creator = _creators[tokenID];

        require(msg.sender != creator, "AssetMarket: Creator cannot buy their own NFT");
        uint256 currentPriceAfterPurchase = _priceAfterPurchase[tokenID];

        // Clear listing before transferring funds
        clearListing(tokenID);

        if (_isFirstSale[tokenID]) {
            // It's the first sale, mint the NFT to the first buyer
            _mint(msg.sender, tokenID);
            _setTokenURI(tokenID, _intendedTokenURIs[tokenID]);
            delete _intendedTokenURIs[tokenID]; // No longer needed after minting
            
            payable(creator).transfer(listing.price.mul(97).div(100));
            _isFirstSale[tokenID] = false;
        } else {
            // Transfer the NFT from current owner to the buyer
            _transfer(ownerOf(tokenID), msg.sender, tokenID);

            // Distribute funds to creator and seller
            payable(creator).transfer(listing.price.mul(40).div(100));
            payable(seller).transfer(listing.price.mul(57).div(100));
            
        }

        // After the sale, set the new listing price for future sales
        _listings[tokenID] = NFTListing(currentPriceAfterPurchase, address(0));
        emit PriceUpdated(tokenID, currentPriceAfterPurchase);
        emit NFTTransfer(tokenID, address(this), msg.sender, "", currentPriceAfterPurchase);

        // Set the price after purchase for this tokenID to 0
        _priceAfterPurchase[tokenID] = 0;
        emit NewPriceAfterPurchaseSet(tokenID, 0);
    }


    // New function to get the price after purchase
    function getPriceAfterPurchase(uint256 tokenID) public view returns (uint256) {
        return _priceAfterPurchase[tokenID];
    }

    function isNFTMinted(uint256 tokenID) public view returns (bool) {
        return _exists(tokenID);
    }

    function getNFTCreatorOrCollector(uint256 tokenId) public view returns (address creatorOrCollector, bool isMinted) {
        if (_exists(tokenId)) {
            // If the token has been minted, return the creator.
            return (ownerOf(tokenId), true);
        } else {
            // If the token has not been minted, check if it has been created (and thus has a creator).
            address creator = _creators[tokenId];
            require(creator != address(0), "NFT does not exist");
            return (creator, false);
        }
    }


    // cancelListingCreator
    function cancelListingCreator(uint256 tokenID) public {
        NFTListing memory listing = _listings[tokenID];

        require(listing.price > 0, "AssetMarket: asset not listed for sale");
        require(_creators[tokenID] == msg.sender, "AssetMarket: you're not the creator");
        require(listing.seller == msg.sender, "AssetMarket: you're not the creatot");

        clearListing(tokenID);

        emit NFTTransfer(tokenID, address(this), msg.sender, "", 0);
        emit NewPriceAfterPurchaseSet(tokenID, 0);
    }

    // cancelListingCollector
    function cancelListingCollector(uint256 tokenID) public {
        NFTListing memory listing = _listings[tokenID];

        require(listing.price > 0, "AssetMarket: asset not listed for sale");
        require(ownerOf(tokenID) == msg.sender, "AssetMarket: you're not the collector");
        require(listing.seller == msg.sender, "AssetMarket: you're not the collector");

        clearListing(tokenID);

        emit NFTTransfer(tokenID, address(this), msg.sender, "", listing.price);
        emit NewPriceAfterPurchaseSet(tokenID, 0);
    }

    function withdrawFunds() public onlyOwner{
        uint256 balance = address(this).balance;
        require(balance > 0, "AssetMarket: balance is zero");
        payable(owner()).transfer(balance);
    }

    function clearListing(uint256 tokenID) private {
        _listings[tokenID].price = 0;
        _listings[tokenID].seller = address(0);
    }

 }