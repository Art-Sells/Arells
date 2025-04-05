# Arells Build Notes...

## Arells Cryptocurrency Marketplace MVP

## Arells 1 (Import/Custody Bitcoin)

## Test
- Prepare notes below to test HPM-MASS integration (Arells Fee Funder for each account (check and replenish everyday/hour and adjust MASS time-fram accordinglyuntil BASE L3 is complete), etc, first test HPM-MASS for one account (console.log transacton hash always))
- Test USDC to CBBTC no fee transfer, back and forth many times...
yarn hardhat run test/usdc_mass_test.js --network base
yarn hardhat run test/cbbtc_mass_test.js --network base
- *** Remove P/K & P/K Test from e en vee (check decoding process for each individual account to prevent external P/K decoding) ***
- *** Only change VatopGroup information if transactions are successful, keep trying transaction until successful, if transaction reverts, try transaction again... AFTER LAUNCH: Remove later Console.logs in USDC/CBBTC supplication.js and condense to make faster and more efficient. Add later check to check liquidity with cbbtc/usdc wallet and if there's enough liquidity for a supplication (f not, supplications will only transfer small amounts)... And add later a function to compare total amount in USDC & CBBTC with Vatop Groups and if it doesn't match, then delete correspondingly (in case anyone transacts with their wallet-address outside HPM-MASS) ***
- *** Remove loops in CBBTC/USDC supplication tests executeSupplication, clean up "cbBTC mass test for first failure before confirmation ***


### After Test
- test import (after supplication), so it doesn't create a new group from the acdVatops
- test supplicateWBTCtoUSD (come back and check on this consistently with many vatopGroups) add supplicate boolean changes API calls.
- Build Back-End Lambda code for setInterval logic from HPMarchitecture and MASSarchitecture (check "Total WBTC Calculation" from GPT History)
- Integrate 25bps in Business Modal (subtract from WBTCtoUSD(handle sell))
- test with 2-3 masstester@gmail.com accounts differing amounts (view all s3 jsons)
- - Fund Arells Fee Funder with 150 USD in ETH on Base

### Account
- If aBTC > 0, then hide "Import Bitcoin to ensure your investments never lose value"
- - Price: HPAP (formatPrice from HPMMASSTester.tsx)
- - Wallet: acVacts (formatCurrency from HPMMASSTester.tsx)
- - Profits: acdVatops (formatCurrency from HPMMASSTester.tsx)
- - Wallet Balance Updated every 1~ week

#### Import (Page)
- Import Bitcoin to ensure your investments never lose value (through Coinbase/Base) (Base Address)
- - Modal: Preparing (B) Wallet (to create wallet (take from MASSTester)) {loads in signer.tsx when createBTCwallet is invoked after first if try event}

#### Metatags/ Description
- Alter: "Import Small Amounts of Bitcoin, ensure that they never lose value."

#### Description (Home/Account)
- Alter: "Import Small Amounts of Bitcoin, ensure that they never lose value."

#### Deployment Amplify/S3 Login
- Ensure that NEXT_PUBLIC is not invoked!
- Delete MASS address info from MASStester and console.logs from all signer.
- Restructure decryption process in readMASS and readBTC apis

### After Completion
- Talk about 1 week wallet balance update - Arells 1.5 (24 hour wallet balance update) 
- Import Bitcoin using Coinbase (Base), it's free to and will cost pennies to export.
- Talk about working on Sell CBBTC to USDC and ability to export it into any DEX/CEX, then work on Export BTC(CBBTC)
- replace cVactTa and acVactTas with cVactDat and acVactDat (to USD total)
- Add "Discord" section for any questions
- Restructure MASS Fee Abstraction (based on MASSApi & MASSSupplicationApi & MASS architecture)
- Set time to check Base Wallet and adjust MASS activation time frame accordingly... Business model will most likely have to abstract from profits (cdVatops ("selling")) to account for $0.11 MASS fees (taken from Li.Fi API)... We'll most likely have to build our own L2 (or L3), or our own ReLayer to bring the MASS fees down to $0~, for now, the next option will have to be not using Li.Fi, and checking LayerZero in order to bring the fees down to ~$0.000001...Reach out to Jesse Walden (and Base team on Discord, etc to discuss this) This till be an ever changing iteration and infrastructure building process. Maybe build an Arbitrum L3 (reach out to Arb team to see if they can facilitate this)

