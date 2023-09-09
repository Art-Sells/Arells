## Arells Build Notes...

## MVP
- Pages separated like so: main/asset/"asset-name", main/"profile-name"
- Start with Polygon/Coinbase (USDC) [use GPT4 as help] [CrossMint Payment (Integrate Arells in Email) Api... Contact sales for Bank Statements]
- Ensure Each Page has differing MetaDescriptions
- Add "Change-After-Test" over every href.
- Change Home.css everytime updloading (ask GPT4 About Metadate reloading)?
- Don't Forget About SiteMap/s (only for pages to be shown)
- Remove "Wallet ConnecteD"

### Wallet: 
- Coinbase/USDC Wallet only.

### Home
- If logged in [(View My Store), Contact, (Log-Out)]
- If not logged in [Sign-Up/Log-In]
- Log-In/Sign-up with Google/Apple/Facebook/Etc

### Sign-Up
- Sign Up with Google/Apple/Facebook/Etc
- Proof-of-Creation (Website/Social-Media-Links) to prevent plagarism for artwork creating. (Verified Check... No Verified check for buyer)
- Terms & Conditions Agreement
- ##### "Welcome! You are now a pioneer of a store that will revolutionize not just the art industry, but asset markets everywhere. Before Arells, anyone could lose money on anything they sold, but now *thanks to Arells, all this changes. Buyers of your artwork will never lose money if they choose to sell your artwork, this means more money not just for you, but for your prospective buyers forever.*" For any questions, reach out to us on Discord or Email. [OK].

### My Store
-- ([automatically loads latest])
- Top-Left[=]-(if connected),[/\]-(if not connected) (See HOME section) 
- Top-Right[Cart][Connect Wallet]-if not connected
- Bottom-Right[+]<black. [Connect Wallet]-if not connected
- Bottom-Left[Cash Register]<light. [Connect Wallet]-if not connected. Separate Divs for all hovering buttons.
- Name & Description: Maximum Number of Characters.
- Theme: Arells Logo needs to be 300-500px (on all pages (Home/etc))
- - **Created**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Sold"
- [For Sale]-black line, [Not For Sale]-silver line(if clicked it goes automatic to For Sale), [Sold]greyed
- - **Collected**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Not For Sale"
- [For Sale]-black line, [Not For Sale]-silver line(if clicked and no PAP set, set PAP (Refer to ***After Purchase*** * ***After PAP Set*** sections) if PAP set, it goes automatic to For Sale)
 
#### Creating Mechanics
- Images are not minted until images are purchased (Digital Fingerprints "Revealed After Purchase"). *Inform Users about Free NFT Creation/Minting process*
- PAP price calculated 50x from price listed by creator (After Sale: You Keep... 50%, Buyer Keeps... 47%, Fees... 3%)...
- 1 Blockchain (Polygon)--- This is automatically chosen for buyer... prices in USDC
- Create AUM Tracker (for all Current Prices)
 
### My Store Asset   
- Top-Left[=]-(if connected),[/\]-(if not connected) (See HOME section) 
- Top-Right[Cart][Connect Wallet]-if not connected
- Bottom-Right[+]<black. [Connect Wallet]-if not connected
- Bottom-Left[Cash Register]<light. [Connect Wallet]-if not connected. Separate Divs for all hovering buttons.
- Images here render small pixels
- Name & Description: Maximum Number of Characters.
- Theme: Arells Logo needs to be 300-500px (on all pages (Home/etc))
- - **Created**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Sold"
- [For Sale]-black line, [Not For Sale]-silver line(if clicked and no PAP set, set PAP (Refer to ***After Purchase*** * ***After PAP Set*** sections) if PAP set, it goes automatic to For Sale), [Sold]greyed
- - **Collected**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Not For Sale"
- [For Sale]-black line, [Not For Sale]-silver line(if clicked and no PAP set, set PAP (Refer to ***After Purchase*** * ***After PAP Set*** sections) if PAP set, it goes automatic to For Sale)

### Cash Register
- Notifications on who bought what at how much (Squared for sharing)
- Send Email After Purchase 
  
### Other Store
-- ([automatically loads latest])
- Top-Left[/\]-([My-Store]if connected)([Home]if not connected)
- Top-Right[Cart]
- Bottom-Left & Right -- Nothing
- - **Created**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Not For Sale"
- [Add-To-Cart]-Use Prototype as Reference, [Not For Sale]-greyed, [Collected]-greyed(if I'm the collector)
- - **Collected**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Not For Sale"
- [Add-To-Cart]-Use Prototype as Reference, [Not For Sale]-greyed,

### Other Store Asset       
- Top-Left[/\]-([My-Store]if connected)([Home]if not connected)
- Top-Right[Cart]
- Bottom-Left & Right -- Nothing
- Images here render small pixels
- - **Created**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Not For Sale"
- [Add-To-Cart]-Use Prototype as Reference, [Not For Sale]-greyed, [Collected]-greyed(if I'm the collector)
- - **Collected**:
- Price After Purchase - To Be Set (if price not yet set purchased) = "Not For Sale"
- [Add-To-Cart]-Use Prototype as Reference, [Not For Sale]-greyed,

### Cart 
- Arells [Arells uses Crossmint as it's payment provider] info at bottom.  

#### After Purchase:
-- [If not Signed/logged in] = message: {Sign-up or Log-in to set new Price After Purchase so you can make money off your purchase}[dismiss]
- Buyer must list new PAP price (no lower than previous purchase price)[Calculate earnings: You Keep... 47%, *insert-creator-name* Keeps... 50%, Fees... 3%].
- Message (notifications-cash-register) to seller: "Congratulations xxxx! Your Art xxxx Sold to xxxx for xxxx", You've made xxxx in profit!".

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
- generateMetadata must be async for dynamic changes
- *clear Browsing/Cache Data before checking*
- Google Search Console Index (with sitemap)

#### Before AWS Upload (research how to reset server... or is it better to wait for server to reload (changing times of TTL, etc...))

________________________________________________________________________________________________________________________________________

## DIGITAL ASSET STORE

- NFTs = Digital Assets, 
- Connect Wallet = Connect Store, 
- Public Key = Address, 
- Private Key = Key

#### Store (Default)
- Includes all Arells Website Components
- Build with Circle Wallet As A Service? (USDC) ***Connects to bank account once and automatically converts USDC with purchacing***                                           
- Change all NFT words (WebApp/Twitter/GitHub/Crunchbase) into "Digital Asset"
- Heavy KYC/AML [USDC -to-bank- transfers only] through Integrating Apple-Pay & Google Pay Credit Card with USDC "purchase".

#### Seller-Created/Collected
- Create Categories (General, Illustrations, etc)
- Check how GitHub Integrates Profile Image with Profile Change (integrate this in MetaImage)
- - Proof-of-creation 70x PAP for Copyright Proven Artistic Works
- - Proof-of-ownership for major assets.

#### Vault (Slide-Up)
- NFT Collections (Ability to Transfer & Receive)
- USDC Transfer to Bank Account (Beam Cash Out API?)
  
#### Wallet:
- USDC only (On Polygon until Ethereum 2 Upgrade is complete (100,000 TPS, lower gas fee L2s (Keep users informed)
- Phase out Crossmint (if they won't include our own Logo/Name in Email/Payment info)
- Rarimo (CCTP) Circle?
- Extensions: Chrome, Edge, Brave, Opera, iOS, PlayStore

##### Other:
-	`onError(event => fail()}` for failed images
