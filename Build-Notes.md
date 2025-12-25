# Arells Build Notes...

## Arells Cryptocurrency Marketplace MVP

## Arells v1

### Test Offline
VavityTester:
- Connect Ethereum with Metamask/Base to begin.
- When fixing price mechanism, stop git

In the json do this after the json is creationed:

all these should start of as exactly like this for each Metamask and Base wallet:

walletConnected: false <- (this should change to false after successful wallet disconnection)
walletConnectionCanceled: false <- (this should change to true after wallet connection canceledc and back to false after wallet connection button clicked again)
walletConnecting: true <- (this should change to false  if walletConnected is true and back to true if walletConnected is false)

assetConnected: false <- (this should change to true after successful asset disconnection)
assetConnectionCancelled: false <- (this should change to true after asset connection canceled and back to false after asset connection (deposit) is clicked )
assetConnecting: false <- (this should change to true if asset connection (deposit) is clicked and back to false after deposit)

if 

walletConnected: false
walletConnectionCanceled: false
walletConnecting: true

then

(connecing) button placeholder should show...

if

assetConnected: false
assetConnectionCancelled: false
assetConnecting: true

then

(waiting for deposit) button placeholder should show...

if 

walletConnected: true
walletConnectionCanceled: false
walletConnecting: false 

then

(Connect Ethereum with Metamask/Base) button should show

if 

assetConnected: true
assetConnectionCancelled: false
assetConnecting: false

(Connected Ethereum with Metamask/Base) button placeholder should show

if 

walletConnected: false
walletConnectionCanceled: true
walletConnecting: true

or if 

assetConnected: false
assetConnectionCancelled: true
assetConnecting: false

(Connect Ethereum with Metamask/Base)  button should show

- - Fix cpVatoc VAPA issue
- - Test to see after asking for wallet connection, if I reload the page after confirmation (before wallet ID creation), if issues preside...
- - Afer wallet connection, if asset connection canceled, no wallet balances should show...
- - If page reloads before connect assets (deposit) or connecti wallet is confirmed or cancelled, buttons (of Metamask or Base) should remain prior to what they were "waiting for deposit" or unclicbable and an aleart should pop up saying "check wallet" 
- - Auto checks (every 10 or so seconds): if cVactTaa of matching Wallet Address is not 0 and is less than Wallet Address amount, if so then:
- - - "Connect More (ETH) with (MM)/(CB)” Button appears and Ignores the funded:true/false
- - - message/alert: "Your “ETH” amount increased +"add wallet amount - cVactTaa here" Would you like to see your full (ETH) “total wallet amount” protected from bear markets? (YES) <- button opens up new deposit ask and if its complete, then the new deposit
- - if you withdraw funds in each wallet, (after disconnection), the funds should reflect that.
- - - cVactTaa should equal balanceAtAssetConnection if not, then it should equal walletBalance if walletBalance < balanceAtAssetConnection
- - Test multiple account switches (inside wallets), how it affects
- Fix: check to see (after first page load), if metamask/base wallet is connected (after undocking git program)
- check if cpVatoi/cpVact (only references AFTER deposit is paid)?
- Login/Signup with Google/Apple (reconfigure pages)


