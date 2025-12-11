# Arells Build Notes...

## Arells Cryptocurrency Marketplace MVP

## Arells v1

### Test Offline 
- Remove BTC Wallet & Key creations in signup and login

VavityTester (previously MASStester)
Create Wallet:
- creates VavityAggregate.json with accronyms (reference Vavity readme)
- do not save private key info on json, only address
- Multiple wallet creations
- - Import/Export: 
- - - Test import, export
- Test import and export with acronyms with "fake" price uptick/downtick
- - .5% import fee (into Arells Bitcoin Wallet)

Account Wallet: 
- Keep profits with overall percentage gained (after first initial import) and remove Arells Bitcoin Price…

Create wallet (new addition for extra wallets):
- Closing Modal:
- - Did you save your private key? if not, you will lose access to your finds.

Chart (Home/Account): 
- add Market Status: Bull (🐂) or Sloth (🦥)… 
- add price and (5 yr, 1 yr, 1 month, 1 week, 1 day) clickers
- add node on chart that historically shows price and changes Bull/Sloth


Vavity Architecture:
- Save entire vavity API (vapa-mechanism and aggregator), chart (bull/sloth), aggregator... Then update Vavity Git

Test with 2-3 masstester@gmail.com accounts differing amounts (view all s3 jsons and check Arells Bitcoin Wallet amount)

- and NEXT_PUBLIC for AWS (change back then change back to AWS for local tests *always* in all APIs & aws-config)
- - Separate Vavity architecture Offline (for testing) and prepare online version (for deployment)
- Change AWS Access Key from PUBLIC to PRIVATE (find all files that have this and change them)

### Test Online:
- change .env variables from NEXT_PUBLIC
- eMail verification (before import)
- Establish background useEffects order
- - 1. Vavity: Fetch Bitcoin Price
- - 2. Vavity: Fetch wallet Balances
- - 3. Vavity: Fetch VavityAggregator/save VavityAggregator
- test with 2-3 masstester@gmail.com accounts differing amounts (view all s3 jsons and check Arells Bitcoin Wallet amount)
- create new:
- - ARELLS_PRIVATE_KEY	
- - Run Vavity for 2-3 days to test system (with small amounts multiple accounts) .
- - save/update .json info every second to ext Dsk (then every day save/update cold)
(view all s3 jsons and check Arells Bitcoin Wallet amount)
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


#### Chart (Home/Account):
– - (B)
– - Price 
- - -  $5,000   ->   $90,000
- - - 05/02/15      12/10/25
– - Line Chart
– - (5years/1year/1month/1week) Profits: + $85,000
Add Market Status: Bull (🐂) {for any prifits} or Sloth (🦥) {for no profits}… 
- Bull: Show modal explanation
- Sloth: Show modal explanation

### Home
- Make Phsychological slogan larger
- Powered By Vavity replces bottom "import words"

### Account
- Make Phsychological slogan larger
- - Import button triggers "Create Wallets" <- use function from VavityTester.tsx
- If acVatoi != 0, then hide "Import Bitcoin to begin"
- - Price: VAPA (formatPrice from VavityTester.tsx)
- - Wallet: acVact + Import Wallet Amount (formatCurrency from VavityTester.tsx)
- - Profits: acdVatoi (formatCurrency from VavityTester.tsx) (as small as the smallest decimal it'll show. if it increases, then raise the decimal)
- - ( Create New Wallet? ) (button)
- Powered by Vavity (V) (link)

#### Import (Page)
- Import 
- - (B)
- - (B) Address
- - Modal: Preparing (B) Wallet (to create wallet (take from VavityTester)) {loads in signer.tsx when createBTCwallet is invoked after first if try event}
- Fee (mention .5% import fee)
- Powered by Vavity (V) (link)


#### Export: 
- Opening Modal: 
- - Warning: exporting your investments out of Arells and into any financial system that hasn’t adopted Vavity (V) will psychologically subject your investments to bear-market losses, are you sure? (yes) (Back To Account)<- Back to account
- - As numbers typed in amounts compare external and internal value, if no losses, don’t show calculations
- Powered by Vavity (V) (link)

#### Metatags/ Description (all pages.tsx & components)
- Alter: Descriptions & BannerImages (remove Bitcoin Arells)
- - Investments immune to bear markets. Import investments and psychologically protect them from bear market losses.
- Refactor (optimize with Cursor) Meta-tags {show AI and ask it why it displays home page ps and not meta tags}?
- - (with vavity.info) Submit to Google Search Console: Submit your sitemap and request indexing
- - Create a sitemap.xml: Helps Google discover all pages
- - Add a robots.txt: Allows crawlers to access your site
- - Build backlinks: Share your site to get it indexed faster

#### Deployment (Test) Amplify/S3 Login
- Ensure that NEXT_PUBLIC is not invoked and remove .env hardhat config expositions
- Compare Main ENV with Test ENV before deployments
- Test (with vavity.info) on socials (DM's/etc)

## Final Test
- Remove typos from Arells/Vavity readmes, and UI
- 2-3 accounts, multiple imports and exports (monitor for 2-3 days)

#### Deployment (Main) Amplify/S3 Login
- Test (with vavity.info) on socials (DM's/etc)
- Email/X-Twitter/LinkedIn/: Investments psychologically immune to bear markets. A custodian that psychologically prevents investments from bear market losses

### After Completion
Save Vavity JSON file data everyday offline (in case of breach)
Users:
- Get Leads (search AI automoated options [use same format] from X, etc)
- Set Launch Date (and announce the features)
- - Psychologcally protect our investments from bear market losses.
- - Add "Discord" section for any questions
Keep marketing, dependent on growth after 1-2 weeks:
- Updates (oDAO, FndrsINC, etc)


### Other (if Time Permits)
- Fix (signOut/sign-up/log-in issue) loading after button click success stays true forever... add "await"?
- Fix (View Account) slowness issue (Add Preparing Account loading we time out at least 2 seconds before this loads)
- Remove console.logs from all files...
- Resolve Google/Bing/Yahoo Search Tab issues (Bing Webmaster Tools) (Add Unique Metatags to all recurring pages), look into favicon blurriness issue












### iOS & Android App(work on this together)
- iOS App (UI Layer)
- - Tagline: Psychologically protects investments from bear market losses.
- - Desc: Custody Digital Assets with Arells, and watch as it autonomously protects your investments from downturns. 
- - submission: A blockchain interface app that connects users to decentralized protocols. The app itself performs no custody or transactions, custodial transactions are handled by an autonomous system and AWS-based coordinations.





## Arells 2 & Beyond

- Lost Key: Hide wallet balance... in case wallet privete key lost
- After user accumulation and scaling, add Buy/Sell (add VatopGroups back), can buy high, can never sell below market price (sloth)
- Figure out way to save .JSON info into another very secure section (possibly offline for added security)
- Delete all Console Logs in LogIn/SignUp/Account/Buy/Sell/Export/VavityContext

### UserContextWrapped
- if logged in for more than 5 minutes without use, automatically sign out and take to homepage.

### Home/Account
- Account/Withdraw/Sell/Buy/Transactions/BankAccount/Confirm (if not logged in) Revert To Home
- Contact us (Account/Home): Email
- Clean up Lagging Pages

### Chart
(Solid Marketplace / Bull&Bear)

### Pro-Natalism + Building Healthy Mind
- Daily Recommendation: 7-8~ hrs of daily sleep and a personal daily gratitude journal.
- P/T 25-30 hrs for prnts with kids (research slry). 40+ for those without (apart from Executive positions)



