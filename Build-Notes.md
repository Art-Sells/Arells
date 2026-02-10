# Arells Build Notes...

## Arells v1

### Home
- Loading Modal (3 seconds (A) logo with loader circling it)
- Asset/Prices/etc (clickable downs and ups re-orientation)

### Bitcoin (test Ethereum version to release both, implement into Home)
(columns if more than 700 px, rows if less, integrate "bitcoin" "ethereum" loaders for sessions if /bitcoin or /ethereum from loaders for portfolios)
- Loading Modal (3 seconds (B/E) logo with loader circling it)
- If bear markets never existed
---------
- Line Chart {look at VavityTester for example}
- - On the Left:
– - - (Bitcoin)
- - - Price: $ (VAPA)
- - - Market Cap: $
- - - - +12.00%, etc, etc
- - - -  Bull (🐂(clickable for explanation)) Market {for percentage increase} or Sloth (🦥(clickable for explanation)) Market {for no percentage increase}… 
- - - - (24 hours /1 wk / 1 mnth/ 3 mnths/ 1 yr/ All) buttons
- - Right
- - - Line Graph (with date on the left)
- Mock Portfolio section with differing sampled amounts (3 seconds meander from 2 profits to 1 losses back and forth):
- - (BTC)
- - Purchased Value:
- - Current Value:
- - Profits/Losses:
- - Date Purchased: mm/dd/yy
--------
- - Portfolio (before anything is added) {look at VavityTester for example}, add /ethereum/bitcoin to porfolio session loader so it loads the correct amounts
- - - (Add Investments) 
- - - - when button above clicked, it shows:
- - - - $ Purchased Value: VAPAHistoricalPrice x bitcoinAmount
- - - - $ Curent Value (add to test UI display for lots of bitcoin): automatically displays Bitcoin Amount at the time of purchase (this should correspond and get the bitcoin price from the "date purchased" section) this will end up being the cVatop after the submit button is clicked while cVact will always be VAPA x bitcoin amount entered ... If for example VAPA after 01/05/26 is greater than bitcoinPrice on 01/10/26, then $ Amount should be based on VAPA and not bitcoin Price
– - - - $ Profits/Losses (add to test UI display for lots of bitcoin) (default when no activity inside bitcoin amount section): (VAPA x bitcoinAmount) minus (VAPAHistoricalPrice x bitcoinAmount)  changes to $ Losses: $ 0, when date is chosen and profits are zero
- - - - bitcoin amount (section to enter bitcoin in token amounts (satoshis)) cVactTaa (formatCurrency (display only) 000,000,000.000(max sats))
- - - - Date purchased (section to choose mm/dd/yy) (added to the cVact group)
- - - - (Submit)
- Porfolio (after investments added)
- - - Purchased Value: acVatops
- - - Current Value: should be acVacts
– - - Profits/Losses: should be acdVatops
- - - (24 hours /1 wk / 1 mnth/ 3 mnths/ 1 yr/ All) buttons (each should dissapear and re-appear dependent on date of oldest investment... so if oldest investment was 3 mnths ago, 1 y greys out, etc, etc)
- - (add more investments) 
- - - - when button above clicked, it shows:
- - - - amount: $ in dollars (creates new Investment group inside VavityAggregator json)
- - - - Date purchased (mm/dd/yy) (creates new Investment group inside VavityAggregator json)
- - - - (Submit)
-------------------
- (Investment List)
- - if no Investments 0
- - - [insert add investments from account here] dissapear if investments:
- - Purchased Value: cVatop
- - Current Value: cVact
- - Profits/Losses (should work exactly the same as from account): cdVatop
- - Token Amount:
- - Purchase Date (mm/dd/yy): 
- - (delete)
- - (Load More 5 per list)
-------------------
- (About)

### About:
    Arells is a ledger that shows how your investments would look if bear markets never existed.

    Powered by (Vavity (V))

### Metatags/ Description (all pages.tsx & components)
- Alter: Descriptions & BannerImages
- - If bear markets never existed (Bitcoin/Ethereum - If bear markets never existed)
- Refactor (optimize with Cursor) Meta-tags {show AI and ask it why it displays home page ps and not meta tags}?
- - (with vavity.info) Submit to Google Search Console: Submit your sitemap and request indexing
- - Create a sitemap.xml: Helps Google discover all pages
- - Add a robots.txt: Allows crawlers to access your site
- - Build backlinks: Share your site to get it indexed faster

