// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.19;

// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
// import "@openzeppelin/contracts/utils/Counters.sol";
// import "@openzeppelin/contracts/utils/math/SafeMath.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";

//  struct NFTListing {
//     uint256 price;
//     address seller;
//  }

// contract NFTMarket is ERC721URIStorage, Ownable {
//     using Counters for Counters.Counter;
//     using SafeMath for uint256;

//     Counters.Counter private _tokenIDs;
//     mapping(uint256 => NFTListing) public _listings;
//     mapping(uint256 => string) public _intendedTokenURIs; // Store the token URIs for tokens yet to be minted
//     mapping(uint256 => address) public _creators;
//     mapping(uint256 => bool) public _isFirstSale;
//     string[] public createdTokenURIs;

//     event TokenURICreated(uint256 index, string tokenURI);
//     event NFTTransfer(uint256 tokenID, address from, address to, string tokenURI, uint256 price);

//     constructor() ERC721("Arells Assets", "ASAT") {}

//     function createNFT(string memory tokenURI) public {
//         createdTokenURIs.push(tokenURI);
//         uint256 currentIndex = createdTokenURIs.length - 1;
        
//         _tokenIDs.increment();
//         uint256 currentID = _tokenIDs.current();
//         _intendedTokenURIs[currentID] = tokenURI;  // Continue to store the intended tokenURI for later minting
//         _creators[currentID] = msg.sender;
//         _isFirstSale[currentID] = false;
        
//         emit TokenURICreated(currentIndex, tokenURI);
//         emit NFTTransfer(currentID, address(0), msg.sender, tokenURI, 0);
//     }
//     function getCreatedTokenURI(uint256 index) public view returns (string memory) {
//         require(index < createdTokenURIs.length, "Index out of bounds");
//         return createdTokenURIs[index];
//     }

//     function listNFTCreator(uint256 tokenID, uint256 price) public {
//         require(price > 0, "AssetMarket: Price must be more than 0");
//         require(_creators[tokenID] == msg.sender, "AssetMarket: You're not the creator of this NFT");
//         _listings[tokenID] = NFTListing(price, msg.sender);
//         emit NFTTransfer(tokenID, msg.sender, address(this), _intendedTokenURIs[tokenID], price);
//     }

//     function listNFTCollector(uint256 tokenID, uint256 price) public {
//         require(price > 0, "AssetMarket: Price must be more than 0");
//         require(ownerOf(tokenID) == msg.sender, "AssetMarket: You're not the owner of this NFT");
//         _listings[tokenID] = NFTListing(price, msg.sender);
//         emit NFTTransfer(tokenID, msg.sender, address(this), _intendedTokenURIs[tokenID], price);
//     }

//     function getListing(uint256 tokenID) public view returns (uint256 price, address seller) {
//         NFTListing storage listing = _listings[tokenID];
//         return (listing.price, listing.seller);
//     }

//     function buyNFT(uint256 tokenID) public payable {
//         NFTListing memory listing = _listings[tokenID];
//         require(listing.price > 0, "AssetMarket: asset not listed for sale");
//         require(msg.value == listing.price, "AssetMarket: incorrect price");
//         address seller = _listings[tokenID].seller;
//         address creator = _creators[tokenID];

//         // Clear listing before transferring funds
//         clearListing(tokenID);

//         if (!_isFirstSale[tokenID]) {
//             // It's the first sale, mint the NFT to the first buyer
//             _mint(msg.sender, tokenID);
//             _setTokenURI(tokenID, _intendedTokenURIs[tokenID]);
//             delete _intendedTokenURIs[tokenID]; // Delete the stored tokenURI as it has now been minted
            
//             payable(creator).transfer(listing.price.mul(97).div(100));
//             _isFirstSale[tokenID] = true;
//         } else {
//             // Get the current owner of the NFT
//             address currentOwner = ERC721(address(this)).ownerOf(tokenID);

//             // Transfer the NFT from current owner to the buyer
//             ERC721(address(this)).transferFrom(currentOwner, msg.sender, tokenID);

//             // Distribute funds to creator and seller
//             payable(creator).transfer(listing.price.mul(40).div(100));
//             payable(seller).transfer(listing.price.mul(57).div(100));
//         }

//         emit NFTTransfer(tokenID, address(this), msg.sender, "", 0);
//     }

//     // cancelListingCreator
//     function cancelListingCreator(uint256 tokenID) public {
//         NFTListing memory listing = _listings[tokenID];

//         require(listing.price > 0, "AssetMarket: asset not listed for sale");
//         require(_creators[tokenID] == msg.sender, "AssetMarket: you're not the creator");
//         require(listing.seller == msg.sender, "AssetMarket: you're not the creatot");

//         clearListing(tokenID);

//         emit NFTTransfer(tokenID, address(this), msg.sender, "", 0); // Assuming NFTTransfer indicates a listing cancellation, not an actual NFT transfer
//     }

//     // cancelListingCollector
//     function cancelListingCollector(uint256 tokenID) public {
//         NFTListing memory listing = _listings[tokenID];

//         require(listing.price > 0, "AssetMarket: asset not listed for sale");
//         require(ownerOf(tokenID) == msg.sender, "AssetMarket: you're not the collector");
//         require(listing.seller == msg.sender, "AssetMarket: you're not the collector");

//         clearListing(tokenID);

//         emit NFTTransfer(tokenID, address(this), msg.sender, "", 0); // Assuming NFTTransfer indicates a listing cancellation, not an actual NFT transfer
//     }

//     function withdrawFunds() public onlyOwner{
//         uint256 balance = address(this).balance;
//         require(balance > 0, "AssetMarket: balance is zero");
//         payable(owner()).transfer(balance);
//     }

//     function clearListing(uint256 tokenID) private {
//         _listings[tokenID].price = 0;
//         _listings[tokenID].seller = address(0);
//     }

//  }