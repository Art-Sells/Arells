# Arells Build Notes...

## Arells 1.2

#### After Testing and Before Launch: 
- Delete all important variables

##### Arells 1.2 Features
- **Hide/Show Art (Mock-Up):**  We've in-built a feature that will allow you to hide any artpiece you don't want to be revealed to the public (i.e) and artpiece you accidentally create and upload into your store. This is just the mock-up and is not fully integrated into Arells. In order for us to fully integrate the hide/show feature, we need to incorporate it into your own individual store profile and this won't be implemented until Arells 1.5 (slated to launch on 2/18/23). So from now till then, I highly recommend not creating/uploading any art into your store that you do not want shown to the public, at least not until Arells 1.5.
- **New Open/Enter-Store/Connect Wallet UX:** Some people were having trouble initially connecting to MetaMask and Coinbase from the Arells homepage so we streamlined and simplified the connection process to hopefully ensure no-one gets confused during the initial Wallet Connection process. We hope that this will ensure less confusion, we're very open to feedback so we can better improve the user experience.
- All in all, we're focused on getting you sales first and foremost so every product iteration we release, is focused on ensuring that the buying/selling process for your art is as easy and as seamless as possible (this includes ensuring your art loads as quickly as possible)... With Arells 1.3, we're hoping to have the "high quality art loading issue" resolved once it releases next week. So far, it's been only one week of free minimal marketing and we already have a potentially interested buyer (show RareFinds Instagram)... This is before our large marketing push begins next February so we are on the right track!

Arells 1.3 (which will resolve the high quality image loading issue) releases next week 1/7/24. 2 weeks later Arells 1.4 with clickable images, then 2 weeks after that 1.5 with profiles and the fully integrated hide art feature.

________________________________________________________________________________________________________________________________________________

## Arells 1.3

### My/Other Stores
- When loading images. Load only 10 images at a time and resolution to 1000x1000… Why do images stay on white before loading?

#### After Testing and Before Launch:
- Delete all important variables
- Inform of Arells 1.4 release (and features).
________________________________________________________________________________________________________________________________________________

## Arells 1.4

### My Store
- Images clickable

### My Store Asset (See Asset Modal)
- Images (Default Store Image) here render small pixels
- PAP, You Keep, Price

### Other Store
- Images clickable

### Other Store Asset (See Asset Modal)
- Images (Default Store Image) here render small pixels
- PAP, You Keep, Price

#### After Testing and Before Launch: 
- Delete all important variables
- Inform of Arells 1.5 release (and features).

________________________________________________________________________________________________________________________________________________


## Arells 1.5
- Pages separated like so: own/address (if not signed up) store-name/own/address{redirects-if-connected} (if signed-up)
- AUM (Assets Under Management) system & # of New Wallets Created, system.
- Emphasize Revenue while including AUM... arells(dot)com/metrics
- Hidden From Public (full feature)

### Sign-Up
- Sign Up with Google/Apple/Facebook/Etc

### Edit Store
- Logo: Default Store Logo
- Name: No Maximum Characters
- Addresses | Locations:
0x74348347 - [Enter Store]
"Unclaimed Store Address" - (Claim Address)
{Must Claim All Addresses}

### My Store
- Top-Center[EDIT]-(SignUp/LogIn to Create/Edit {if not logged in}) (You are not the owner of this Address)
- small Logo or Slogan
- Logo: Default Store Logo
- Store Name: Maximum Width if long name (Test) Unclaimed Store Address
- Store Address: Address
- Theme: Arells Logo needs to be 300-500px (on all pages (Home/etc))

### Other Store
- Top-Left[||]-([My-Store]if connected)([/\]if not connected)
- small Logo or Slogan
- Image Default: Store Icon
- Name Default: Unclaimed Store Address

#### After Testing and Before Launch: 
- Delete all important variables
- Inform of Arells 1.7 release (and features including clickable pictures).

________________________________________________________________________________________________________________________________________________

## Arells 1.7

