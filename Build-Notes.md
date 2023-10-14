## Arells Build Notes...

## MVP
- Pages separated like so: main/profile-name/asset-name
- Start with Polygon/Coinbase (USDC) [use GPT4 as help] [CrossMint Payment (Integrate Arells in Email) Api... Contact sales for Bank Statements]
- Ensure Each Page has differing MetaDescriptions
- Add "Change-After-Test" over every href.
- Change Home.css everytime updloading (ask GPT4 About Metadate reloading)?
- Don't Forget About SiteMap/s (only for pages to be shown)
- Remove "Wallet ConnecteD"

### Wallet: 
- Test with Metamask/Mumbai-USDC
- Mainnet with Coinbase/Polygon-USDC
- Loading Screen while connecting
- Wallet Connected Modal after Success

### Home
- If logged in [(View My Store), (How To Make Money), About, Contact, (Log-Out)]
- If not logged in [Sign-Up/Log-In]
- Log-In/Sign-up with Google/Apple/Facebook/Etc

### Sign-Up
- Sign Up with Google/Apple/Facebook/Etc
- Proof-of-Creation (Website/Social-Media-Links) to prevent plagarism for artwork creating. (Verified Check... No Verified check for buyer)
- Terms & Conditions Agreement
- ##### "Welcome to Arells! How To Make Money {As A Collector: Buy, Set Price After Purchase (list profits), Share}{As A Creator: Create, Set Price and Price After Purchase, Share} [VIEW STORE]-(if no art collected (Created), else (Collected)).

### About
- Created by artists for artists. Arells was created from a deep frustration of how difficult it is to make a living as artists in a society that doesn't value art to the same degree as STEM (Science, Technology, Engineering and Math). But now thanks to the technology powering cryptocurrencies (blockchain), all this changes. Now for the first time in human history, neither you nor buyers of your artwork will ever lose money trading or selling art thanks to a revolutionary new financial system we're calling "Price After Purchase". With our Price After Purchase system, bear markets (markets in which people sell assets (Art, Jewelry, Real Estate, etc at a loss)) are made irrelevant hence our slogan "Never Lose Money Selling Art". And so as Arells grows, bear markets decline and this would have been impossible to create before blockchain technology. So pat yourself in the back. You are officially part of a revolution that will change not just the art industry, but asset markets everywhere.

### My Store
-- ([automatically loads latest])
- Top-Left[/\]- (See HOME section) 
- Top-Right[Cart][Connect Wallet]-if not connected
- Bottom-Right[+]<black. [Connect Wallet]-if not connected
- Bottom-Left[Bell]<light. (only after logged in) Separate Divs for all hovering buttons.
- Name & Description: Maximum Number of Characters.
- Theme: Arells Logo needs to be 300-500px (on all pages (Home/etc))
- - **Created**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Sold"
- [For Sale]-dark-gray, [Not For Sale]-silver, [Sold]white
- - **Collected**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Not For Sale"
- [For Sale]-dark-gray, [Not For Sale]-silver,
 
#### Creating Mechanics
- Images are not minted until images are purchased (Digital Fingerprints "Revealed After Purchase"). *Inform Users about Free NFT Creation/Minting process*
- PAP price calculated 50x from price listed by creator (After Sale: You Keep... 50%, Buyer Keeps... 47%, Fees... 3%)...
- 1 Blockchain (Polygon)--- This is automatically chosen for buyer... prices in USDC
- Create AUM Tracker (for all Current Prices)
 
