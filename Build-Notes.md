# Arells Build Notes...

## Arells Cryptocurrency Marketplace MVP

## Arells v1

### Test Offline
VavityTester:
- Connect-wallet/Disconnect-wallet:
- When fixing price mechanism, stop git
- Connect (MM)(ETH) Asset to begin (if Metamask or other wallet not connected, automatically try to connect wallet)
- - Afer wallet connection, if asset connection canceled, no wallet balances should show...
- - if you deposit/withdraw funds in each wallet, (after disconnection), the funds should reflect that

Account Wallet:
- Keep profits with overall percentage gained (after first initial connect) and remove Arells Ethereum Price…
- Connect Wallet (new addition for extra wallets):
- - Connect existing wallet by entering address
- - - Gets wallet address and funds, inserts those funds into VavityAggregator cVactTaa

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

Test with 2-3 masstester@gmail.com accounts differing amounts (view all s3 jsons and check Arells Bitcoin Wallet amount)

- and NEXT_PUBLIC for AWS (change back then change back to AWS for local tests *always* in all APIs & aws-config)
- - Separate Vavity architecture Offline (for testing) and prepare online version (for deployment)
- Change AWS Access Key from PUBLIC to PRIVATE (find all files that have this and change them)

### Test Online (both desktop/mobile):
- change .env variables from NEXT_PUBLIC
- eMail verification (before connect)
 VavityAggregator
- test with 2-3 masstester@gmail.com accounts differing amounts (view all s3 jsons and check Arells Ethereum Wallet amount)
- - Run Vavity for a few minutes (with synthetic-api) to test system (with small amounts multiple accounts) ().
- - save/update .json info every second to ext Dsk (then every day save/update cold)
(view all s3 jsons and check Arells Ethereum Wallet amount)
- In notion:  
- - TVL/Revenue
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
- Change color scheme (for modals also) to Purpple
- Make slogan larger
arells 
    [ Slogan
        [ chart ]
        [ Login ]
    ]
powered by Chart:
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
- Make Phsychological slogan larger
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
- Connect (ETH) Wallet to begin (choose Metamask/Base) <- use function from VavityTester.tsx
- - Modal: Connecting (until wallet address have been fetched, otherwise connection cancelled)/connected (ok)
- - Modal: Connection Canceled 
- - - Connect (MM)(ETH) Asset replaces Connect (MM) Wallet
- - Modal: Connecting Asset (ETHEREUM).5% one-time fee, etc, etc, agree (metamask/base)?
- - Modal: Connection Canceled 
- Connect (MM)(ETH) Asset to begin <- use function from VavityTester.tsx (if Metamask or other wallet not connected, automatically try to connect wallet)
- If acVatoi != 0, then hide "Connect (MM)(ETH) Asset to begin"
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
- Connect New Wallet
- - Modal: Preparing (ETH) Wallet (to connect wallet (take from VavityTester)) 
- - Modal: Connecting Asset (ETHEREUM).5% one-time fee, etc, etc, agree (metamask/base)?
- - Modal: Connecting/connected (ok)

### Metatags/ Description (all pages.tsx & components)
- Alter: Descriptions & BannerImages [large slogan] (changge Bitcoin to Ethereum)
- - Emotionally protects your investments from bear markets. Connect your wallet and emotionally protect yourself from bear market losses.
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
- Email/X-Twitter/LinkedIn/: Emotionally protects your investments from bear markets. 

### After Completion
Save Vavity JSON file data everyday offline (in case of breach)
Users:
- Get Leads (search AI automoated options [use same format] from X, etc)
- Set Launch Date (and announce the features)
- - Review notes on phone
- - Emotionally protects your investments from bear markets. 
- - Add "Discord" section for any questions
Keep marketing, dependent on growth after 1-2 weeks:
- Updates (oDAO, FndrsINC, etc)
- Increase ETHEREUM_RPC-URL


### Other (if Time Permits)
- Flip sloth pngs horizontally
- Fix (signOut/sign-up/log-in issue) loading after button click success stays true forever... add "await"?
- Fix (View Account) slowness issue (Add Preparing Account loading we time out at least 2 seconds before this loads)
- Remove console.logs from all files...
- Resolve Google/Bing/Yahoo Search Tab issues (Bing Webmaster Tools) (Add Unique Metatags to all recurring pages), look into favicon blurriness issue












### iOS & Android App(work on this together)
- iOS App (UI Layer)
- - Tagline: Emotionlly protects your investments from bear market losses.
- - Desc: Connect Digital Assets and watch as it emotionally protects your investments from downturns. 
- - submission: A blockchain interface app that connects users to decentralized protocols. The app itself performs no custody or transactions, transactions are handled by the associated blockchain.





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

### Wallets
- Disconnect Wallet (only if they ask)
- Modal: 
- - Warning: disconnecting this wallet from Arells will emotionally subject you and your investments to bear-market losses of [show losses based on cVactTaa(multiplied-by)cpVact - cVactTaa(multiplied-by)ExternalPrice ]? (yes) (no)<- close
- Powered by Vavity (V) (link)

### Pro-Natalism + Building Healthy Mind
- Daily Recommendation: 7-8~ hrs of daily sleep and a personal daily gratitude journal.
- P/T 25-30 hrs for prnts with kids (research slry). 40+ for those without (apart from Executive positions)