### My Store Asset (See Asset Modal)
- PAP Logo Above Price After Purchase (clickable and explains roadmap Polygon to USDC)

### Other Store Asset (See Asset Modal)     
- PAP Logo Above Price After Purchase (clickable and explains roadmap Polygon to USDC)

#### LinkTree Links... 
***Dynamic Metadata (for Profile/Assets), Static Metadata (for Non-Profile/Asset Pages)***
- MetaTag Image(Asset): large-image|name, small-|category
- MetaTag Title: "Store/Asset Name" (character Limit)
- MetaTag Description: "Slogan"
- MetaTag Image: "Store/Asset Image"
- Google Search Console Index (with sitemap) Log-In/Sign-Up

##### Bugs
- Try/Catch Apollo Connection/Address Error...
- 404 and Server Error Pages
- Resolve overextending numbers listing issue
- Resolve "Price After Purchase Price after not 0.00ing in listing issue"
- Resolve "Price After Purchase Collector (buy) loading price pop-up issue"
- Polish "Add" button edges

#### After Testing and Before Launch: 
- Delete all important variables
- Send 1 month - 2 week notifications on new Features to be added in Arells 3.0
- Prepare Promotional Instagram/Discords) Abstracts/Illustrations/Photos  hashtags*)) arells.com/abstracts|illustrations|photography pages
________________________________________________________________________________________________________________________________________________


## Arells 2.0
- SiteMap/s
- Connect NFTs <-> NFTs Function
- Pages separated like so: store-name/asset/address
- Connect Address to Profile-LogIn. If Address connected to Profile/Automatically logs you in 
- Research Upgradable SmartContracts (through OpenZeppelin)
- Web3 Modal

### Wallet
- Test with Metamask/Mumbai-USDC
- Mainnet with Coinbase/Polygon-USDC
- CrossMint Payment (Integrate Arells in Email) Api... Contact sales for Bank Statements

