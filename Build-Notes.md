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
- - - - $ Curent Investment Value (add to test UI display for lots of bitcoin): automatically displays Bitcoin Amount at the time of purchase (this should correspond and get the bitcoin price from the "date purchased" section) this will end up being the cVatop after the submit button is clicked while cVact will always be VAPA x bitcoin amount entered ... If for example VAPA after 01/05/26 is greater than bitcoinPrice on 01/10/26, then $ Amount should be based on VAPA and not bitcoin Price
- - - - $ Past Investment Value: VAPAHistoricalPrice x bitcoinAmount
– - - - $ Profits/Losses (add to test UI display for lots of bitcoin) (default when no activity inside bitcoin amount section): (VAPA x bitcoinAmount) minus (VAPAHistoricalPrice x bitcoinAmount)  changes to $ Losses: $ 0, when date is chosen and profits are zero
- - - - bitcoin amount (section to enter bitcoin in token amounts (satoshis)) cVactTaa (formatCurrency (display only) 000,000,000.000(max sats))
- - - - Date purchased (section to choose mm/dd/yy) (added to the cVact group)
- - - - (Submit)


- - My Porfolio (after investments added)
- - - Past Investment Value: acVatops
- - - Current Investment Value: should be acVacts
– - - Profits/Losses: should be acdVatops
- - - (24 hours /1 wk / 1 mnth/ 3 mnths/ 1 yr/ All) buttons (each should dissapear and re-appear dependent on date of oldest investment... so if oldest investment was 3 mnths ago, 1 yr greys out, etc, etc)
- - (add more investments) 
- - - - when button above clicked, it shows:
- - - - amount: $ in dollars (creates new Investment group inside VavityAggregator json)
- - - - Date purchased (mm/dd/yy) (creates new Investment group inside VavityAggregator json)
- - - - (Submit)
^do not delete until home is complete

- Chart
- - Left
– - - (B): VAPA
- - - - Market Status: Bull (🐂(clickable for explanation)) {for percentage increase} or Sloth (🦥(clickable for explanation)) {for no percentage increase}… 
- - - - Percentage Increase
- - - - (24 hours /1 wk / 1 mnth/ 3 mnths/ 1 yr/ All) buttons
- - Right
- - - Line Graph (clickable)
- - - - Bull: Show modal explanation
- - - - Sloth: Show modal explanation

- Home
- Chart (3 seconds meander from 2 profits to 1 losses back and forth)
– - - (BTC)
- - - Past Investment Value:
- - - Current Investment Value: $4,000 
- - - Profits/Losses: + $1,000
- - - Date Purchased: mm/dd/yy

^ Reconfigure UI below for HOME/ACCOUNT before deleting

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
arells
[  if no bear markets existed
   [ chart ]
]
[ Login ] [ view account]
- Chart:
– - - (BTC)
- - - Investments: $4,000 (3 seconds meander from 2 profits to 1 losses back and forth)
- - - Profits/Losses: + $1,000
- - - Date Purchased: mm/dd/yy

### Account
(A(home)) ------- (List Icon (greyed out if VavityAggregator doesn't exist {test}))
- If no bear markets existed
- Portfolio
- - Investments: acVact 
- - Profits/Losses (replaced Losses only if acdVatop > 0.00)(formatCurrency from VavityTester.tsx)
- - (daily/weekly/yrly) buttons (greyed out if vavityaggregator doesn't exist or is empty...)
- - (add investment) (add more investments)
- Chart
- - Left
– - - (B): VAPA
- - - - Market Status: Bull (🐂(clickable for explanation)) {for percentage increase} or Sloth (🦥(clickable for explanation)) {for no percentage increase}… 
- - - - Percentage Increase
- - - - (24 hours /1 wk / 1 mnth/ 3 mnths/ 1 yr/ All) buttons
- - Right
- - - Line Graph (clickable)
- - - - Bull: Show modal explanation
- - - - Sloth: Show modal explanation
- (How It Works)

### Investment Lists
- (A) <- back to account (or home if no email (logged out ){test})
- - if no Investments 0
- - - [insert add investments from account here] dissapear if investments:
- - Investments: cVact
- - Profits/Losses (should work exactly the same as from account): cdVatop
- - Purchase Date (mm/dd/yy): 
- - (edit) (delete)
- (How it works)

### How It Works:
    Arells is a ledger that portrays how your investments would look if no bear markets existed.

    Powered by (Vavity (V))

### Metatags/ Description (all pages.tsx & components)
- Alter: Descriptions & BannerImages
- - If no bear markets existed
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
- Email/X-Twitter/LinkedIn+crunchbase+CSC(company-type: Financial Technology (remove blockchain services or anything blockchain))/: If no bear markets existed

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
- - - Discord welcome to Arells: is a ledger that portrays how your investments would look if no bear markets existed.


### Other (if Time Permits)
- Flip sloth pngs horizontally
- Fix (if VavityAggregator jsons are deleted (wallet connected (connect asset not poping up issue) ))
- Fix (signOut/sign-up/log-in issue) loading after button click success stays true forever... add "await"?
- Fix (View Account) slowness issue (Add Preparing Account loading we time out at least 2 seconds before this loads)
- Remove console.logs from all files...
- Resolve Google/Bing/Yahoo Search Tab issues (Bing Webmaster Tools) (Add Unique Metatags to all recurring pages), look into favicon blurriness issue

















## Arells 2 & Beyond

- Wait at least 2 months to track numbers (adjust plan based on feedback), Updates (oDAO, FndrsINC, etc, (New?)):
- - increase CG API limit? (track)
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
- - Tagline: If no bear markets existed
- - Desc: Join Arells if you're ready to let go of bear markets. 
- - submission: An accounting ledger containing investment information for users.

### Vavity-API (after 3-4 years?)
.... (vavity ...c
... If no bear markets existed
... (Integrate Vavity))

### Pro-Natalism + Building Healthy Mind ?
- Daily Recommendation: 7-8~ hrs of daily sleep and a personal daily gratitude journal.
- P/T 25-30 hrs for prnts with kids (research slry). 40+ for those without (apart from Executive positions)



