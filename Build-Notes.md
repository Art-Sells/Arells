# Arells Build Notes...

## Arells Cryptocurrency Marketplace MVP

## Arells v1 (Import/Custody Bitcoin)

## Test
- Test actual quotes for v4 (on Uniswap and on Arells to test for fees)
- revert back to "testKeyPermutations commit for v3/v4 ref"

### Offline (test network transactions daily and verify amounts in DEX UI)
- General Price is median exterior price and all MASS logic functions are dependent on this.
- 1 entire token test,
	•	In a constant-product/concentrated-liquidity AMM, if you try to sell 1 cbBTC into a range that only holds ~10.386 cbBTC, you are trying to remove ~9.6% of the token-1 inventory that’s currently active. That moves price a lot, so I'm going to have to re-write HPM acronyms to break apart each "supplication" from the token-to-fiat (calculate which supplication will not diminish the value of the investment (i.e if the supplication (based on the token-pair-price) then do not supplicate (leave USDC ***importing USDC into the system (first) ensures this problem is mitigated (or, have the system cap out the number of USDC -> CBBTC MASS applications, possibly $1,000k (max) per daily injections into HPM-MASS-LPP [Might have to create separate wallet for this])***)))
- Import USDC into hpmtester account and test through HPMMASSTester.tsx (compare/contrast MASSTester.tsx api and adjust changes accordingly) (console.log transacton hash always add Fee Funder to new APIs (look at fee funding logic from old APIs))
- Import wallet (create import wallet)
- MASS wallet (create MASS wallet)
- Export wallet (create export wallet)
- - Problems: 
- - - Test Fee Free Route (Set Time to increase API Rate Limit on Infura (Even After Launch))
- - After Problems solved:
- - - Check TXN (and amount in Wallet .json calculate if fees taken)
- - Only change MASS booleans info if transactions are successful, keep trying transaction until successful, if transaction reverts, try transaction again (break transaction in .js files to test this).
- - replace cVactTa and acVactTas with cVactDat and acVactDat (to USD total)
- - Test releaseMASS and holdMASS booleans (releases all of the VatopGroups (not individuals only))
- - - Test release MASS 5-10 minutes after also (see if supplications will run with latest bitcoin prices and if vatopGroups will update accordingly check wallet)
- - - test with 2-3 masstester@gmail.com accounts differing amounts (view all s3 jsons)
- - - Add endless 15 second loop incase Base network is down (break transaction in test files to test this) (if Base Network is congested add error message (if successful, then error message is invisible))
- Incorporate Sell/Withdraw (look at Arells 1.5)
- Can only Dcd PK with P (from nv)… Do extensive research on this, see if can cd and dcd from json and without P.
- Integrate import CAP (so to not exceed 1 USDC liquidity pool)

### Online:
- Establish background useEffects order
- - 1. HPM: Fetch Bitcoin Price
- - 2. HPM: Fetch wallet Balances & update aBTC
- - 3. HPM: Fetch Vatop Group/save Vatop Group
- - 4. MASS: Run functions
- test with 2-3 masstester@gmail.com accounts differing amounts (view all s3 jsons)
- create new:
- - ARELLS_PRIVATE_KEY	
- - DYNAMODB_ACCESS_KEY_ID
- - DYNAMODB_SECRET_ACCESS_KEY
- - DYNAMODB_TABLE_NAME	ArellsUsers
- - - copy/paste from old TABLE_NAME: ArellsUsers
- Add Firewall to Testnet

Arells Wallet and change all Variables
- Build Back-End Lambda code for setInterval logic from HPMarchitecture and MASSarchitecture (check "Total WBTC Calculation" from GPT History) and adjust logic for every 1 week.
- If holdMASS is true for all vatopGroups, then start internal countdown (test with simple 30 second countdown) until reset holdMASS to false after countdown API connected to email (always todays date Hawaiian time) [mm/dd/yr], next update replaces Date? (only if all supplicateCBBTCtoUSDCs are true then start time)… Update every 168~ hours. 
- Build HPM Assets (line-chart with profits, etc) based on VatopGroup info.


## After Test
- Remove P/K & P/K Test from e en vee (check decoding proces (in console.logs) for each individual account to prevent external P/K decoding (MASSTester.tsx and HPMTester.tsx?))
- CoinGecko API for Chart

### Account
- "Renders bear markets obsolete." <- and HOME
- - Import button triggers "Create Wallets" <- use function from MASSTester.tsx
- If aBTC > 0, then hide "Import Bitcoin to ensure your investments never lose value"
- - Price: HPAP (formatPrice from HPMMASSTester.tsx)
- - Wallet: acVacts (formatCurrency from HPMMASSTester.tsx)
- - Profits: acdVatops (formatCurrency from HPMMASSTester.tsx)
- - Wallet Balance Updated every 1~ week
- - - Error Message Modal visible: if Base network congestion error (from executeSupplication), if executeSupplication successful, then invisible.