### Deployment (Test) Amplify/S3 Login
- Ensure that NEXT_PUBLIC is not invoked and remove .env hardhat config expositions
- Compare Main ENV with Test ENV before deployments
- Test (with vavity.info) on socials (DM's/etc)

### Test Online 
-  both desktop(multiple browsers)/mobile
- In notion:
- - Users
- - - (current) number of email created, date, time, etc
- - - chart
- - save/update .json info every second to ext Dsk (then every day save/update cold)

## Loading Modules in all pages
- All of them fade in and out (same as modules and pages in vavity.info)

## After Test
- Save VavityCodeBase (with everything that has "Vavity" from Arells) architecture Offline (for testing) and online version (for deployment) and entire vavity API (vapa-mechanism and aggregator), chart (bull/sloth), aggregator... Then update Vavity Git
Vavity Architecture:
Separate Vavity architecture Offline (for testing) and prepare online version (for deployment)

## Final Test
- Remove typos from Arells/Vavity readmes, and UI
- - In notion:  
- - Users
- - - (current) number of sessions (unique users?) created/interacted/etc
- - - chart

#### Deployment (Main) Amplify/S3 Login
- Test (with vavity.info) on socials (DM's/etc)
- Email/X-Twitter/LinkedIn+crunchbase+CSC(company-type: Financial Technology (remove blockchain services or anything blockchain))/: If bear markets never existed

### After Completion
- Cancel Infura/Metamask
- Always Save Vavity JSON file data everyday offline (in case of breach)
- Delete Arells Readme roadmap
Users:
- Get Leads (search AI automoated options [use same format] from X, etc)
- Set Launch Date (and announce the features)
- - Review notes on phone
- - Look at notes for openings. 
- - components/api/context/vavity crypto/assets ... test, and add (shouldn't take a while to complete)
- - Test to see if can implement NEXT_PUBLIC to something else in test...

### Other (if Time Permits)
- Flip sloth pngs horizontally
- Fix (if VavityAggregator jsons are deleted (wallet connected (connect asset not poping up issue) ))
- Remove console.logs from all files...
- Resolve Google/Bing/Yahoo Search Tab issues (Bing Webmaster Tools) (Add Unique Metatags to all recurring pages), look into favicon blurriness issue

















## Arells 2 & Beyond

- Wait at least 2 months to track numbers (adjust plan based on feedback), Updates (oDAO, FndrsINC, etc, (New?)):
- - increase CG API limit? (track)
- - Compare Retention rate (in bear markets WoM only (percentages)) and market dominance of solid marketplaces: Projections (with current trajectory) with/without inv/asset additions (WoW percentage comparisons)
- Add 1 new asset a week (VAPA)
- - Assets have their own page and token values (that should be implemented in fetchBalance and everywhere these token values are used) (connect asset)
- - Announce

- After user accumulation and scaling, add Buy/Sell (add VatopGroups back), can buy high, can never sell below market price (sloth)
- Figure out way to save .JSON info into another very secure section (possibly offline for added security)
- Delete all Console Logs in LogIn/SignUp/Account/Buy/Sell/Disconnect/VavityContext


### Home/Asset-Name
- Account/Withdraw/Sell/Buy/Transactions/BankAccount/Confirm (if not logged in) Revert To Home
- Contact us (Account/Home): Email
- Clean up Lagging Pages


### iOS & Android App (after 1-2 years?)
- iOS App 
- - Tagline: If bear markets never existed
- - Desc: This is how your investments would look if bear markets never existed.
- - submission: An accounting ledger that shows how investments would look if bear markets never existed. 

### Vavity-API (after 3-4 years?)
.... (vavity ...c
... If bear markets never existed
... (Integrate Vavity))

### Pro-Natalism + Building Healthy Mind ?
- Daily Recommendation: 7-8~ hrs of daily sleep and a personal daily gratitude journal.
- P/T 25-30 hrs for prnts with kids (research slry). 40+ for those without (apart from Executive positions)



