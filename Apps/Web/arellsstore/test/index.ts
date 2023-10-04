import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("NFTMarket", function (){
    let nftMarket: Contract;
    let signers: SignerWithAddress[];

    before( async() => {
        const NFTMarket = await ethers.getContractFactory("NFTMarket");
        nftMarket = await NFTMarket.deploy() as Contract;
        await nftMarket.deployed();
        signers = await ethers.getSigners();
    })

    const createNFT = async (tokenURI) => {
        const transaction = await nftMarket.createNFT(tokenURI);
        const receipt = await transaction.wait();
        const tokenID = receipt.events[1].args.tokenID;
        return tokenID;
    }
    const createAndListNFT = async (price) => {
        const tokenID = await createNFT('some token uri');
        const transaction = await nftMarket.listNFTCreator(tokenID, price);
        await transaction.wait();
        return tokenID;
    }

    describe("createNFT", function () {
        it("Should create an Asset with correct tokenURI but without minting", async function () {
    
            // Call the create nft function
            const tokenURI = 'https://some-token.uri/';
            const transaction = await nftMarket.createNFT(tokenURI);
            const receipt = await transaction.wait();
            
            // Assuming the tokenId is the first argument in the NFTTransfer event.
            const tokenID = receipt.events[1].args.tokenID;
    
            // Instead of checking the tokenURI from the contract (since it's not minted yet),
            // we'll get the intendedTokenURI from the _intendedTokenURIs mapping
            const storedTokenURI = await nftMarket._intendedTokenURIs(tokenID);
            expect(storedTokenURI).to.equal(tokenURI);
    
            // You can't check the owner since the token is not minted yet.
            // But you can check the creator.
            const creatorAddress = await nftMarket._creators(tokenID);
            const currentAddress = await signers[0].getAddress();
            expect(creatorAddress).to.equal(currentAddress);
    
            // Assert that the NFTTransfer event has the correct args
            const args = receipt.events[1].args; // Assuming the NFTTransfer event is the first event.
            expect(args.tokenID).to.equal(tokenID);
            expect(args.from).to.equal(ethers.constants.AddressZero);
            expect(args.to).to.equal(creatorAddress);  // Since NFT is not minted, the `to` field should be the creator's address.
            expect(args.tokenURI).to.equal(tokenURI);
            expect(args.price).to.equal(0);
    
        });
    });
      
    describe("listNFT", () => {
        const tokenURI = 'some token uri';
        it("Should revert if Price == 0", async () => {
            const tokenID = await createNFT(tokenURI);
            const transaction = nftMarket.listNFTCreator(tokenID, 0);
            await expect(transaction).to.be.revertedWith("AssetMarket: Price must be more than 0");
        });
    
        it("Should revert if not called by the creator", async () => {
            const tokenID = await createNFT(tokenURI);
            const transaction = nftMarket.connect(signers[1]).listNFTCreator(tokenID, 12);
            await expect(transaction).to.be.revertedWith("AssetMarket: You're not the creator of this NFT");
        });

        it("Should revert if not called by the collector", async () => {
            // Step 1: Mint the NFT to signers[0] by purchasing it
            const tokenID = await createNFT(tokenURI);
            await nftMarket.connect(signers[0]).listNFTCreator(tokenID, 12);
            await nftMarket.connect(signers[1]).buyNFT(tokenID, { value: 12 }); // Assuming 12 is the listed price
            // Step 2: Try to list the NFT for sale from an account that isn't the collector
            const transaction = nftMarket.connect(signers[2]).listNFTCollector(tokenID, 14);
            await expect(transaction).to.be.revertedWith("AssetMarket: You're not the owner of this NFT");
        });
    
        it("Should allow creator to list the NFT for sale", async () => {
            const price = 123;
            const tokenID = await createNFT(tokenURI);
            const transaction = await nftMarket.listNFTCreator(tokenID, price);
            const receipt = await transaction.wait();

            // Get listing details
            const listing = await nftMarket.getListing(tokenID);
            expect(listing.price).to.equal(price);

            // NFTTransfer event should have right args
            const args = receipt.events[0].args; 
            expect(args.tokenID).to.equal(tokenID);
            expect(args.from).to.equal(signers[0].address);
            expect(args.to).to.equal(nftMarket.address);
            expect(args.tokenURI).to.equal(tokenURI);
            expect(args.price).to.equal(price);
        });

        it("Should allow collector to list the NFT for sale", async () => {
            // Step 1: Create the NFT
            const tokenID = await createNFT(tokenURI);
        
            // Step 2: List it for sale (as the creator)
            const initialPrice = 100; // Using 100 for demonstration
            await nftMarket.listNFTCreator(tokenID, initialPrice);
        
            // Step 3: Purchase (mint) the NFT as the first buyer
            await nftMarket.connect(signers[1]).buyNFT(tokenID, { value: initialPrice });
            const newOwnerAddress = await nftMarket.ownerOf(tokenID);
            expect(newOwnerAddress).to.equal(signers[1].address); // Confirming transfer
        
            // Step 4: List it for sale by the first buyer
            const resalePrice = 200; // Using 200 for demonstration
            const transaction = await nftMarket.connect(signers[1]).listNFTCollector(tokenID, resalePrice);
            const receipt = await transaction.wait();
        
            // Check the listing price
            const listing = await nftMarket.getListing(tokenID);
            expect(listing.price).to.equal(resalePrice);
        
            // NFTTransfer event should have right args
            const args = receipt.events[0].args;
            expect(args.tokenID).to.equal(tokenID);
            expect(args.from).to.equal(signers[1].address);
            expect(args.to).to.equal(nftMarket.address);
            expect(args.tokenURI).to.equal("");
            expect(args.price).to.equal(resalePrice);
        });
        
    });
    

    describe("buyNFT", () => {
        it("Should revert if Asset is not listed for sale", async () => {
            const transaction = nftMarket.buyNFT(9999);
            await expect(transaction).to.be.revertedWith(
                "AssetMarket: asset not listed for sale");
        });
    
        it("Should revert if $ sent is not equal to the Asset price", async () => {
            const tokenID = await createAndListNFT(123);
            const transaction = nftMarket.buyNFT(tokenID, {value: 124});
            await expect(transaction).to.be.revertedWith(
                "AssetMarket: incorrect price");
        });
    
        it("Should mint NFT and list owner as 1st collector and send 97% price to creator when after collector buys", async () => {
            const price = 100;
            const sellerProfit = Math.floor(price * 97 / 100);
            const fee = price - sellerProfit;
            const initialContractBalance = await nftMarket.provider.getBalance(
                nftMarket.address
            );
            
            // Assuming the creator is signers[0]
            const tokenID = await createAndListNFT(price);
            // Check isFirstSale status before the buy
            const beforeBuyIsFirstSale = await nftMarket._isFirstSale(tokenID);
            expect(beforeBuyIsFirstSale).to.be.false; // It should be false before the first sale
            const oldSellerBalance = await ethers.provider.getBalance(signers[0].address);
            const transaction = await nftMarket.
                connect(signers[1]).
                buyNFT(tokenID, {value: price});
            const receipt = await transaction.wait();
            //97% of price added to seller balance
            await new Promise((r) => setTimeout(r, 100));
            const newSellerBalance = await ethers.provider.getBalance(signers[0].address);
            const diff = newSellerBalance.sub(oldSellerBalance);
            expect(diff).to.equal(sellerProfit);
            
            // 3% of price kept in contract balance
            const newContractBalance = await nftMarket.provider.getBalance(
                nftMarket.address
            );
            const contractBalanceDiff = newContractBalance.sub(
                initialContractBalance
            );
            expect(contractBalanceDiff).to.equal(fee);

            //Nft is Minted and collector is now Owner
            const ownerAddress = await nftMarket.ownerOf(tokenID);
            expect(ownerAddress).to.equal(signers[1].address);
            
            // Check isFirstSale status after the buy
            const afterBuyIsFirstSale = await nftMarket._isFirstSale(tokenID);
            expect(afterBuyIsFirstSale).to.be.true; // It should now be true since the asset has been bought once

            //NFTTransfer event should have right args
            const args = receipt.events[2].args;
            expect(args.tokenID).to.equal(tokenID);
            expect(args.from).to.equal(nftMarket.address);
            expect(args.to).equal(signers[1].address);
            expect(args.tokenURI).to.equal("");
            expect(args.price).to.equal(0);

        });
    
        it("Should transfer ownership to next collector, send 57% price to previous collector and 40% to creator after next collector buys", async () => {
            const price = 100; 
            const creatorProfit = Math.floor(price * 40 / 100);
            const sellerProfit = Math.floor(price * 57 / 100);
            const fee = price - (sellerProfit + creatorProfit);

    // CODE BELOW IS NOTED TO TEST IF ITEM WAS BOUGHT FROM CREATOR
            // Assuming the creator is signers[0]
            const tokenID = await createAndListNFT(price);
            // Check isFirstSale status before the buy
            const beforeBuyIsFirstSale = await nftMarket._isFirstSale(tokenID);
            expect(beforeBuyIsFirstSale).to.be.false; // It should be false before the first sale

            //Old Collector bought from Creator
            await ethers.provider.getBalance(signers[0].address);
            await nftMarket.connect(signers[1]).buyNFT(tokenID, {value: price});

            //Nft is Minted and Old Collector is now Owner
            const ownerAddress = await nftMarket.ownerOf(tokenID);
            expect(ownerAddress).to.equal(signers[1].address);

            // Approve the NFTMarket contract to manage the NFT on behalf of signers[1]
            await nftMarket.connect(signers[1]).approve(nftMarket.address, tokenID);
        
            // Now, signers[1] (Old Collector) should list it for sale again
            await nftMarket.connect(signers[1]).listNFTCollector(tokenID, price);
            
            // Check isFirstSale status before the buy
            const afterBuyIsFirstSale = await nftMarket._isFirstSale(tokenID);
            expect(afterBuyIsFirstSale).to.be.true; // It should now be true since the asset has been bought once
            const oldSellerBalance = await ethers.provider.getBalance(signers[1].address);
            const oldCreatorBalance = await ethers.provider.getBalance(signers[0].address);
            const oldContractBalance = await nftMarket.provider.getBalance(
                nftMarket.address
            );
    // CODE ABOVE IS NOTED TO TEST IF ITEM WAS BOUGHT FROM CREATOR        

            //signers[2] (New Collector) buys it from signers[1] (Old Collector)
            const transaction = await nftMarket.
                connect(signers[2]).
                buyNFT(tokenID, {value: price});
            const receipt = await transaction.wait();
            
            ///57% of price added to Old Collector balance and 40% to Creator Balance
            const newSellerBalance = await ethers.provider.getBalance(signers[1].address);
            const newCreatorBalance = await ethers.provider.getBalance(signers[0].address);
            expect(newSellerBalance.sub(oldSellerBalance)).to.equal(sellerProfit);
            expect(newCreatorBalance.sub(oldCreatorBalance)).to.equal(creatorProfit);

            // 3% of price kept in contract balance
            const newContractBalance = await nftMarket.provider.getBalance(
                nftMarket.address
            );
            const contractBalanceDiff = newContractBalance.sub(
                oldContractBalance
            );
            expect(contractBalanceDiff).to.equal(fee);

            //Nft Ownership transferred from Old Collector to New Collector
            const ownerAddressTwo = await nftMarket.ownerOf(tokenID);
            expect(ownerAddressTwo).to.equal(signers[2].address);
            // Check isFirstSale status after the buy
            expect(afterBuyIsFirstSale).to.be.true; // It should remain true

            //NFTTransfer event should have right args
            const args = receipt.events[1].args;
            expect(args.tokenID).to.equal(tokenID);
            expect(args.from).to.equal(nftMarket.address);
            expect(args.to).equal(signers[2].address);
            expect(args.tokenURI).to.equal("");
            expect(args.price).to.equal(0);

        });
    })

    describe("cancelListing", function () {
        it("Should revert if the NFT is not listed for sale by Creator", async function () {
            const transaction = nftMarket.cancelListingCreator(9999);
            await expect(transaction).to.be.revertedWith(
                "AssetMarket: asset not listed for sale"
            );
        });
        it("Should revert if the NFT is not listed for sale by Creator", async function () {
            const transaction = nftMarket.cancelListingCollector(9999);
            await expect(transaction).to.be.revertedWith(
                "AssetMarket: asset not listed for sale"
            );
        });
        it("Should revert if the collector is not the creator before the Asset is bought", async function () {
            const tokenID = await createAndListNFT(123);
            // Trying to cancel the listing by signers[1] (who isn't the owner yet)
            const transaction = nftMarket.connect(signers[1]).cancelListingCreator(tokenID);
            await expect(transaction).to.be.revertedWith("AssetMarket: you're not the creator");
        });
        it("Should revert if the creator tries to cancel listing after NFT is bought", async function () {
            const tokenID = await createAndListNFT(123);
            // First, signers[1] buys the NFT
            await nftMarket.connect(signers[1]).buyNFT(tokenID, { value: 123 })
            //Nft Ownership transferred from Creator to Old Collector
            const ownerAddress = await nftMarket.ownerOf(tokenID);
            expect(ownerAddress).to.equal(signers[1].address);
            // signers[1] (new owner) lists the NFT again
            await nftMarket.connect(signers[1]).listNFTCollector(tokenID, 456);
            // Original seller (signers[0]) tries to cancel the new listing
            const transaction = nftMarket.connect(signers[0]).cancelListingCollector(tokenID);
            await expect(transaction).to.be.revertedWith("AssetMarket: you're not the collector");
        });
        it("Should cancel for creator if all requirements met", async function () {
            const tokenID = await createAndListNFT(123);
            
            const transaction = await nftMarket.cancelListingCreator(tokenID);
            const receipt = await transaction.wait();
            // Check NFTTransfer event
            const args = receipt.events[0].args;
            expect(args.tokenID).to.equal(tokenID);
            expect(args.from).to.equal(nftMarket.address);
            expect(args.to).equal(signers[0].address);
            expect(args.tokenURI).to.equal("");
            expect(args.price).to.equal(0);
        });
        it("Should transfer ownership back to collector if all requirements met", async function () {
            const tokenID = await createAndListNFT(123);
            //First, signers[1] buys the NFT
            await nftMarket.connect(signers[1]).buyNFT(tokenID, { value: 123 });
            //Nft Minted and Collector owns
            const ownerAddress = await nftMarket.ownerOf(tokenID);
            expect(ownerAddress).to.equal(signers[1].address);
            //signers[1] (owner) lists the NFT again
            await nftMarket.connect(signers[1]).listNFTCollector(tokenID, 456);
            //Then he/she cancels NFT
            const transaction = await nftMarket.connect(signers[1]).cancelListingCollector(tokenID);
            const receipt = await transaction.wait();
            //Check NFTTransfer event
            const args = receipt.events[0].args;
            expect(args.tokenID).to.equal(tokenID);
            expect(args.from).to.equal(nftMarket.address);
            expect(args.to).equal(signers[1].address);
            expect(args.tokenURI).to.equal("");
            expect(args.price).to.equal(0);
        });
    }) 

    describe("withdrawFunds", function () {
        it("Should revert if called by a signer other than owner of address", async function () {
            const transaction = nftMarket.connect(signers[1]).withdrawFunds();
            await expect(transaction).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });
        it("Should transfer all funds from contract balance to owner's address", async function () {
            const contractBalance = await nftMarket.provider.getBalance(
                nftMarket.address
            );
            const initialOwnerBalance = await signers[0].getBalance();
            const transaction = await nftMarket.withdrawFunds();
            const receipt = await transaction.wait();

            await new Promise((r) => setTimeout(r, 100));
            const newOwnerBalance = await signers[0].getBalance();

            const gas = receipt.gasUsed.mul(receipt.effectiveGasPrice);
            const transferred = newOwnerBalance.add(gas).sub(initialOwnerBalance);
            expect(transferred).to.equal(contractBalance);
        });
        it("Should revert if contract balance is 0", async function () {
            const transaction = nftMarket.withdrawFunds();
            await expect(transaction).to.be.revertedWith(
                "AssetMarket: balance is zero"
            );
        });
    }) 
    
})