Chart (Home/Account): 
Home
- Chart:
- - Left
– - - (B)
- - - Investment: $4,000 (many random amounts)
- - - Profits: + $85,000
- - Right
- - - Line Graph
- - - (5 year/ 1 year/ 1 month/ 1week)
- - - Market Status: Bull (🐂) {for any prifits} or Sloth (🦥) {for no profits}… 
- - - - Bull: Show modal explanation
- - - - Sloth: Show modal explanation
Account
– (B) (VAPA): $90,000
- If acVatoi != 0, then hide "Connect Bitcoin to begin"
- Chart (Account):
- - Left
- - - My Portfolio
- - - Investment: acVact $0
– - - Profits: acdVatoi + $0 (formatCurrency from VavityTester.tsx) (as small as the smallest decimal it'll show. if it increases, then raise the decimal)
- - Right
- - - Line Graph
- - -  Market Status: Bull (🐂) {for any prifits} or Sloth (🦥) {for no profits}… 
- - - Bull: Show modal explanation
- - - Sloth: Show modal explanation

Vavity Architecture:
- Save entire vavity API (vapa-mechanism and aggregator), chart (bull/sloth), aggregator... Then update Vavity Git

Login/Signup with Google/Apple (re-configure LoginSignup pages):
- They don’t have to verify emails
– Account not found, create account.
Test with 2-3 masstester@gmail.com accounts differing amounts (view all s3 jsons and check Arells Bitcoin Wallet amount)

- and NEXT_PUBLIC for AWS (change back then change back to AWS for local tests *always* in all APIs & aws-config)
- - Separate Vavity architecture Offline (for testing) and prepare online version (for deployment)
- Change AWS Access Key from PUBLIC to PRIVATE (find all files that have this and change them)






### Test Online (both desktop/mobile):
- change .env variables from NEXT_PUBLIC
- test with 2-3 masstester@gmail.com accounts differing amounts (view all s3 jsons and check Arells Ethereum Wallet amount)
- - Run Vavity for a few minutes (with synthetic-api) to test system (with small amounts multiple accounts) ().
- - save/update .json info every second to ext Dsk (then every day save/update cold)
(view all s3 jsons and check Arells Ethereum Wallet amount)
- In notion:  
- - TTA(Total Tracked Assets)/Revenue
- - - (current) Solid Marketplace (interior) & Liquid Marketplace (exterior)
- - - chart
- - Users
- - - (current) number of email created, date, time, etc
- - - chart

## Loading Modules in all pages
- All of them fade in and out (same as modules and pages in vavity.info)

## After Test
- Save VavityCodeBase architecture Offline (for testing) and online version (for deployment)

### Home
Slogan
    [   [ chart ]
        [ Login ]
    ]
Arells powered by Vavity 
- Change color scheme (for modals also) to Purple
- Make slogan larger
- Chart:
- - Left
– - - (ETH)
- - - Investment: $4,000 (many random amounts)
- - - Profits: + $85,000
- - Right
- - - Line Graph
- - - (5 year/ 1 year/ 1 month/ 1week)
- - - Market Status: Bull (🐂) {for any prifits} or Sloth (🦥) {for no profits}… 
- - - - Bull: Show modal explanation
- - - - Sloth: Show modal explanation
- Powered By Vavity replces bottom "connect words"

### Account
- Change color scheme (for modals also) to Purpple
(A) ------- (Wallets)
- Are you 
ready to let go 
of bear markets?
– (B) (VAPA): $90,000
- Chart (before wallet connection):
- - Left
– - - (B)
- - - Investment: $4,000 (many random amounts)
- - - Profits: + $85,000
- - Right
- - - Line Graph
- - - (5 year/ 1 year/ 1 month/ 1week)
- - - Market Status: Bull (🐂) {for any prifits} or Sloth (🦥) {for no profits}… 
- - - - Bull: Show modal explanation
- - - - Sloth: Show modal explanation
- Connect Ethereum to begin <-words (with (Metamask)/(Base)) <- use function from VavityTester.tsx (if Metamask or other wallet not connected, automatically try to connect wallet)
- - Modal: Connecting Wallet (until wallet address have been fetched, otherwise connection cancelled)
- - Modal (if page reloads before connection asked(only for Metamask)): Check Wallet (ok) <--- should dissapear after connection successful
- - Modal: Connection Canceled (ok)
- - Modal (from waiting for deposit in Vavity Tester): Wallet Connection Successful, Connecting Ethereum .5% (ok)
- - - (Connecting (Loader) Ethereum)<-replaces "Waiting for Deposit"
- - Modal: Connection Canceled (ok)
- - Modal (if page reloads before connection asked): Check Wallet (ok) <--- should dissapear after connection successful
- If acVatoi != 0, then hide "Connect Ethereum to begin"
- Get From VavityTester: Auto checks (every 10 or so seconds): if cVactTaa of matching Wallet Address is not 0 and is less than Wallet Address amount, if so then:
- - - "Connect More (ETH) with (MM)/(CB)” Button appears and Ignores the funded:true/false
- - - Modal: "Your “ETH” amount increased +"add wallet amount - cVactTaa here" Would you like to see your full (ETH) “total wallet amount” protected from bear markets? (YES) <- button opens up new deposit ask and if its complete, then the new deposit
- Chart (after wallet connection):
- - Left
- - - My Portfolio
- - - Investment: acVact $0
– - - Profits: acdVatoi + $0 (formatCurrency from VavityTester.tsx) (as small as the smallest decimal it'll show. if it increases, then raise the decimal)
- - Right
- - - Line Graph
- - -  Market Status: Bull (🐂) {for any prifits} or Sloth (🦥) {for no profits}… 
- - - Bull: Show modal explanation
- - - Sloth: Show modal explanation
- ( Wallets )  
- Powered by Vavity (V) (link)

### Wallets
- Change color scheme (for modals also) to Purpple
"Connect New Wallet" (triggered if no wallets exist from json) <- use function from VavityTester.tsx
- Lists Wallet Addresses and cVactTaa and cVact
- Connect New Asset
- - Modal: Preparing (ETH) Wallet (to connect asset (take from VavityTester)) 
- - Modal: Connecting Asset (ETHEREUM).5% one-time fee, etc, etc, agree (metamask/base)?
- - Modal: Connecting/connected (ok)

### Metatags/ Description (all pages.tsx & components)
- Alter: Descriptions & BannerImages [large slogan] (changge Bitcoin to Ethereum)
- - Are you ready to let go of bear markets? Connect your investments.
- Refactor (optimize with Cursor) Meta-tags {show AI and ask it why it displays home page ps and not meta tags}?
- - (with vavity.info) Submit to Google Search Console: Submit your sitemap and request indexing
- - Create a sitemap.xml: Helps Google discover all pages
- - Add a robots.txt: Allows crawlers to access your site
- - Build backlinks: Share your site to get it indexed faster

### Deployment (Test) Amplify/S3 Login
- Ensure that NEXT_PUBLIC is not invoked and remove .env hardhat config expositions
- Compare Main ENV with Test ENV before deployments
- Test (with vavity.info) on socials (DM's/etc)

## Final Test
- Remove typos from Arells/Vavity readmes, and UI
- 2-3 accounts, multiple connects (monitor for 2-3 days)with real-api

#### Deployment (Main) Amplify/S3 Login
- Test (with vavity.info) on socials (DM's/etc)
- Email/X-Twitter/LinkedIn+crunchbase(compeny-type: social experiment, assets, digital-assets)/: Are you ready to let go of bear markets? 

### After Completion
- Always Save Vavity JSON file data everyday offline (in case of breach)
- Delete Arells Readme roadmap
Users:
- Get Leads (search AI automoated options [use same format] from X, etc)
- Set Launch Date (and announce the features)
- - Review notes on phone
- - Look at notes for openings. 
- - Add "Discord" section for any questions
Keep marketing, dependent on growth after 1-2 weeks:
- Updates (oDAO, FndrsINC, etc)
- Increase ETHEREUM_RPC-URL


### Other (if Time Permits)
- Flip sloth pngs horizontally
- Fix (if VavityAggregator jsons are deleted (wallet connected (connect asset not poping up issue) ))
- Fix (signOut/sign-up/log-in issue) loading after button click success stays true forever... add "await"?
- Fix (View Account) slowness issue (Add Preparing Account loading we time out at least 2 seconds before this loads)
- Remove console.logs from all files...
- Resolve Google/Bing/Yahoo Search Tab issues (Bing Webmaster Tools) (Add Unique Metatags to all recurring pages), look into favicon blurriness issue

















## Arells 2 & Beyond


- Add new assets (VAPA/wallet-connection)
- - Assets have their own page (connect asset)

- After user accumulation and scaling, add Buy/Sell (add VatopGroups back), can buy high, can never sell below market price (sloth)
- Figure out way to save .JSON info into another very secure section (possibly offline for added security)
- Delete all Console Logs in LogIn/SignUp/Account/Buy/Sell/Disconnect/VavityContext

### UserContextWrapped
- if logged in for more than 5 minutes without use, automatically sign out and take to homepage.

### Home/Account
- Account/Withdraw/Sell/Buy/Transactions/BankAccount/Confirm (if not logged in) Revert To Home
- Contact us (Account/Home): Email
- Clean up Lagging Pages


### iOS & Android App (Chrome Extension) Wallet (after 1-2 years?)
Recommend Arells wallet and sunset all other wallets when Arells app revenue overtakes them
- iOS App (UI Layer)
- - Tagline: Are you ready to let go of bear markets?
- - Desc: Connect Digital Assets af you're ready to never see your investments lose value from bear markets losses. 
- - submission: A blockchain interface app that connects users to decentralized protocols. The app itself performs no custody or transactions, transactions are handled by the associated blockchain.
- Import Wallet

### Vavity-API (after 3-4 years)
.... (vavity ...c
... Are you ready to let go of bear markets?
... (Integrate Vavity))

### Pro-Natalism + Building Healthy Mind
- Daily Recommendation: 7-8~ hrs of daily sleep and a personal daily gratitude journal.
- P/T 25-30 hrs for prnts with kids (research slry). 40+ for those without (apart from Executive positions)