### My Store Asset   
- Top-Left[/\]- (See HOME section)
- Top-Right[Cart][Connect Wallet]-if not connected
- Bottom-Right[+]<black. [Connect Wallet]-if not connected
- Bottom-Left[Bell]<light. (only after logged in) Separate Divs for all hovering buttons.
- Images here render small pixels
- Name & Description: Maximum Number of Characters.
- Remove "Owned By" if not collected/bought/minted.
- Theme: Arells Logo needs to be 300-500px (on all pages (Home/etc))
- - - Edit: Price (set)?: shows what you keep, creator keeps, fees, etc. [Save Changes (Price After Purchase Error if not correct] Buyer must list new PAP price (no lower than 2x of price) [Calculate earnings: Next Collector Keeps... 47%, *insert-creator-name* Keeps... 50%, Fees... 3%].
- - **Created**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Sold"
- [For Sale]-dark-gray, [Not For Sale]-silver, [Sold]white
- - **Collected**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Not For Sale"
- [For Sale]-dark-gray, [Not For Sale]-silver,

### Bell
- Notifications on who bought what at how much (Squared for sharing)
- Send Email After Purchase 
  
### Other Store
-- ([automatically loads latest])
- Top-Left[||]-([My-Store]if connected)([/\]if not connected)
- Top-Right[Cart]
- Bottom-Left & Right -- Nothing
- - **Created**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Not For Sale"
- [Add-To-Cart]-Use Prototype as Reference, ([Not For Sale]-Light [For Sale]-heavy(if I'm the collector)) ([Not For Sale]-greyed [Add-To-Cart](if not the collector))
- - **Collected**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Not For Sale"
- [Add-To-Cart]-Use Prototype as Reference, [Not For Sale]-greyed,
- *If you're the creator* [For Sale]-dark-gray, [Not For Sale]-silver,

### Other Store Asset       
- Top-Left[||]-([My-Store]if connected)([/\]if not connected)
- Top-Right[Cart]
- Bottom-Left & Right -- Nothing
- Images here render small pixels
- Remove "Owned By" if not collected/bought/minted.
- - **Created**:
- [Add-To-Cart]-Use Prototype as Reference, ([Not For Sale]-Light [For Sale]-heavy(if I'm the collector)) ([Not For Sale]-greyed [Add-To-Cart](if not the collector))
- - **Collected**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Not For Sale"
- [Add-To-Cart]-Use Prototype as Reference, [Not For Sale]-greyed,
- *If you're the creator* [For Sale]-dark-gray, [Not For Sale]-silver,

### Cart 
- Arells [Arells uses Crossmint as it's payment provider] info at bottom.  

#### After Purchase:
-- [If not Signed/logged in] = message: {Congratulations on your Purchase! Sign-up or Log-in to Make Money from your Purchase}[dismiss]
- - - Edit (View My Store Asset) 
- Message (notifications-cash-register) to seller: "Congratulations xxxx! Your Art xxxx Sold to xxxx for xxxx", You've made xxxx in profit!".
- Email Notifications (see cash register)

#### After PAP Set:
 1. "List For Sale? [List][DeList]{Both Open Modal} (On Buyer)... (Nothing Shows in Public Buyer)". [PAP in Seller/Buyer/Assets/Collected/Created shows Rendering while editing price]
 2. If Yes, then "Add-to-Cart", if No then "Collected" (On Seller)[Can Edit PAP anytime]
 3. If/Then messages corresponding to above messages. 

#### Image/s
- Check how GitHub Integrates Profile Image with Profile Change (integrate this in MetaImage)
- Created & Owned By (Character Limit Links)
- [Prices Not Shown for unlisted items, only Creators/Owner's name]  
     
#### LinkTree Links... 
***Dynamic Metadata (for Profile/Assets), Static Metadata (for Non-Profile/Asset Pages)***
- MetaTags Social-sharing-images: AWS Cloudfront?
- MetaTag Title: "Profile/Asset Name"
- MetaTag Description: "Profile/Asset Description"
- MetaTag Image(Profile): large-profile|image.name, small-profile|description
- MetaTag Image(Asset): small-profile|image.name, large-asset|image.name
- metadata const (upgrade from generateMetadata) must be async for dynamic changes
- 
- *clear Browsing/Cache Data before checking*
- Google Search Console Index (with sitemap)

#### After Testing and Before Launch: Store Private Key Cold, Delete Branched-Repo, Help Artists find Buyers [Add Featured Artists from everyone who Responded (After we launch our Wallet)]

________________________________________________________________________________________________________________________________________

## DIGITAL ASSET STORE

- "Profile Name is Taken Error, and if Asset Name is taken"
- NFTs = Digital Assets, 
- Connect Wallet = Connect Store, 
- Public Key = Address, 
- Private Key = (Do Not Show and Allow Outbound USDC Transfers, only Withdrawals to Banks [For Security purposes]).
- Make API Key Private

### Store (Default)
- Includes all Arells Website Components
- Build with Circle Wallet As A Service? (USDC) ***Connects to bank account once and automatically converts USDC with purchacing***                                           
- Change all NFT words (WebApp/Twitter/GitHub/Crunchbase) into "Digital Asset"
- Heavy KYC/AML [USDC -to-bank- transfers only] through Integrating Apple-Pay & Google Pay Credit Card with USDC "purchase".

### Seller-Created/Collected
- Private and Not-For-Sale items automatically show on bottom of pack
- Create Categories (General, Illustrations, etc)
- Check how GitHub Integrates Profile Image with Profile Change (integrate this in MetaImage)
- - Proof-of-creation 70x PAP for Copyright Proven Artistic Works
- - Proof-of-ownership for major assets.
 
### My Store Asset
- Edit: On-Off button Listed-For-Sale/Public
 
### Bell
- Notifications "you'll be earning...X after Purchasing" when collector changes purchase.

### Cash-Register (Slide-Up)
-- Store dissapears on top left  replaced by Bell.
- USDC Transfer to Bank Account (Beam Cash Out API?)

### Vault (Slide-Up)
- NFT Collections (Ability to Transfer & Receive)
  
#### Wallet(Store):
- USDC only (On Polygon until Ethereum 2 Upgrade is complete (100,000 TPS, lower gas fee L2s (Keep users informed)
- Phase out Crossmint (if they won't include our own Logo/Name in Email/Payment info)
- Rarimo (CCTP) Circle?
- Extensions: Chrome, Edge, Brave, Opera, iOS, PlayStore

##### Other:
-	`onError(event => fail()}` for failed images