### Buying Provider
- Arells [Arells uses Crossmint as it's payment provider] info at bottom.

### Home
- If logged in [(Open Store), (Close Store)]
- If not logged in [Open Store] - takes you to "My Store (SignerProvider)" if not [Connect Wallet]
- List of Addresses | Locations


### My Store
- Top-Right[Cart][Connect Wallet]-if not connected
- Bottom-Center[+]<black. [Connect Wallet]-if not connected (SignUp/LogIn to Create/Edit {if not logged in})
- - **Created**:
- [Add-To-Cart]-Use Prototype as Reference, ([Not For Sale]-Light [For Sale]-heavy(if I'm the collector)) ([Not For Sale]-greyed [Add-To-Cart](if not the collector))
- - **Collected**:
- Price After Purchase - (if price not yet set purchased) = "Not For Sale"
- [Add-To-Cart]-Use Prototype as Reference, [Not For Sale]-greyed,
- *If you're the creator* [For Sale]-dark-gray, [Not For Sale]-silver,

### My Store Asset   
- Top-Left[/\]- (See HOME section)
- Top-Right[Cart][Connect Wallet]-if not connected
- Bottom-Center[+]<black. [Connect Wallet]-if not connected
- Images (Default Store Image) here render small pixels
- Name
- Evolutions Section
- Mimick Set Price Section and Buy Button for List to Sell
- Created by (Signer 0 (if addressClaimed then Store Name)), Owned by (Signer 1 (if addressClaimed then Store Name))
- PAP Logo Above Price After Purchase
- Certificates of Ownership
-  Set Price After Purchase(Connect Wallet if not connected): Price (set)?: shows what you keep, creator keeps, fees, etc. [Save Changes (Price After Purchase Error if not correct] Buyer must list new PAP price (no lower than 2x of price) [Calculate earnings: Next Collector Keeps... 47%, insert-creator-name Keeps... 50%, Fees... 3%]... [Save Changes]-if wallet not connected (Connect Wallet)
- - **Selling**:
- Price After Purchase - (if price not yet set purchased) = "Sold"
- [Add To Cart]-share to sell Modal, [Not For Sale]-silver, [Sold]white
- - **Owned**:
- Price After Purchase - (if price not yet set purchased) = "Not For Sale"
- [Add To Cart]-share to sell Modal, [Not For Sale]-silver,

### Other Store
- Top-Right[Cart][Connect Wallet]-if not connected
- Bottom-Center[+]<black. [Connect Wallet]-if not connected
- - **Selling**:
- Created by (Signer 0 (if addressClaimed then Store Name)), Owned by (Signer 1 (if addressClaimed then Store Name))
- Price After Purchase - (if price not yet set purchased) = "Not For Sale"
- [Add-To-Cart]-Use Prototype as Reference, ([Not For Sale]-Light [For Sale]-heavy(if I'm the collector)) ([Not For Sale]-greyed [Add-To-Cart](if not the collector))
- - **Owned**:
- Price After Purchase - (if price not yet set purchased) = "Not For Sale"
- [Add-To-Cart]-Use Prototype as Reference, [Not For Sale]-greyed,
- *If you're the creator* [For Sale]-dark-gray, [Not For Sale]-silver,

### Other Store Asset       
- Top-Left[||]-([My-Store]if connected)([/\]if not connected)
- Top-Right[Cart]
- Bottom-Left & Right -- Nothing
- Images here render small pixels
- Name
- Evolutions Section
- Mimick Set Price Section and Buy Button for List to Sell
- - **Selling**:
- [Add-To-Cart]-Use Prototype as Reference, ([Not For Sale]-Light [For Sale]-heavy(if I'm the collector)) ([Not For Sale]-greyed [Add-To-Cart](if not the collector))
- - **Owned**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Not For Sale"
- [Add-To-Cart]-Use Prototype as Reference, [Not For Sale]-greyed,
- *If you're the creator* [For Sale]-dark-gray, [Not For Sale]-silver


#### After Purchase (Modal)
-- Congratulations on your Purchase! Set Price After Purchase to make money off your owned art [VIEW MY STORE]- Takes you to your Owned store

#### LinkTree Links... 
***Dynamic Metadata (for Profile/Assets), Static Metadata (for Non-Profile/Asset Pages)***
- MetaTag Title: "Store Name" (character Limit)
- MetaTag Description: "Slogan"
- MetaTag Image: Logo Image centered (use created AWS SDK)

#### After Testing and Before Launch: 
- Store Private Key Cold
- Delete all Test/Branched/Component links
- Send 1 month - 2 week notifications on new Features (show what sharing page will look like) to be added in Arells 3.0
- Marketing "Promotional campaign" for Arells 2.0 and beyond = USDC/Credit-Card Holders (Mainstream) Audience on Instagram #sell #art #assets #profits)

##### Bugs
- Clean up if/else if Displays to make more efficient...

#### After Launch
- Google Sitemap Update
________________________________________________________________________________________________________________________________________________

## Arells 3.0

### Welcome to Arells! Never lose money selling art! [Start Selling]

### Price After Purchase About**
- Create link to Individual PAP GitHub Technical (Learn More)
- Create AUM Tracker (for all Current Prices)

### Memory based Art creation
- We don't allow deleting due to our memory-based art creation method. Your life's memories are valuable because (no matter how good or bad they are) they can never be deleted. The same philosophy rings true with Arells. Memory based Art creations ensures no art (no matter how good or bad) can ever be deleted thus ensuring its overall sustained value-creation.

### My/Other Store Assets
- PAP Logo Above Price After Purchase (Assets) (Asset links to Price After Purchase About Page with logo and Description) [Even in Edit]
- Bottom-Left[Bell]<light. (only after logged in) Separate Divs for all hovering buttons.

### Price After Purchase About
- Arells' Price After Purchase system is a market innovation that removes bear markets (markets in which you lose money selling assets) out of financial systems... Learn More (Coming Soon)

### My Store Asset
- Edit: On-Off button Public/Private

### My/Other Store**
-- ([automatically loads latest])
- Bottom-Left[Bell]<light. (only after logged in) Separate Divs for all hovering buttons.
- (Private Art) (Public Art)

### Home
- If logged in [(View My Store), (The Price After Purchase System), Contact (Instagram/Discord) by Category, (Log-Out)]

### Bell
- "Congratulations xxxx! Your Art xxxx Sold to xxxx for xxxx", You've made xxxx in profit!".
- Email Notifications
- Notifications "you'll be earning...X after Purchasing" when collector changes purchase.

#### After Testing and Before Launch: 
- Delete all important variables
- Send 1 - 2 week notification about new Features in next iteration
________________________________________________________________________________________________________________________________________

## Arells 4.0 

- Rename Production Repo (Arells Marketplace)
- Wallet Logs you off After 10 minutes of innaction (review Bank Apps)
- "Store Name is Taken Error, and if Asset Name is taken"
- NFTs = Digital Art,
- Seed Phrase = Vault Code
- Connect Wallet = Connect Store, 
- Public Key = Address,
- Automatic Token Confirmations when listing, creating, and buying Art.
- Creating on one new address (if we switch blockchains) automatically bridges all funds from one address to another… Users don’t have to manually change addresses. All polygon prices switch to USDC (auto)
- Private Key = (Do Not Show and Allow Outbound USDC Transfers, only Withdrawals to Banks and Inbound Transfers [For Security purposes]).
- Make API Key Private
- Build with Circle Wallet As A Service? (USDC) ***Connects to bank account once and automatically converts USDC with purchacing***                                           
- Change all NFT words (WebApp/Twitter/GitHub/Crunchbase) into "Digital Art"
- Heavy KYC/AML [USDC -to-bank- transfers only] through Integrating Apple-Pay & Google Pay Credit Card with USDC "purchase".

### Bug-fixes
- Test to see if page-restart (after system restart) shows blank code page.

### Sign-up
- Proof-of-Creation (Website/Social-Media-Links) to prevent plagarism for artwork creating. (Verified Check... No Verified check for buyer)
- Terms & Conditions Agreement

#### How To Make Money:
{As A Collector: Buy, Set Price After Purchase (list profits), Share}{As A Creator: Create, Set Price and Price After Purchase, Share} [VIEW STORE]-(if no art collected (Created), else (Collected)).

#### About (in Home Section)
- Created by artists for artists. Arells was created from a deep frustration of how difficult it is to make a living as artists in a society that doesn't value art to the same degree as other careers. But now thanks to the technology powering cryptocurrencies (blockchain), all this changes. Neither you nor buyers of your artwork will ever lose money selling art thanks to a new market system we're calling "Price After Purchase". With our Price After Purchase system (PAP Logo - link to PAP Description), bear markets (markets in which people sell assets at a loss) are obsolete. Arells would have been impossible to create before blockchain technology and so... This marks you as a pioneer of a revolution that will change not just the art industry, but asset markets everywhere.

### Seller-Created/Collected
- Addresses section (based on Blockchains(incorporate SOL USDC?)
- Private and Not-For-Sale items automatically show on bottom of pack
- Create Categories (General, Illustrations, etc)
- Check how GitHub Integrates Profile Image with Profile Change (integrate this in MetaImage)
- - Proof-of-creation 70x PAP for Copyright Proven Artistic Works
- - Proof-of-ownership for major assets.

### Cash-Register (Slide-Up)
-- Store dissapears on top left  replaced by Bell.
- USDC Transfer to Bank Account (Beam Cash Out API?)

### Vault (Slide-Up)
- NFT Collections (Ability to Receive ONLY [In-Bound]... No Outbound Transfers)
  
#### Connect Wallet(Open Market):
- USDC only (On Polygon until Ethereum 2 Upgrade is complete (100,000 TPS, lower gas fee L2s (Keep users informed)
- Phase out Crossmint (if they won't include our own Logo/Name in Email/Payment info)
- Rarimo (CCTP) Circle?
- Extensions: Chrome, Edge, Brave, Opera, iOS, PlayStore

##### Other:
-	`onError(event => fail()}` for failed images
