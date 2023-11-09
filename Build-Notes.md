## Arells Build Notes...

## Alpha
- Pages separated like so: store/address (if not signed up) store/store-name (if signed-up), asset/address/id (both)
- Start with Polygon/Coinbase
- Ensure Each Page has differing MetaDescriptions
- Add "Change-After-Test" over every href.
- Change Home.css everytime updloading (ask GPT4 About Metadate reloading)?

### Wallet: 
- Test with Metamask/Mumbai
- Mainnet with Coinbase/Polygon
- Connect Address to Profile-LogIn. If Address connected to Profile/Automatically logs you in 

### Home
- If logged in [(View My Store), (Log-Out)]
- If not logged in [Sign-Up/Log-In]
- Log-In/Sign-up with Google/Apple/Facebook/Etc
- **All Above {Connect Wallet} if wallet not connected**

### Sign-Up
- Sign Up with Google/Apple/Facebook/Etc

### Edit Store
- Store Logo: Default Store Logo
- Store Name: No Maximum Characters
- (Save Changes) {Connect Wallet} if wallet not connected and/or Home if not signed in.

### My Store
- Top-Left[/]- (See HOME section)
- Top-Right[Cart][Connect Wallet]-if not connected
- Top-Center[Edit Store]-(SignUp/LogIn to Create/Edit {if not logged in})
- Bottom-Right[+]<black. [Connect Wallet]-if not connected (SignUp/LogIn to Create/Edit {if not logged in})
- Logo: Default Store Logo
- Store Name: Maximum Width if long name (Test)
- Theme: Arells Logo needs to be 300-500px (on all pages (Home/etc))
- PAP Logo Above Price After Purchase
- - **Created**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Sold"
- [Add To Cart]-share to sell Modal, [Not For Sale]-silver, [Sold(if collector hasn't listed)]white, [Selling(if collector has listed)]white .... Both Sold and Selling are buttons that link to Collector
- - **Collected**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Not For Sale"
- [Add To Cart]-share to sell Modal, [Not For Sale]-silver,
 
#### Creating Mechanics
- Once confirmed -> (My Store Asset Edit page) {Art Created Modal} {Item Automatically in Created Profile Page PAP & Price = Lines [[Not For Sale]}
- Images are not minted until images are purchased (Digital Fingerprints "Revealed After Purchase"). *Inform Users about Free NFT Creation/Minting process*
- PAP price calculated 50x from price listed by creator (After Sale: You Keep... 50%, Buyer Keeps... 47%, Fees... 3%)...
- 1 Blockchain (Polygon)--- This is automatically chosen for buyer..
 
### My Store Asset   
- Top-Left[/\]- (See HOME section)
- Top-Right[Cart][Connect Wallet]-if not connected
- Bottom-Right[+]<black. [Connect Wallet]-if not connected
- Bottom-Left[Bell]<light. (only after logged in) Separate Divs for all hovering buttons.
- Images (Default Store Image) here render small pixels
- Remove "Owned By" if not collected/bought/minted.
- PAP Logo Above Price After Purchase
- - - Set Price After Purchase(Connect Wallet if not connected): Price (set)?: shows what you keep, creator keeps, fees, etc. [Save Changes (Price After Purchase Error if not correct] Buyer must list new PAP price (no lower than 2x of price) [Calculate earnings: Next Collector Keeps... 47%, insert-creator-name Keeps... 50%, Fees... 3%]... [Save Changes]-if wallet not connected (Connect Wallet)
- - **Created**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Sold"
- [Add To Cart]-share to sell Modal, [Not For Sale]-silver, [Sold]white
- - **Collected**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Not For Sale"
- [Add To Cart]-share to sell Modal, [Not For Sale]-silver,

### Other Store
- Top-Left[||]-([My-Store]if connected)([/\]if not connected)
- Top-Right[Cart]
- Bottom-Left & Right -- Nothing
- Image Default: Store Icon
- Name Default: Unnamed Store
- PAP Logo Above Price After Purchase 
- - **Created**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Not For Sale"
- [Add-To-Cart]-Use Prototype as Reference, ([Not For Sale]-Light [For Sale]-heavy(if I'm the collector)) ([Not For Sale]-greyed [Add-To-Cart](if not the collector))
- - **Collected**:
- Art Category Logos on all Collecteds
- Price After Purchase - To Be Set (if price not yet set purchased) = "Not For Sale"
- [Add-To-Cart]-Use Prototype as Reference, [Not For Sale]-greyed,
- *If you're the creator* [For Sale]-dark-gray, [Not For Sale]-silver,

### Other Store Asset       
- Top-Left[||]-([My-Store]if connected)([/\]if not connected)
- Top-Right[Cart]
- Bottom-Left & Right -- Nothing
- Images here render small pixels
- PAP Logo Above Price After Purchase
- - **Created**:
- [Add-To-Cart]-Use Prototype as Reference, ([Not For Sale]-Light [For Sale]-heavy(if I'm the collector)) ([Not For Sale]-greyed [Add-To-Cart](if not the collector))
- - **Collected**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Not For Sale"
- [Add-To-Cart]-Use Prototype as Reference, [Not For Sale]-greyed,
- *If you're the creator* [For Sale]-dark-gray, [Not For Sale]-silver,

### Cart 
- (Connect Wallet if not connected)

#### After Purchase (Modal)
-- Congratulations on your Purchase! Set Price After Purchase to make money off your collection [VIEW COLLECTION]- Takes you to Collection
     
#### LinkTree Links... 
***Dynamic Metadata (for Profile/Assets), Static Metadata (for Non-Profile/Asset Pages)***
- MetaTags Social-sharing-images: AWS Cloudfront?
- MetaTag Title: "Profile/Asset Name" (character Limit)
- MetaTag Image(Profile): large-profile|image.name
- MetaTag Image(Asset): small-profile|image.name, large-asset|image.name
- metadata const (upgrade from generateMetadata) must be async for dynamic changes
- *clear Browsing/Cache Data before checking*
- Google Search Console Index (with sitemap)

#### After Testing and Before Launch: 
- Store Private Key Cold
- Delete Branched-Repo,
- Send 1 month - 2 week notifications on new Features to be added. (Discuss "promotional campaign" to help you find mainstream buyers buyers who don't use Cryptocurrency) only with USDC/Credit-Card integration... Once our promotional campaign begins, we will be targeting 3 markets(Abstract Art, Illustrations & Photography) so I highly recommend creating your store (once we launch) with only 1 target market in mind. Features (Alpha (PaP Polygon) vs Beta (USDC Credit Card))

________________________________________________________________________________________________________________________________________________

## Beta
**(If enough time before Alpha launch build these (ordered by priority))**
- SiteMap/s 

### 1. Wallet
- Test with Metamask/Mumbai-USDC
- Mainnet with Coinbase/Polygon-USDC
- CrossMint Payment (Integrate Arells in Email) Api... Contact sales for Bank Statements

### 2. Cart
- Arells [Arells uses Crossmint as it's payment provider] info at bottom.

### 3. My/Other Store
- Art Category: Abstracts, Photography, Illustrations (Icon for each) (Prepare Promotional Instagram/Discord Campaign) "Make Money by Buying & Selling The Best Abstracts/Illustrations/Photos from Arells" *buy and sell art hashtags*))
- - **Edit Store**
- Store Art Category

### 4. My/Other Store Assets & Edit
- PAP Logo Above Price After Purchase (Assets) (Asset links to Price After Purchase About Page with logo and Description)

### 5. Price After Purchase About
- Arells' Price After Purchase system is a market innovation that removes bear markets (markets in which you lose money selling assets) out of financial systems... Learn More (Coming Soon)

### 6. My Store Asset
- Edit: On-Off button Public/Private

### 7. My/Other Store**
-- ([automatically loads latest])
- Bottom-Left[Bell]<light. (only after logged in) Separate Divs for all hovering buttons.
- (Private Art) (Public Art)

### 8. LinkTree Links... 
- MetaTag Description: "Profile/Asset Category"
- MetaTag Image(Profile): large-profile|image.name, small-profile|description

### 9. Home
- If logged in [(View My Store), (The Price After Purchase System), Contact (Instagram/Discord) by Category, (Log-Out)]

### 10. Bell
- "Congratulations xxxx! Your Art xxxx Sold to xxxx for xxxx", You've made xxxx in profit!".
- Email Notifications
- Notifications "you'll be earning...X after Purchasing" when collector changes purchase.

#### After Testing and Before Launch: 
- Send 1 - 2 week notification about promotional campaign to make sure you set your category so we can target who to sell your art to. Arells Abstracts, Arells Photography, Arells Illustrations. And talk about more features to be added in our own Wallet.
________________________________________________________________________________________________________________________________________

## Transition to DIGITAL ART MARKET

### Welcome to Arells! Never lose money selling art! [Start Selling]

### Price After Purchase About**
- Create link to Individual PAP GitHub Technical (Learn More)
- Create AUM Tracker (for all Current Prices)

### Memory based Art creation
- We don't allow deleting due to our memory-based art creation method. Your life's memories are valuable because (no matter how good or bad they are) they can never be deleted. The same philosophy rings true with Arells. Memory based Art creations ensures no art (no matter how good or bad) can ever be deleted thus ensuring its overall sustained value-creation.

________________________________________________________________________________________________________________________________________

## DIGITAL ART MARKET

- Rename Production Repo (Arells Marketplace)
- Wallet Logs you off After 10 minutes of innaction (review Bank Apps)
- "Store Name is Taken Error, and if Asset Name is taken"
- NFTs = Digital Art,
- Seed Phrase = Vault Code
- Connect Wallet = Connect Store, 
- Public Key = Address, 
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
  
#### Wallet(Store):
- USDC only (On Polygon until Ethereum 2 Upgrade is complete (100,000 TPS, lower gas fee L2s (Keep users informed)
- Phase out Crossmint (if they won't include our own Logo/Name in Email/Payment info)
- Rarimo (CCTP) Circle?
- Extensions: Chrome, Edge, Brave, Opera, iOS, PlayStore

##### Other:
-	`onError(event => fail()}` for failed images