#### Import (Page)
- Import 
- - ($)->(A)(B)
- - ($) USDC Address (Base)
- - Ensure you use a Coinbase (Base) Address (only) to import your USDC.
- - Modal: Preparing (B) Wallet (to create wallet (take from MASSTester)) {loads in signer.tsx when createBTCwallet is invoked after first if try event}
- - - Import wallet (create import wallet)
- - - MASS wallet (create MASS wallet)
- - - Export wallet (create export wallet)
- - Modal: Importing your $ will convert it into A-B and can be exported back into $ when needed.
- word-logo: 100 px margin top (after log-in re-introduction)

#### Metatags/ Description (all pages.tsx & components)
- Alter: Descriptions & Images (see /main)

#### Deployment Amplify/S3 Login
- Ensure that NEXT_PUBLIC is not invoked and remove .env hardhat config expositions
- Delete MASS address info from MASStester and console.logs from all signer.
- Restructure decryption process in readMASS and readBTC apis
- Compare Main ENV with Test ENV before deployments

## Final Test
- 2-3 accounts

### After Completion
- Users:
- Set Launch Date (and announce the features)
- - Import USDC using (Base), it's free to and will cost pennies to export.
- - Accepting only the first 150 Investors (until our L3 is built) talk about releasing Sell CBBTC to USDC and ability to export it into any DEX/CEX
- - Add "Discord" section for any questions
- Team:
- - Fund Arells Fee Funder with 150 USD in ETH on Base (check and replenish everyweek/day until BASE L3 is complete)
- - Future LPP Graphs for MASS v2 marking by seconds: 5-6 differing liquidity pools LPP v2 (pool amounts [large amounts] can be shifted between pools)
- - Experiment for prnts under $200k (adjust for inflation): ramp down to Part- time/WFH flexibility for same py until chld is 15-16 yrs…. (Set time to look at 5 year plan and lessen it to 1 year [what would it take to accomplish that])
- - review ##Base
- - Review HPM Assets (Number of Investors, etc amd remove sign-up if 150~ MAU/I is hit)
- CBBTC (if price decreases execute mass), or USDC import (if price increase execute mass), change import slogan (add export info of why only in USDC) 6% (raise prices if needed)


### Other (if Time Permits)
- Remove loops in CBBTC/USDC supplication tests executeSupplication, clean up "cbBTC mass test for first failure before confirmation"
- Remove BTC Wallet & Key creations in signup and login
- Remove all "2 second delay for buttons"
- Fix (signOut/sign-up/log-in issue) loading after button click success stays true forever... add "await"?
- Fix (View Account) slowness issue (Add Preparing Account loading we time out at least 2 seconds before this loads)
- emailConfirmed attribute
- - if null, emailUnConfirmed(true){}, emailConfirmed(false){};
- - if true, opposite
- Send Confirmation (Link) look into Hosted UI in AWS Copgnito for custom UI interface Emails, etc..
- FA[Fee Arbitration] (optional MASS integration if swaping fees exceed a certain amount) [cVact (based on cpVact if cVactDa is = 0.00 else doesn’t change until threshold is met).] 
- Remove Console.logs in MASS_cbbtc/usdc Apis and condense to make faster and more efficient. 
- if cVactDa < $0.01, cancel (exit) MASS & HPM supplication

### Last Resort
- Remove console.logs (and console.errors/warn) from all wrappers(userContext, HPMContext & MASSContext), hide "masstester" "wallettester" "hpmtester" & "hpmmasstester" from main
- Resolve Google/Bing/Yahoo Search Tab issues (Bing Webmaster Tools) (Add Unique Metatags to all recurring pages)




















## START WORK ON BASE L3 (in accordance with v1.5 [get other engineer for this?]):
- Phase 1: 
- - Reference Base (and UI) Repos
- - Abstract Transaction Fees to $0~
- - Replace Transaction Fees from MASS profits (calculate previous cdVatops from new cdVatops and if +15% or more, subtract 5% into Base L3 and other 5% into Arells (should work the same as selling logic)). 
- Phase 2:
- - Txns/s need to be in 1000s-10000s per second for meme-coins to benefit (reference HPM Efficiency charts).
- HPM-Liquidity System (Brainstorm)
- - Reference V3 U*P (and UI) Repos(addresses for contract and API info)
- - Research whether injecting USDC (only) will grow AUM?
- Crypto Exchange/Wallet License (for iOS/Android App)








## Arells 1.5 (Sell/Export USDC) (and other token pairs)