### Other (if Time Permits (add the below sections to Arells 1.5...))
- Remove MASSapi and MASSsupplication API errors dealing with fee checking (when transactions are successful) and fetchVatopGroups console.log error
- Remove BTC Wallet & Key creations in signup and login
- Remove all "2 second delay for buttons"
- Fix (signOut /sign-up/log-in issue) loading  after button click success stays true forever... add "await"?
- Fix (View Account) slowness issue (Add Preparing Account loading we time out at least 2 seconds before this loads)
- emailConfirmed attribute
- - if null, emailUnConfirmed(true){}, emailConfirmed(false){};
- - if true, opposite
- Send Confirmation (Link) look into Hosted UI in AWS Copgnito for custom UI interface Emails, etc..
- FA[Fee Arbitration] (optional MASS integration if swaping fees exceed a certain amount) [cVact (based on cpVact if cVactDa is = 0.00 else doesn’t change until threshold is met).] 

### MASS
- Work on making the Swapping system more efficient (aggregate all cVactTaa and cVactDa into a "listing system" so swapping doesn't occur multiple times from individual VatopGroups and happens only once per Bitcoin Price Change)
- if cVactDa < $0.01, cancel (exit) MASS & HPM supplication

### Last Resort
- Remove console.logs (and console.errors/warn) from all wrappers(userContext, HPMContext & MASSContext), hide "masstester" "wallettester" "hpmtester" & "hpmmasstester" from main
- Resolve Google/Bing/Yahoo Search Tab issues (Bing Webmaster Tools) (Add Unique Metatags to all recurring pages)





























## Arells 1.5 (Sell/Export USDC)

**If initial Bitcoin amount is less than USDC amount, then "buy" equivalent BTC before exporting so for example: You start with 0.00121 BTC worth $200 when Bitcoin is at $60,000. To maintain the same value ($205), when the price of Bitcoin falls to $10,000, you buy Bitcoin using your $205 in USDC. At $10,000 per Bitcoin, you would get: $205 / $10,000 = 0.0205 BTC.**

### Testing
- Create New Export Wallet Address for Selling and Exporting USDC/CBBTC
- supplicateUSDtoWBTC (with holdMASS function revoked)
- - If holdMASS is true for all vatopGroups, then start internal countdown (test with simple 30 second countdown) until reset holdMASS to false after countdown API connected to email (always todays date Hawaiian time) [mm/dd/yr], next update replaces Date? (only if all supplicateWBTCtoUSDCs are true then start time)… Update every 24~ hours. 
- Export Test (similar to sell except (Combines the acVactTaa and acVactDas and subtracts from the group with the lowest cpVatop first))
- - Ensure the “if changes supplicate” logic accounts only for changes from 0, not from number changes if cVactTaa changes from .03 to .02 or the Da, still activate (from selling)
- Ensure that vatopGroups delete if cVact <= $0.01 and if acVactTas && aBTC = 0, then delete a vatopGroup (do not add a VatopGroup)
- 3%-0.1% export (selling) fee?
- **fix Selling Discrepancy Issue (VERY IMPORTANT)**
- - if (cVactDa > 0.00) take Dollar difference from cpVact - bitcoinPrice and ensure this USDC amount is used to bridge to BTC and that amount it added to BTC address before exporting out (figure out how to ensure aBTC doesn't update from BTC since we'll be adding more BTC before exporting)
- Sell Test (HPMContext)
- - (start here first since taking from highest HPAP) if acVactTaa > 0.00000, subtract $sellAmount + 3% (in BTC format) from aBTC before initiating vatopGroups selling algo and incrementing into soldAmounts. Then initiate sellWBTC"Function"(from Smart Contract).
- - (if acVactTaa <= 0.00000, then else here) if acVactDas > 0.00, increment $sellAmount into soldAmounts(this is already baked into the HPM algorithm). Then initiate sellUSDC"Function"(from Smart Contract).

- Test Sell (without HPM) 
- - Import (Polygon POS USDC wallet created in Cognito (when Import clicked)). Encrypt/Decrypt Wallet Key (like Bitcoin).

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

#### Metatags/ Description (Home)
- Alter: "Import Small Amounts of Bitcoin, ensure that they never lose value."

### Last Resort
- Create separate Wallet to handle where we get our 3% fee...

























## Arells 1.7 (Export Bitcoin)

### Email
- Check "Main-Inv" folder in email

### Testing (HPM & MASS Tester)
- Test Export process... 
- - handleExport (add try, awaits and catch to ensures the entire process is successful before updating backend information) (check handle Sell for reference).
- - - 
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

## Code Name: Project Omega

### Problem: AI is on track to displace many jobs.

### Solution: A marketplace that creates new jobs for people in a AI job displacing world.


