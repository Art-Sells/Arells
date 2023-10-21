## Arells Build Notes...

## MVP
- Pages separated like so: main/store-name/asset-name
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
- Connect Address to Store-LogIn. If Address connected to Store/Automatically logs you in 

### Home
- If logged in [(View My Store), (How To Make Money), About, Contact, (Log-Out)]
- If not logged in [Sign-Up/Log-In]
- Log-In/Sign-up with Google/Apple/Facebook/Etc

### Sign-Up
- Sign Up with Google/Apple/Facebook/Etc
- Account Created! (Create Store)
- ### Welcome to Arells! Never lose money selling art! [Start Selling]

### Create Store
- Logo: Default Store Logo
- Store Name & Store Description: Maximum Number of Characters.
- (Save Changes)

### Edit Store
- Logo: Default Store Logo
- Store Name & Store Description: Maximum Number of Characters.
- (Save Changes)

### My Store
-- ([automatically loads latest])
- Top-Left[/\]- (See HOME section) 
- Top-Right[Cart][Connect Wallet]-if not connected
- Top-Center[Edit Store]
- Bottom-Right[+]<black. [Connect Wallet]-if not connected
- Bottom-Left[Bell]<light. (only after logged in) Separate Divs for all hovering buttons.
- Logo: Default Store Logo
- Store Name & Store Description: Maximum Number of Characters.
- Theme: Arells Logo needs to be 300-500px (on all pages (Home/etc))
- - **Created**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Sold"
- [For Sale]-dark-gray, [Not For Sale]-silver, [Sold]white
- - **Collected**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Not For Sale"
- [For Sale]-dark-gray, [Not For Sale]-silver,
 
