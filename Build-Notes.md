# Arells Build Notes...

## Arells Cryptocurrency Marketplace MVP

## Arells v1

### Test Offline
VavityTester:
- When fixing price mechanism, stop git
- *revert back to this commit for Wallet and Asset connection implementations: Wallet and Asset connection offline tests complete*
- *revert back to this commit for Wallet and Asset connection implementations before Auto Checks: Metamask wallet connection successful test*
1. Aggregate Section (Top of page, above everything)
Display: When any wallet has assetConnected === false && depositPaid === true
Text:
"Your 'ETH' amount increased in some of your wallet/s."
"Before connection: $ [sum of wallet balances * assetPrice]" — sum walletBalances[address] * assetPrice for all wallets needing connection
"After connection: $ [sum of wallet balances * vapa]" — sum walletBalances[address] * vapa for all wallets needing connection
2. Initial Connection Section OR "Connect More Ethereum" Section (Above "VAPA Breakdown")
Location: Above the "VAPA Breakdown" section, below aggregate section
Logic: Per wallet type (MetaMask/Base) — show one or the other, mutually exclusive
A. "Connect More Ethereum" Section (when depositPaid === true && assetConnected === false)
Display: When wallet has assetConnected === false && depositPaid === true
For each qualifying wallet, show:
"Your 'ETH' amount increased."
"Before connection: $ [walletBalance * assetPrice]" — use walletBalances[walletAddress] * assetPrice
"After connection: $ [walletBalance * vapa]" — use walletBalances[walletAddress] * vapa
"Connect More Eth" button (calls handleConnectAsset(walletType))
Hide: Initial connection section content for this wallet
B. Initial Connection Section (when depositPaid === false OR depositPaid === null)
Display header ONLY if depositPaid === null (for any wallet):
"(ETH) $ [assetPrice] "
"(ETH) with Arells: $ [vapa]"
Otherwise (depositPaid === false), continue with wallet-specific info:
Structure:
  MetaMask (if depositPaid === false for MetaMask wallet)  [Show wallet-specific info]  [CONNECT ETHEREUM button]  Asset Connected: [Yes/No]    Base (if depositPaid === false for Base wallet)  [Show wallet-specific info]  [CONNECT ETHEREUM button]  Asset Connected: [Yes/No]