### Test
- 1 entire token test to ensure pool match
- Create New Export Wallet Address for Selling and Exporting USDC/CBBTC
- **fix Selling Discrepancy Issue (VERY IMPORTANT)**
- Sell Test (HPMContext)
- - (start here first since taking from highest HPAP) if acVactTaa > 0.00000, subtract $sellAmount + 3% (in BTC format) from aBTC before initiating vatopGroups selling algo and incrementing into soldAmounts. Then initiate sellWBTC"Function"(from Smart Contract).
- - (if acVactTaa <= 0.00000, then else here) if acVactDas > 0.00, increment $sellAmount into soldAmounts(this is already baked into the HPM algorithm). Then initiate sellUSDC"Function"(from Smart Contract).
- Test Sell (without HPM) 
- Testnet (with HPM (Increase/Decrease Bitcoin Price)) WBTC/USDC trading/swapping based on MASS & FA(Fee Arbitration)
- - SellsmartContract: incorporate into handleSell
- - - sellWBTC: Swap WBTC ((amount taken from HPMContext "$sellAmount + 3%")in BTC format) into USDC while subtracting 3% in USDC. 
- - - sellUSDC: 3% subtracted (3% amount calculated from HPMContext "$sellAmount") from USDC.
- - Withdraw: Send your soldlAmounts worth of USDC into another exchange
- - - USDC (Polygon) Address
- - - Amount = soldAmounts
- - - Amount to Send (subtracted from soldAmounts)
- - - Send

### Home
- Contact us: Email

### Account
- Sell
- Withdraw (Export USDC) (USDC)
- Contact us: Email

### Sell
**Test to see if it'll sell if over amount?**
- (A)(B)
- - Amount: displays acVacts
- - Profits: displays acdVatops
- - Sell Amount Input:  see HPMTester
- - Fee (include fee in sale)
- - Sell: see HPMTester
- - (Confirm Sale) -> Modals
- - - Modals: 
- - - - Confirming Sale...3 Second delay
- - - - Sale Complete (confirming sale modal = false) (see HPMTester) (View Account) -> Account
- - - - Transaction Failed (confirming sale modal = false) (OK)
- - - - Enter information (if one or more fields are empty)
- Reloads modules every 10 seconds (price, wallet, and profits animation css) from coin gecko API wrapper?

- Test Import & Sell (without HPM) Bitcoin to WBTC(Polygon POS), WBTC<-swap->USDC(Polygon POS). 

### Export
- Export and send your soldlAmounts worth of USDC into another exchange
- USDC (Polygon) Address
- Amount
- Amount to Send (subtracted from soldAmounts)
- Send
- - Modals: 
- - - Sending...3 Second delay
- - - Sent (confirming sale modal = false) (see HPMTester) (View Transaction) -> Polygon Explorer
- - - Transaction Failed (confirming sale modal = false) (OK)
- - - Enter information (if one or more fields are empty)

### Sign Up
- Verify Email *important*
- Add noreply@arells.com to Amazon SES Identities
- - Test to see if "Confirmation Code Exists" error works...

### Confirm
- - - Ensure Private Key is Encrypted (if successful)

#### Deployment Amplify/S3 Login
- Restructure P/K ENV NAME

### Last Resort
- Create separate Wallet to handle where we get our 6% fee...

### Expand into other Base Tokens
- look for other token pairs and expand Arells (sell to other holders) to that.























## Arells 1.7 (Export Bitcoin?)

### Email
- Check "Main-Inv" folder in email

### Testing (HPM & MASS Tester)
- Test Export process (Converts all USDC from MASSaddress into SELLaddress CBBTC (while also sending CBBTC from MASSaddress into SELLaddress) and prepares to export everything)... 
- - handleExport (add try, awaits and catch to ensures the entire process is successful before updating backend information) (check handle Sell for reference).
- Export Test (similar to sell except (Combines the acVactTaa and acVactDas and subtracts from all groups))
- Export Amount Input: In Dollars that Converts to cbBTC based on bitcoin price.
- Export Address Input (Base Address).