#### Creating Mechanics
- Once confirmed -> (My Store Asset Edit page) {Art Created Modal} {Item Automatically in Created Profile Page PAP & Price = Lines [[Not For Sale]}
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
- Art Name: Maximum Number of Characters.
- Remove "Owned By" if not collected/bought/minted.
- Theme: Arells Logo needs to be 300-500px (on all pages (Home/etc))
- - - Edit Art(Connect Wallet if not connected): Price (set)?: shows what you keep, creator keeps, fees, etc. [Save Changes (Price After Purchase Error if not correct] Buyer must list new PAP price (no lower than 2x of price) [Calculate earnings: Next Collector Keeps... 47%, *insert-creator-name* Keeps... 50%, Fees... 3%]... [Save Changes]
- - **Created**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Sold"
- [For Sale]-dark-gray, [Not For Sale]-silver, [Sold]white
- - **Collected**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Not For Sale"
- [For Sale]-dark-gray, [Not For Sale]-silver,

### Notifications
- Send Email After Purchase 
  
### Other Store
-- ([automatically loads latest])
- Top-Left[||]-([My-Store]if connected)([/\]if not connected)
- Top-Right[Cart]
- Bottom-Left & Right -- Nothing
- Image Default: Store Icon
- Name Default: Unnamed Store
- Description Default: Creations & Collections
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
- (Connect Wallet if not connected)
- Arells [Arells uses Crossmint as it's payment provider] info at bottom.  

#### After Purchase (Modal)
-- [If not Signed/logged in] = message: {Congratulations on your Purchase! Sign-up or Log-in to Make Money from your Purchase}[dismiss]
-- [If Signed/logged in] = Edit (View My Store Asset)
- Message (notifications-cash-register) to seller: "Congratulations xxxx! Your Art xxxx Sold to xxxx for xxxx", You've made xxxx in profit!".
- Email Notifications (see cash register)

#### Image/s
- Check how GitHub Integrates Store Image with Store Change (integrate this in MetaImage)
- Created & Owned By (Character Limit Links)
     
#### LinkTree Links... 
***Dynamic Metadata (for Profile/Assets), Static Metadata (for Non-Profile/Asset Pages)***
- MetaTags Social-sharing-images: AWS Cloudfront?
- MetaTag Title: "Store/Asset Name"
- MetaTag Description: "Store/Asset Description"
- MetaTag Image(Market): large-store|image.name, small-store|description
- MetaTag Image(Asset): small-store|image.name, large-store|image.name
- metadata const (upgrade from generateMetadata) must be async for dynamic changes
- *clear Browsing/Cache Data before checking*
- Google Search Console Index (with sitemap)

#### After Testing and Before Launch: 
- Store Private Key Cold
- Delete Branched-Repo,
- Send 1 month - 2 week notifications on new Features to be added (On Arells you won't be selling your art as a person, you'll be selling your art as a store so I'd highly recommend to think about a unique name and logo before you create your store on Arells {point to free AI logo creators}). (Public|Private Mode{First}/Notifications Center etc, Help Artists Find Buyers/Add Featured Artists from everyone who Responded (After we launch our Wallet))

##### Misc Add-Ons (If enough time before launch)
**My/Other Store Assets & Edit**
- PAP Logo Above Price After Purchase - links to Price After Purchase About Page with logo and Description
**Price After Purchase About**
- Arells' Price After Purchase system is a market innovation that removes bear markets (markets in which you lose money selling assets) out of financial systems... Learn More (Coming Soon)
________________________________________________________________________________________________________________________________________

## Transition to DIGITAL ASSET STORE

### Price After Purchase About**
- Create link to Individual GitHub Technical (Learn More)

### My Market
- Connect Multiple Store Addresses to one Store/Log-In (Feth connections on connection and Auto-Log-In) if connected. If address is already connected to store (Error Message)
________________________________________________________________________________________________________________________________________

## DIGITAL ASSET MARKETPLACE

- Rename Production Repo (Arells Marketplace)
- "Store Name is Taken Error, and if Asset Name is taken"
- NFTs = Digital Assets, 
- Connect Wallet = Connect Store,
- Seed Phrase = Vault Code
- Public Key = Store Address, 
- Private Key = Store Key(Do Not Show and Allow Outbound USDC Transfers, only Withdrawals to Banks and Inbound Transfers [For Security purposes]).
- Make API Key Private
- Does Sitemap.xml need to be in public Directory for it to be read by Google?

### Sign-up
- Proof-of-Creation (Website/Social-Media-Links) to prevent plagarism for artwork creating. (Verified Check... No Verified check for buyer)
- Terms & Conditions Agreement

### Home

#### How To Make Money:
{As A Collector: Buy, Set Price After Purchase (list profits), Share}{As A Creator: Create, Set Price and Price After Purchase, Share} [VIEW STORE]-(if no art collected (Created), else (Collected)).

#### About
- Created by artists for artists. Arells was created from a deep frustration of how difficult it is to make a living as artists in a society that doesn't value art to the same degree as other careers. But now thanks to the technology powering cryptocurrencies (blockchain), all this changes. Neither you nor buyers of your artwork will ever lose money selling art thanks to a new market system we're calling "Price After Purchase". With our Price After Purchase system (PAP Logo - link to PAP Description), bear markets (markets in which people sell assets at a loss) are obsolete. Arells would have been impossible to create before blockchain technology and so... This marks you as a pioneer of a revolution that will change not just the art industry, but asset markets everywhere.

### My/Other Market
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
 
### My Market Asset
- Edit: On-Off button List-For-Sale/Public/Private
 
### Bell
- Notifications "you'll be earning...X after Purchasing" when collector changes purchase.

### Cash-Register (Slide-Up)
-- Store dissapears on top left  replaced by Bell.
- USDC Transfer to Bank Account (Beam Cash Out API?)

### Vault (Slide-Up)
- NFT Collections (Ability to Transfer & Receive)
  
#### Wallet(Market):
- USDC only (On Polygon until Ethereum 2 Upgrade is complete (100,000 TPS, lower gas fee L2s (Keep users informed)
- Phase out Crossmint (if they won't include our own Logo/Name in Email/Payment info)
- Rarimo (CCTP) Circle?
- Extensions: Chrome, Edge, Brave, Opera, iOS, PlayStore

##### Other:
-	`onError(event => fail()}` for failed images
