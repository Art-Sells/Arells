const {expect} = require("chai");

describe("NFTMarket", function (){
    it("Should create and execute market sales", async function () {
        const Market = await ethers.getContractFactory("NFTMarket")
        const market = await Market.deploy()
        const marketAddress = market.address
        console.log("Market Address:", marketAddress);

        const NFT = await ethers.getContractFactory("NFT")
        const nft = await NFT.deploy(marketAddress)
        const nftContractAddres = nft.address

        let listingPrice = await market.getListingPrice()
        listingPrice = listingPrice.toString()

        const price = ethers.utils.parseUnits('100', 'ether')

        await nft.createToken("https://mytokenlocation.com")
        await nft.createToken("https://mytokenlocation2.com")

        await market.createMarketItem(nftContractAddres, 1, price, {value: listingPrice})
        await market.createMarketItem(nftContractAddres, 2, price, {value: listingPrice})

        const [_, buyerAddress] = await ethers.getSigners()

        await market.connect(buyerAddress).createMarketSale(nftContractAddres, 1, {value:
        price})

        const items = await market.fetchMarketItems()

        console.log('items: ', items)

    });
});