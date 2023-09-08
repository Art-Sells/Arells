const {ethers} = require("hardhat");
const hre = require("hardhat");

describe("AssetMarket", function (){
    it("Should create and execute market sales", async function () {
        const AssetMarket = await hre.ethers.getContractFactory("AssetMarket");
        const market = await AssetMarket.deploy();

        // Call the create nft function
        const tokenURI = "https://some-token.uri";
        const transaction = await market.createAsset(tokenURI);
        const receipt = await transaction.wait();
        console.log(receipt);

        

    });
});


// describe("NFTMarket", function (){
//     it("Should create and execute market sales", async function () {
//         const Market = await ethers.getContractFactory("NFTMarket")
//         const market = await Market.deploy()
//         market.waitForDeployment()
//         const marketAddress = market.address

//         const NFT = await ethers.getContractFactory("NFT")
//         const nft = await NFT.deploy(marketAddress)
//         const nftContractAddress = nft.address

//         let listingPrice = await market.getListingPrice()
//         listingPrice = listingPrice.toString()

//         const price = ethers.utils.parseUnits('100', 'ether')

//         await nft.createToken("https://mytokenlocation.com")
//         await nft.createToken("https://mytokenlocation2.com")

//         await market.createMarketItem(nftContractAddress, 1, price, {value: listingPrice})
//         await market.createMarketItem(nftContractAddress, 2, price, {value: listingPrice})

//         const [_, buyerAddress] = await ethers.getSigners()

//         await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1, {value:
//         price})

//         const items = await market.fetchMarketItems()

//         console.log('items: ', items)

//     });
// });