Wallet-specific info (only if depositPaid === false for that wallet):
If walletBalances[address] >= 0.0000001:
"before connection: $ [walletBalance * assetPrice]"
"after connection: $ [walletBalance * vapa]"
If walletBalances[address] < 0.0000001 or balance is null:
"Add Eth to your wallet to calculate"
3. "VAPA Breakdown" Section
Location: Below all the sections above (keep current location, lines 672-776)
Remove: The ConnectMoreEthSection component that appears above each wallet card inside the loop (lines 726-733)
Keep: All other wallet display logic as-is
Order of Sections (top to bottom):
Aggregate Section (if any wallets need "Connect More")
Initial Connection Section OR "Connect More Ethereum" Section (mutually exclusive per wallet type)
Shows "Connect More Ethereum" if depositPaid === true && assetConnected === false
Shows Initial Connection if depositPaid === false
Shows header (rotated assetPrice) ONLY if depositPaid === null (at least one wallet)
VAPA Breakdown Section (with wallet cards — no Connect More sections inside) 
- - if you withdraw funds in each wallet (all the way up to zero even with Connect More Ethereum), (after disconnection), the funds should reflect that based on: cVactTaa should equal balanceAtAssetConnection, but if wallet amount is less than cVactTaa, then cVactTaa should equal wallet amount... cVactTaa should neevr go below 1 wei
- - Test import wallets (that are already connected) (from base/metamask and vice versa)
- - Test Connect More Eth when wallets are all disconnected...
- - Test multiple account switches (inside wallets (and wallet connections)), how it affects "Connect New Wallet" (triggered if no wallets exist from json) 
- - Delete Metamask/base extensions and test (on safari)
- - - Create "Metamask/base needed" modal" (integrate into mobile/desktop online test)
- - Test to see if you don't have enough eth and try to connect what it does.
- - MAYBE remove this alert (right before asset connecting modal appears): Error connecting asset: Failed to fetch 


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
- Button and Chart (loading) stays loading until Vapa appears <- get from VavityTester
- If acVatoi != 0, then hide "Connect Bitcoin to begin"
- Chart (Account):
- - Left
- - - My Portfolio
- - - Investment: acVact $0
– - - Losses (default): $0
– - - Profits (replaces losses only if acdVatoc is > 0.00000): acdVatoc + $0 (formatCurrency from VavityTester.tsx) (as small as the smallest decimal it'll show. if it increases, then raise the decimal)
- - Right
- - - Line Graph
- - -  Market Status: Bull (🐂) {for any prifits} or Sloth (🦥) {for no profits}… 
- - - Bull: Show modal explanation
- - - Sloth: Show modal explanation

Login-Signup pages (Test with 2-3 accounts):
- Login/Signup with Google/Apple (reconfigure pages)
- Go back and test again
- - Connect
- - - Reload
- - - Cancel
- - - Confirm
- - Connect More 
- - - Reload
- - - Cancel
- - - Confirm
- - Withdraw
- - Import wallets (to and from)
- - Multiple wallets (not connected)
- - - Connect
- - - - Reload
- - - - Cancel
- - - - Confirm
- - - Connect More 
- - - - Reload
- - - - Cancel
- - - - Confirm
- Allow Vapa to increase (if possible) and watch chart and profits/losses
- In notion:  
- - TTA(Total Tracked Assets)/Revenue
- - - (current) Solid Marketplace (interior) & Liquid Marketplace (exterior)
- - - chart
- - Users
- - - (current) number of email created, date, time, etc
- - - chart





### Test Online (both desktop(multiple browsers)/mobile):
- change .env variables from NEXT_PUBLIC
- test with 2-3 masstester@gmail.com accounts differing amounts (view all s3 jsons and check Arells Ethereum Wallet amount)
- - Connect
- - - Reload
- - - Cancel
- - - Confirm
- - Connect More 
- - - Reload
- - - Cancel
- - - Confirm
- - Withdraw
- - Import wallets (to and from)
- - Multiple wallets (not connected)
- - - Connect
- - - - Reload
- - - - Cancel
- - - - Confirm
- - - Connect More 
- - - - Reload
- - - - Cancel
- - - - Confirm
- - Allow Vapa to increase (if possible) and watch chart and profits/losses
- - In notion:  
- - TTA(Total Tracked Assets)/Revenue
- - - (current) Solid Marketplace (interior) & Liquid Marketplace (exterior)
- - - chart
- - Users
- - - (current) number of email created, date, time, etc
- - - chart
- and NEXT_PUBLIC for AWS (change back then change back to AWS for local tests *always* in all APIs & aws-config)
- Change AWS Access Key from PUBLIC to PRIVATE (find all files that have this and change them)
- - save/update .json info every second to ext Dsk (then every day save/update cold)
(view all s3 jsons and check Arells Ethereum Wallet amount)

## Privacy Policy
- Look


## Loading Modules in all pages
- All of them fade in and out (same as modules and pages in vavity.info)
- Ethereum png at center in every page apart from home, sign-up/log-in, privacy policy

## After Test
- Save VavityCodeBase (with everything that has "Vavity" from Arells) architecture Offline (for testing) and online version (for deployment) and entire vavity API (vapa-mechanism and aggregator), chart (bull/sloth), aggregator... Then update Vavity Git
Vavity Architecture:
Separate Vavity architecture Offline (for testing) and prepare online version (for deployment)

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
- - - Losses: (for sloth) $0
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
- Message up-top (if cVactTaa =! wallet amount) "Your "ETH" amount increased in some of your wallet/s. ETH amount before connection: total wallet amount from assetConnected no, after connection: total vapa wallet amount from assetConnected no"  (Connect More (ETH)) Button -> takes to wallet
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
- (random {rotated} asset price dollar amount), with Arells it would be worth (vapa dollar amount) (Connect Ethereum) (with (Metamask)/(Base)) <- use function from VavityTester.tsx (if Metamask or other wallet not connected, automatically try to connect wallet)
- - Modal: Connecting Wallet (until wallet address have been fetched, otherwise connection cancelled)
- - Modal for Alert (from Vavity tester): Error connecting metamask: Request of type 'wallet_requestPermissions' already pending for origin http://localhost:3000. Please wait.
- - Modal: Connection Canceled (ok [reloads page]) <- get alert from VavityTester ... it should also pop up if this shows: 
- - Modal (for new wallet connection): Wallet Connection Successful, Connect Ethereum to Begin .5% fee per new assets. (Yes) <- opens asset connection (no) <- closes modal (get from vavitytester)
- connected wallet: your ETH amount: before connection: asset price dollar amount, after connection: vapa dollar amount (Connect Ethereum) (with (Metamask)/(Base)) <- use function from VavityTester.tsx (if Metamask or other wallet not connected, automatically try to connect wallet)
- - Modal (for already connected wallet connected): Connect Ethereum to Begin .5% fee per new assets. (Yes) <- opens asset connection (no) <- closes modal (get from vavitytester)
- - Modal: Connecting (Loader) Ethereum, please wait... (do not reload page) <- get from vavity tester
- - Modal: Connection Canceled (ok [reloads page]) <- get aleart from VavityTester
- If acVatoi != 0, then hide "Connect Ethereum to begin"
- Get From VavityTester: Auto checks (every 10 or so seconds): if cVactTaa of matching Wallet Address is not 0 and is less than Wallet Address amount, if so then:
- Chart (after wallet connection):
- - Left
- - - My Portfolio
- - - Investment: acVact $0
– - - Losses (default): $0
– - - Profits (replaced Losses only if acdVatoc > 0.00000): acdVatoc + $0 (formatCurrency from VavityTester.tsx) (as small as the smallest decimal it'll show. if it increases, then raise the decimal)
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
- (connect ethereum to begin): if json has no wallets
- - (if cVactTaa =! wallet amount): New section: "Your “ETH” amount increased, before connection: asset price dollar amount, after connection: vapa dollar amount (Connect More Eth) <- button opens up new deposit ask and if its complete, then the new deposit <-get from VavityTester
- - For connected wallets & assets: Lists Wallet Addresses and cVactTaa and cVact
- - For connected wallets, not connected assets:
- - - (Connect Eth)
- - For non-connected wallets
- - - (Connect More Wallets (metamask-base))
- - Modal: Preparing (ETH) Wallet (to connect asset (take from VavityTester)) 
- - Modal: Connecting (ETHEREUM) Asset .5% fee per new assets.

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
- Replace VAPA api with real API and test (connections) on VavityTester
- 2-3 accounts, multiple connects (monitor for 2-3 days)with real-api
- - Connect
- - - Reload
- - - Cancel
- - - Confirm
- - Connect More 
- - - Reload
- - - Cancel
- - - Confirm
- - Withdraw
- - Import wallets (to and from)
- - Multiple wallets (not connected)
- - - Connect
- - - - Reload
- - - - Cancel
- - - - Confirm
- - - Connect More 
- - - - Reload
- - - - Cancel
- - - - Confirm
- - Allow Vapa to increase (if possible) and watch chart and profits/losses
- - In notion:  
- - TTA(Total Tracked Assets)/Revenue
- - - (current) Solid Marketplace (interior) & Liquid Marketplace (exterior)
- - - chart
- - Users
- - - (current) number of email created, date, time, etc
- - - chart


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
- - FAQ: 
- - - External vs Internal (Arells) Pricing system: Arells is an experimental company created to see whether we are ready to let go of bear markets.
- - - Asking for deposit more than once: Only if you log-out and log back in withouht accepting or denying the deposit
Keep marketing, dependent on growth after 1-2 weeks:
- Updates (oDAO, FndrsINC, etc)
- Increase ETHEREUM_RPC-URL


### Other (if Time Permits)
- Flip sloth pngs horizontally
- Fix (if VavityAggregator jsons are deleted (wallet connected (connect asset not poping up issue) ))
- Error connecting asset: existingWalletsBeforeDeposit is not defined (Modal?) <-vavityTester
- Fix (signOut/sign-up/log-in issue) loading after button click success stays true forever... add "await"?
- Fix (View Account) slowness issue (Add Preparing Account loading we time out at least 2 seconds before this loads)
- Remove console.logs from all files...
- Resolve Google/Bing/Yahoo Search Tab issues (Bing Webmaster Tools) (Add Unique Metatags to all recurring pages), look into favicon blurriness issue

















## Arells 2 & Beyond


- Add new assets (VAPA/wallet-connection)
- - Assets have their own page and token values (that should be implemented in fetchBalance and everywhere these token values are used) (connect asset)

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



