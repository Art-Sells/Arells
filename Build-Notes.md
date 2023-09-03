## Arells Build Notes...

## MVP
- Pages separated like so: main/asset/"asset-name", main/"profile-name"
- Start with Polygon/Coinbase (USDC) [use GPT4 as help] [CrossMint Payment (Integrate Arells in Email) Api... Contact sales for Bank Statements]
- Ensure Each Page has differing MetaDescriptions
- Add "Change-After-Test" over every href.
- Change Home.css everytime updloading (ask GPT4 About Metadate reloading)?
- Don't Forget About SiteMap/s (only for pages to be shown)

#### Wallet: 
- Coinbase/USDC Wallet only?

#### Home
- If logged in [About/Store/Contact]
- If not logged in [About/Log-in/Sign-Up/Contact]
- Contact (discord/email)
- Log-In with Google/Apple/Facebook/Etc

#### Sign-Up
- Sign Up with Google/Apple/Facebook/Etc
- Proof-of-Creation (Website/Social-Media-Links) to prevent plagarism for artwork creating. (Verified Check... No Verified check for buyer)
- Terms & Conditions Agreement
- ##### "Welcome! You are now a pioneer of a store that will revolutionize not just the art industry, but asset markets everywhere. Before Arells, anyone could lose money on anything they sold, but now *thanks to Arells, all this changes. Buyers of your artwork will never lose money if they choose to sell your artwork, this means more money not just for you, but for your prospective buyers forever.*" 

#### Buying Profile
-- {Latest/Best Sellers [automatically loads latest]) <Maybe integrate in full app?
- Top-Left(Store)<Sign-Up/Log-In>, Top-Right(Cart)<Connect Wallet> Separate Divs for all hovering buttons.
- Images here render small pixels
- Separate Divs for all hovering buttons.
- Remove (wallet connected)
- Name & Description: Maximum Number of Characters.
- Terms & Conditions Agreement
- Theme: Arells Logo needs to be 300-500px (on all pages (Home/etc))
- - [Prices Not Shown for unlisted items, only Owner's name]
  
#### Selling Profile ((After Log-in Connected Wallet))
-- {Latest/Best Sellers [automatically loads latest]) <Maybe integrate in full app?
- Top-Left(Arells), Top-Right(Cart), Bottom-Left(Add), Bottom-Right(Cash-Register) are Z-Indexed Sticky/Separate Divs for all hovering buttons.
- Minting [+] allows cropping for preview <Also for Profile Picture Upload                                                             
- Images here render small pixels
- Remove (wallet connected)
- Name & Description: Maximum Number of Characters.
- Theme: Arells Logo needs to be 300-500px (on all pages (Home/etc))
- - [Prices Not Shown for unlisted items, only Owner's name]  
  
#### Buyer-Created/Collected
- [Prices Not Shown for unlisted items, only Art Name]

#### Image
- Check how GitHub Integrates Profile Image with Profile Change (integrate this in MetaImage)
- Created & Owned By (Character Limit Links)
- [Prices Not Shown for unlisted items, only Creators/Owner's name]  

#### Cart
- "Wallet Connected" doesn't show up if cart isn't connected.
- Created Cart Number Function (Custom)   
- Arells [Arells uses Crossmint as it's payment provider] info at bottom.
  
#### Cash Register
- Notifications on who bought what at how much (Squared for sharing)  
                                                
#### Creating Mechanics
- Images are not minted until images are purchased (Digital Fingerprints "Revealed After Purchase"). *Inform Users about Free NFT Creation/Minting process*
- PAP price calculated 50x from price listed by creator (After Sale: You Keep... 50%, Buyer Keeps... 47%, Fees... 3%)...
- 1 Blockchain (Polygon)--- This is automatically chosen for buyer... prices in USDC
- Create AUM Tracker (for all Current Prices)
                                                
#### After Purchase:
- Buyer must list new PAP price (no lower than previous purchase price)[Calculate earnings: You Keep... 47%, *insert-creator-name* Keeps... 50%, Fees... 3%].

#### After PAP Set:
 1. "List For Sale? [List][DeList]{Both Open Modal} (On Buyer)... (Nothing Shows in Public Buyer)".
 2. If Yes, then "Add-to-Cart", if No then "Collected" (On Seller)[Can Edit PAP anytime]
 3. Message (notifications) to seller: "Congratulations xxxx! Art Sold to xxxx for xxxx, new PAP: xxxx"
 4. If/Then messages corresponding to above messages. 
 
#### LinkTree Links... 
***Dynamic Metadata (for Profile/Assets), Static Metadata (for Non-Profile/Asset Pages)***
- MetaTags Social-sharing-images: AWS Cloudfront?
- MetaTag Title: "Profile/Asset Name"
- MetaTag Description: "Profile/Asset Description"
- generateMetadata must be async for dynamic changes
- *clear Browsing/Cache Data before checking*

#### Before AWS Upload (research how to reset server... or is it better to wait for server to reload (changing times of TTL, etc))

                                                