### Export (Bitcoin)
**Pull handleExport from HPMContext and edit saveVatopGroups import for success and error modal handling.**
- Modal: Exporting your Bitcoin out of Arells means your investment will likely lose value, are you sure?
- - (YES) -> Hidden: Prepare (A)(B) for (B) export
- - (No) -> Takes back to homepage
- Hidden: Prepare (A)(B) for (B) export, once you click Prepare Bitcoin, your (A)(B) Arells Bitcoin will be converted into (B) Bitcoin and will be ready for export. This cannot be reversed.
- - (Prepare Bitcoin) -> Preparing Modal (Swap(Sell meaning to Zero out all Vatop Groups) all CBBTC/USDC into Export Address before swapping all USDC into CBBTC)
- - (Take Me Back) -> Takes back to homepage
- After Prepare: 
- - Homepage: the import will show but your wallet will also show how much CBBTC you have and the value,
- - Import: the import will show you the amount of CBBTC sitting ready for you to export
- - Export: Will immediately show you Ready to Export
- Ready to Export:
- (W) Wallet: Displays your cbBTC value.
- (B) Amount: Displays cbBTC 8 decimals long maximum
- BASE Address (Must Be Base (Give Coinbase Base address link for info))
- (EXPORT) -> Modal
- - Modal:
- - - Exporting (3 second delay) see HPMTester 
- - - Successfuly Exported (exporting modal = false, adds Date (logs new Date in "Transaction Dates" database), cVactTas exported to "Exported Amount" and link to Block Exporer to "Exported Link" in Database) (View Transactions)-> Transactions-
- - - Export Failed (exporting modal = false)(OK) (if export fails (see HPMTester))
- - - Check Address (exporting modal = false)(if Bitcoin Address is not in right format (refer to Bitcoin Page))
- - - Enter information (exporting modal = false) (if one or more fields are empty)
- - - Send more Bitcoin (exporting modal = false) (refer to Bitcoin Page for fee limit)
- Reloads modules every 5 minutes (price, wallet, and losses animation css) from coin gecko API wrapper?





















## Arells 2 & Beyond

### iOS & Android App

### Important:
- Figure out way to save .JSON info into another very secure section (possibly offline for added security)
- Why do we need Stripe and Plaid? Can't we build our own internal (Buying(with Debit Cards) & Selling (with Bank Account#/Routing#) system)?
- - If this sytem can be built without relying on them, then completely omit all the environment variables and APIs
- Update Blockchain.info API to Amplify (IP) API
- Emails (Bitcoin Available to Sell)
- Resolve "HPMContext" errors that show "cannot find email, Error fetching Bitcoin Price, etc etc" from console.log if pages don't need them...
- Delete all Console Logs in LogIn/SignUp/Account/Buy/Sell/Export/HPMContext
- Sign up for 2 more Exchange APIs then begin aggregating our own Cryptocurrencies (set into plan)…

### UserContextWrapped
- if logged in for more than 5 minutes without use, automatically sign out and take to homepage.

### Home/Account
- Account/Withdraw/Sell/Buy/Transactions/BankAccount/Confirm (if not logged in) Revert To Home
- Contact us (Account/Home): Email
- Clean up Lagging Pages

### Account
- Export

### Transactions
**From Transactions Attribute (API)**
- (A(arells-circle)) -> Account Page (B(bitcoin-logo)) ->Buy Page
- (Calendar) 06/21/24 (mm/dd/yr) (pulls from "Transactions Dates" from Database)
- (B) Sold: 0.0087 (pulls from "Sold Amount" database) 
- - (Cash Register) for: $ 
- (B) Bought: 0.0087 (pulls from "Bought Amount" database) 
- - (Cash Register) for: $
- (Vault) Withdrew: $ (pulls from "Withdrew Amount" database) 
- - (Bank) to: (Plaid Bank Logo Button? from Plaid Wrapper?)(long bank words have maximum display length of ?)->Bank Account
- (^-circle) Exporting: 0.00043 (if loading useEffect from Block Explorer)| (B) Exported: 0.00323 (if completed useEffect) (pulls from "Exported Amount" database) 
- - (App) To: (View On Block Explorer)-> Block Explorer Link

### Buy
- - Purchase Failed, check Bank Account for sufficient funds (View Connected Bank Account) -> Bank Account
- - Purchase Complete (confirming purchase modal = false, (see HPMTester)) -> View Transactions

### Sell (into Bank (reach out to Stripe))
- - - - Sale Complete (confirming sale modal = false) (see HPMTester) (View Transactions) -> Transactions

### Export 
- Increase fees for faster exports

### Log In
- - if email already exists but is unconfirmed -> Confirm Page
- Forgot Password 
- Add 2FA for Buying/Selling and first Logging In.

### Bank Account
- Change Bank Account (Plaid Connect? from Plaid Wrapper?) (long bank words have maximum display length of ?)

### Transactions
- Add Importedx

#### Misc
- fix "bitcoinAmount" API misswording issue within Withdraw Amount JSON.
- Amazon EC2 Maintenance restructure...

##### Home Page:
10 years, 5 years, 1 year, 6 months, 90 days, 30 days, 7 days, 24 hours, 6 hours, 1 hours (load whichever time frame from 24 hours first, to 7 days, prioritize days then months then years in regards to the highest percentage increase).

## HPM SDK
- Free SDK for any developer to adopt and integrate into their financial and market based systems.

### Pro-Natalism
- P/T 25-30 hrs for prnts with kids (research slry). 40+ for those without (apart from Executive positions)


