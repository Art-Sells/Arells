# Arells Build Notes...

## Arells Cryptocurrency Marketplace MVP

## Arells v1

### Test Offline
*Set back to fetching current bitcoin prices then, set to revert back to current price fetching after home*
- 
VavityTester:
– (Bitcoin) (VAPA): $dollar price 
- - My Portfolio (before anything is added)
- - - (Add Investments)
- - - - when button above clicked, it shows:
- - - - $ Amount: automatically displays Bitcoin Amount at the time of purchase (this should correspond and get the bitcoin price from the "date purchased" section) (this will end up being the cVatop after the submit button is clicked while cVact will always be VAPA) x bitcoin amount entered ... If for example VAPA after 01/05/26 is greater than bitcoinPrice on 01/10/26, then $ Amount should be based on VAPA and not bitcoin Price
– - - - $ Profits (default when no activity inside bitcoin amount section): (VAPA x bitcoinAmount) minus (Bitcoin Price x bitcoinAmount)  
- - - - bitcoin amount (section to enter bitcoin in token amounts (satoshis)) cVactTaa (formatCurrency (display only) 000,000,000.000(max sats))
- - - - Date purchased (section to choose mm/dd/yy) (added to the cVact group)
- - - - (Submit)
- - My Porfolio (after investments added)
- - - Investment: acVact $0
– - - Losses (default): $0 
– - - Profits (replaces losses only if acdVatoc is > 0.00000): acdVatoc + $0 (formatCurrency from VavityTester.tsx) (as small as the smallest decimal it'll show. if it increases, then raise the decimal)
- - (add more investments) 
- - - - when button above clicked, it shows:
- - - - amount: $ in dollars (creates new cVact group)
- - - - Date purchased (mm/dd/yy) (added to the cVact group)
- - - - (Submit)
^do not delete until home is complete

- - Right
- - - Line Graph (daily/weekly/yrly)
- - -  Market Status: Bull (🐂) {for any prifits} or Sloth (🦥) {for no profits}… 
- - - Bull: Show modal explanation
- - - Sloth: Show modal explanation
- - (investment list)
- - - lists cVactGroups when clicked
^Add above after revert/test/completions

- Home
- Chart:
- - Left
– - - (B)
- - - Investment: $4,000 (many random amounts (back and 3 seconds losses/profits forth))
- - - Profits: + $85,000 | Losses: $0
- - Right
- - - Line Graph
- - - (5 year/ 1 year/ 1 month/ 1week)
- - - Market Status: Bull (🐂) {for any prifits} or Sloth (🦥) {for no profits}… 
- - - - Bull: Show modal explanation
- - - - Sloth: Show modal explanation

- Revert back to commit (to test above): before current Bitcoin price API set

Login-Signup pages (Test with 2-3 accounts):
- Login/Signup with Google/Apple (reconfigure pages)
- Go back and test again
- Allow Vapa to increase (if possible) and watch chart and profits/losses
- In notion:  
- - Users (WoW growth chart/line)
- - - Find out a way to calculate and see when each e-mail opens or reloads page and which percentage


### Test Online (both desktop(multiple browsers)/mobile):
- change .env variables from NEXT_PUBLIC
- test with 2-3 masstester@gmail.com accounts differing amounts (view all s3 jsons and check Arells Ethereum Wallet amount)
- - Allow Vapa to increase (if possible) and watch chart and profits/losses
- - In notion:
- - Users
- - - (current) number of email created, date, time, etc
- - - chart
- and NEXT_PUBLIC for AWS (change back then change back to AWS for local tests *always* in all APIs & aws-config)
- Change AWS Access Key from PUBLIC to PRIVATE (find all files that have this and change them)
- - save/update .json info every second to ext Dsk (then every day save/update cold)
(view all s3 jsons and check Arells Ethereum Wallet amount)

## Privacy Policy
- Look and edit (remove all crypto and fintech stuf)


## Loading Modules in all pages
- All of them fade in and out (same as modules and pages in vavity.info)
- Bitcoin png at center in every page apart from home, sign-up/log-in, privacy policy

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
– - - (BTC)
- - - Investment: $4,000 (many random amounts)
- - - Profits: + $85,000
- - - Losses: (for sloth) $0
- - Right
- - - Line Graph
- - - (5 year/ 1 year/ 1 month/ 1week)
- - - Market Status: Bull (🐂) {for any prifits} or Sloth (🦥) {for no profits}… 
- - - - Bull: Show modal explanation
- - - - Sloth: Show modal explanation
- (How It Works)

### Account
- Change color scheme (for modals also) to Purpple
(A) ------- (Wallets)
- Are you 
ready to let go 
of bear markets?
- My Portfolio
- - Investment: acVact $0
– - Losses (default): $0
- - Profits (replaced Losses only if acdVatoc > 0.00000): acdVatoc + $0 (formatCurrency from VavityTester.tsx) (as small as the smallest decimal it'll show. if it increases, then raise the decimal)
- - Right
- - - Line Graph (daily/weekly/yrly)
- - -  Market Status: Bull (🐂) {for any prifits} or Sloth (🦥) {for no profits}… 
- - - Bull: Show modal explanation
- - - Sloth: Show modal explanation
- (add)
- - - Purchase Date (mm/dd/yy): 
- (investment list)
________
- Chart
- - Left
– - - (B): Vapa
- - - Percentage Increase
- - Right
- - - Line Graph
- - - (5 year/ 1 year/ 1 month/ 1week)
- - - Market Status: Bull (🐂) {for any profits} or Sloth (🦥) {for no profits}… 
- - - - Bull: Show modal explanation
- - - - Sloth: Show modal explanation
- (How It Works)

### Investment Lists
- Purchase Date (mm/dd/yy): 
- - (edit) (delete)
- (How It Works)

### How It Works:
    Financial instutions will reliquish bear markets only if you (the investor) are also willing to do the same. 

    Arells was created to see whether you are ready to let go of bear markets. 

    Powered by Vavity; An autonomous pricing system that anchors asset prices before they fall, the likelihood of financial insitutions adopting Vavity into their buying and selling mechanisms (ensuring your investments never experience bear market losses) will be dependent on how often you use (and share) your Arells portfolio. 

    Are you ready to let go of bear markets? (Login) or (View Account)

    Powered by (Vavity (V))

### Metatags/ Description (all pages.tsx & components)
- Alter: Descriptions & BannerImages [large slogan] (changge Bitcoin to Ethereum)
- - Are you ready to let go of bear markets? Login/Signup
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
- - Allow Vapa to increase (if possible) and watch chart and profits/losses
- - In notion:  
- - Users
- - - (current) number of email created, date, time, etc
- - - chart


#### Deployment (Main) Amplify/S3 Login
- Test (with vavity.info) on socials (DM's/etc)
- Email/X-Twitter/LinkedIn+crunchbase(compeny-type: social experiment, assets, digital-assets)/: Are you ready to let go of bear markets? 

### After Completion
- Cancel Infura/Metamask
- Always Save Vavity JSON file data everyday offline (in case of breach)
- Delete Arells Readme roadmap
Users:
- Get Leads (search AI automoated options [use same format] from X, etc)
- Set Launch Date (and announce the features)
- - Review notes on phone
- - Look at notes for openings. 
- - Add "Discord" section for any questions
- - FAQ: 
Keep marketing, dependent on growth after 1-2 weeks:


### Other (if Time Permits)
- Flip sloth pngs horizontally
- Fix (if VavityAggregator jsons are deleted (wallet connected (connect asset not poping up issue) ))
- Fix (signOut/sign-up/log-in issue) loading after button click success stays true forever... add "await"?
- Fix (View Account) slowness issue (Add Preparing Account loading we time out at least 2 seconds before this loads)
- Remove console.logs from all files...
- Resolve Google/Bing/Yahoo Search Tab issues (Bing Webmaster Tools) (Add Unique Metatags to all recurring pages), look into favicon blurriness issue

















## Arells 2 & Beyond

- Wait at least 2 months to track numbers (adjust plan based on feedback), Updates (oDAO, FndrsINC, etc, (New?)):
- - Compare Retention rate (in bear markets WoM only (percentages)) and market dominance of solid marketplaces: Projections (with current trajectory) with/without inv/asset additions (WoW percentage comparisons)
- Add 1 new asset a week (VAPA/wallet-connection) (and home page with Market Cap (VAPA))
- - Assets have their own page and token values (that should be implemented in fetchBalance and everywhere these token values are used) (connect asset)
- - Announce

- After user accumulation and scaling, add Buy/Sell (add VatopGroups back), can buy high, can never sell below market price (sloth)
- Figure out way to save .JSON info into another very secure section (possibly offline for added security)
- Delete all Console Logs in LogIn/SignUp/Account/Buy/Sell/Disconnect/VavityContext


### Home/Account
- Account/Withdraw/Sell/Buy/Transactions/BankAccount/Confirm (if not logged in) Revert To Home
- Contact us (Account/Home): Email
- Clean up Lagging Pages


### iOS & Android App (after 1-2 years?)
Recommend Arells wallet and sunset all other wallets when Arells app revenue overtakes them
- iOS App (UI Layer)
- - Tagline: Are you ready to let go of bear markets?
- - Desc: Join Arells if you're ready to let go of bear markets. 
- - submission: An accounting ledger containing investment information for users.

### Vavity-API (after 3-4 years)
.... (vavity ...c
... Are you ready to let go of bear markets?
... (Integrate Vavity))

### Pro-Natalism + Building Healthy Mind
- Daily Recommendation: 7-8~ hrs of daily sleep and a personal daily gratitude journal.
- P/T 25-30 hrs for prnts with kids (research slry). 40+ for those without (apart from Executive positions)



