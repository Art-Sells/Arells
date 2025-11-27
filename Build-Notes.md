# Arells Build Notes...

## Arells Cryptocurrency Marketplace MVP

## Arells v1

## Build LPPv1 Infrastructure
- re-write cbbtc/usdc_tests, etc
- update MASS-LPP APIs/tests/etc
- write API to track LPP/MEV-Arbitrage Revenue-sharing and TVL growth
- Remove Under Construction READMEs Periphery/Protocol Github, update all other HPM/MASS/LPP codebase Readmes
## Test
- Import Wallet (integrate into)
- Test with $5 injections for mass and ramp up after launching based on TVL growth.
1. Update HPM/MASS/LPP Codebase Readmes
- MASSTester:
1. test supplications
- HPMMASSTester:
1. refactor USDC/CBBTC equivalents (might not need)
- HPMarchitecture process for LPP v1 (remove newHAP in cVactDa, cVact, cVactTaa & uncomment out useEffects? from MASSarchitecture?)
1. If userAddress (USDC) !== 0, then createMASSWallet from signer.tsx, then initiateMASS (from signer.tsx) from same wallet
2. Integrate into initiateMASS: createMASS and new VatopGroup of which massAddress is attached (check import function (delete aBTC APIs from UserContext and folder APIs if necessary) in HPMarchitecture and update save/updateVatopGroups as well as).
3. VatopGroup
- cVatop: number = 0
- cpVatop: number = 0
- cdVatop: number = 0 
- cVact: number = 0
- cpVact: number = 0 
- cVactDa: number = massAddress USDC balance
- cVactTaa: number = 0
- HAP: number = 0
- supplicateCBBTCtoUSD: boolean = false
- supplicateUSDtoCBBTC: boolean = false
- holdMASS: boolean = false
- MASSid: = readMASS id number
- HPMpause = false
4. useEffect: If cVatop = 0 && cVactDa = 0, do nothing, else if cVatop = 0 && cVactDa != 0 && HPMpause == false, then run executeSupplication from MASS_USDC API.
- cpVatop = price of pool with best quote used to supplicate USDC into CBBTC
- cVatop = amount of CBBTC purchased from quote / price of pool with best quote used
- cdVatop = cVact - cVatop
- - cVact = cVactDa if cVactDa != 0, else = cpVact / cVactTaa
- - cpVact = price of pool with best quote used to supplicate USDC
- - cVactDa = massAddress USDC balance (as small as the smallest decimal it'll show)
- - cVactTaa = massAddress CBBTC balance (as small as the smallest decimal it'll show)
- - HAP = bitcoinPrice;
- - supplicateCBBTCtoUSD = false
- - supplicateUSDtoCBBTC = true
- - holdMASS = false
- - - updateVatopGroups
- - - fetchVatopGroups
5. useEffect: If current bitcoinPrice < HAP and HPMpause == false, then initiate executeSupplication from MASS_CBBTC API .
- cpVatop = no change
- cVatop = no change
- cdVatop = cVact - cVatop
- - cVact = cVactDa if cVactDa != 0, else = cpVact / cVactTaa
- - cpVact = price of pool with best quote used to supplicate CBBTC
- - cVactDa = massAddress USDC balance (as small as the smallest decimal it'll show)
- - cVactTaa = massAddress CBBTC balance (as small as the smallest decimal it'll show)
- - HAP = No Change;
- - supplicateCBBTCtoUSD: boolean = true
- - supplicateUSDtoCBBTC: boolean = false
- - holdMASS: boolean = true
- - - updateVatopGroups
- - - fetchVatopGroups
6. useEffect: Compare HAP/bitcoinPrice
- useEffect: If bitcoinPrice > HAP && HPMpause == false: releaseMASS button changes holdMASS to false.
7. useEffect: If current bitcoinPrice >= HAP then initiate executeSupplication from MASS_USDC API .
- cpVatop = no change
- cVatop = no change
- cdVatop = cVact - cVatop
- - cVact = cVactDa if cVactDa != 0, else = cpVact / cVactTaa
- - cpVact = price of pool with best quote used to supplicate CBBTC
- - cVactDa = massAddress USDC balance (as small as the smallest decimal it'll show)
- - cVactTaa = massAddress CBBTC balance (as small as the smallest decimal it'll show)
- - HAP = bitcoinPrice;
- - supplicateCBBTCtoUSD: boolean = false
- - supplicateUSDtoCBBTC: boolean = true
- - holdMASS: boolean = false
- - - updateVatopGroups
- - - fetchVatopGroups
8. Add USDC into Vatop Group, monitor change (cVact, cVactDa should increase)
9. Add CBBTC into Vatop Group, monitor change (cVactTaa should increase)
10. useEffect: If cVatop != 0 && cVactDa != 0 && HPMpause == false, holdMASS: false, then run executeSupplication from MASS_CBBTC API.
- cpVatop = no change
- cVatop = no change
- cdVatop = cVact - cVatop
- - cVact = cVactDa if cVactDa != 0, else = cpVact / cVactTaa
- - cpVact = price of pool with best quote used to supplicate CBBTC
- - cVactDa = massAddress USDC balance (as small as the smallest decimal it'll show)
- - cVactTaa = massAddress CBBTC balance (as small as the smallest decimal it'll show)
- - HAP = bitcoinPrice;
- - supplicateCBBTCtoUSD: boolean = true
- - supplicateUSDtoCBBTC: boolean = false
- - holdMASS: boolean = true
- - - updateVatopGroups
- - - fetchVatopGroups
11. pauseHPM function (executed only by Treasury Address/PrivateKey) run executeSupplication from MASS_CBBTC API, then HPMpause = true, monitor all approved addresses on LPP, if everything is USDC, then execute pauseSwitch from Treasury Contracts.
- cpVatop = no change
- cVatop = no change
- cdVatop = cVact - cVatop
- - cVact = cVactDa if cVactDa != 0, else = cpVact / cVactTaa
- - cpVact = price of pool with best quote used to supplicate CBBTC
- - cVactDa = massAddress USDC balance (as small as the smallest decimal it'll show)
- - cVactTaa = massAddress CBBTC balance (as small as the smallest decimal it'll show)
- - HAP = bitcoinPrice;
- - supplicateCBBTCtoUSD: boolean = true
- - supplicateUSDtoCBBTC: boolean = false
- - holdMASS: boolean = true
- - - updateVatopGroups
- - - fetchVatopGroups
- - HPMpause = true
12. restartHPM function (executed only by Treasury Address/PrivateKey) HPMpause = false, execute resetSwitch from Treasury Contracts..
- Test MASS APIs (then update MASS github (fundMassGas) and add state/readme(explain userWallet and MASSwallet, and initiateMASS and why the MAX is capped|signer.tsx to HPM Mechanics) )
- Change AWS Access Key from PUBLIC to PRIVATE (find all files that have this and change them)


### Offline (test network transactions daily and verify amounts in DEX UI)
- General Price is median exterior price and all MASS logic functions are dependent on this.
- ***importing USDC into the system (first), $5~ (do more research on this) max per daily injections into HPM-MASS-LPP [Might have to create separate wallet for this]***
- Import USDC into hpmtester account and test through HPMMASSTester.tsx (compare/contrast MASSTester.tsx api and adjust changes accordingly) (console.log transacton hash always add Fee Funder to new APIs (look at fee funding logic from old APIs))
- - Problems (if double addition for Vatop Data happens, reference back to aws-congif.js)
- - - Test Fee Free Route (Set Time to increase API Rate Limit on Infura (Even After Launch))
- - After Problems solved:
- - - Check TXN (and amount in Wallet .json calculate if fees taken)
- - Only change MASS booleans info if transactions are successful, keep trying transaction until successful, if transaction reverts, try transaction again (break transaction in .js files to test this).
- - replace cVactTa and acVactTas with cVactDat and acVactDat (to USD total)
- - Test releaseMASS and holdMASS booleans (releases all of the VatopGroups (not individuals only))
- - - Test release MASS (create lever to change frequency (minutes, days)) 5-10 minutes after also (see if supplications will run with latest bitcoin prices and if vatopGroups will update accordingly check wallet)
- - - test with 2-3 masstester@gmail.com accounts differing amounts (view all s3 jsons)
- - - Add endless 15 second loop incase Base network is down (break transaction in test files to test this) (if Base Network is congested add error message (if successful, then error message is invisible))
- Add (eve)
- Incorporate Export (look at Arells 1.5):
- - initiateMASS (sets repopulatingMASS function as false until transaction successful)
- - delete MASS wallets that USDC/CBBTC are both 0
- Can only Dcd PK with P (from nv)… Do extensive research on this, see if can cd and dcd from json and without P 
- Set up API (system) to log the date and times of Decoded price that was used of each pool and usdcOut/cbbtcOut from LPP to capture changes (offline/online versions) (including AUM from first wallet into the 2nd)
- AWS KMS (envelope encryption) for P/K
- and NEXT_PUBLIC for AWS (change back then change back to AWS for local tests *always* in all APIs & aws-config)

### Online:
- chence .env variables to NEXT_PUBLIC
- eMail verification (before import)
- Establish background useEffects order
- - 1. HPM: Fetch Bitcoin Price
- - 2. HPM: Fetch wallet Balances
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
- Run MASS for a week [hourly supplications] (with small amounts multiple accounts) and create chart to test system.
- save/update .json info every second to ext Dsk (then every day save/update cold)

Arells Wallet and change all Variables
- Build Back-End Lambda code for setInterval logic from HPMarchitecture and MASSarchitecture (check "Total WBTC Calculation" from GPT History) and adjust logic for every 1 week (if MEV bot churn rate remains stable, do not update LPPrebate.sol, if not stable, update)
- If holdMASS is true for all vatopGroups, then start internal countdown (test with simple 30 second countdown) until reset holdMASS to false after countdown API connected to email (always todays date Hawaiian time) [mm/dd/yr], next update replaces Date? (only if all supplicateCBBTCtoUSDCs are true then start time)… Update every 168~ hours. 
- Build Arells/HPM Notion (line-chart with TVL/AUM-HPM(Solid Marketplace), revenue, profits, etc) based on VatopGroup info and HPM-API revenue graph {Make it live updating every second?} TVL/AUM (solid (bull/sloth) vs liquid (bull/bear) totals)
- Updates (oDAO, FndrsINC, etc)

## After Test
- Remove P/K & P/K Test from e en vee (check decoding proces (in console.logs) for each individual account to prevent external P/K decoding (MASSTester.tsx and HPMTester.tsx?))
- CoinGecko API for Chart (remove half/barrier)
- Upload new HPM/MASSArchitecture to GitHub

### Account
- "Renders bear markets obsolete." <- and HOME
- - Import button triggers "Create Wallets" <- use function from MASSTester.tsx
- If acVatops != 0, then hide "Import USDC to begin"
- - Price: HPAP (formatPrice from HPMMASSTester.tsx)
- - Wallet: acVacts + Import Wallet Amount (formatCurrency from HPMMASSTester.tsx)
- - Profits: acdVatops (formatCurrency from HPMMASSTester.tsx) (as small as the smallest decimal it'll show. if it increases, then raise the decimal)
- - ( VIEW MY (SOLID MARKETPLACE) ) (button) If acVatops == 0, then hide
- - - Balance Updated every 1~ week
- - - - Error Message Modal visible: if Base network congestion error (from executeSupplication), if executeSupplication successful, then invisible.

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

#### My Solid Marketplace (Page)
- My | Solid Marketplace
- Wallets
- - View (wallet) Address
- - - Modal: 
- - - Address # (copy)
- - - Caution: This Wallet Address is only meant to review balances on blockchain explorers, DO NOT add any funds to this wallet address otherwise it will affect your profits.
- - % Number: cVact - cVatop = (as small as the smallest decimal it'll show. if it increases, then raise the decimal)
- - % Line: cVact - cVatop. Timeline starts by seconds, minutes, days, etc. Adjust line verticals based on how small or large the percentage increase
- - Total: cVact (formatCurrency from HPMMASSTester.tsx)
- - Profits: cdVatop (formatCurrency from HPMMASSTester.tsx) (as small as the smallest decimal it'll show. if it increases, then raise the decimal)
- - Market Status: 
- - - Bull (if CBBTC is not 0 from Vatop Group): Show explanation
- - - Sloth (if USDC is not 0 from Vatop Group): Show explanation
- - Load More (?numbers)

#### Metatags/ Description (all pages.tsx & components)
- Alter: Descriptions & Images (see /main)
- - Investments immune to bear markets. Invest and never worry about bear market losses again.
- Refactor Meta-tags {show AI and ask it why it displays home page ps and not meta tags}?

#### Deployment Amplify/S3 Login
- Ensure that NEXT_PUBLIC is not invoked and remove .env hardhat config expositions
- Delete MASS address info from MASStester and console.logs from all signer.
- Restructure decryption (readUserWallet, readMASS) process in apis
- Compare Main ENV with Test ENV before deployments

## Final Test
- 2-3 accounts, multiple vatop groups, multiple imports and exports (monitor for 2-weeks)

### After Completion
- Users:
- Get Leads (search AI automoated options [use same format] from X, etc)
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
- Notion (Liquid vs Solid Marketplace dynamics (water-cohesive-investments vs rocks-individualized-investments))
- set Infrastructure/periphery/contracts/LPPMigrator (look into v2 to see how to migrate liquidity from v1 to v2 of LPP for next version of LPPv2)


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


















### iOS & Android App & L3 (work on this together)
- iOS App (UI Layer)
- - Tagline: Built to prevent bear market losses.
- - Desc: Custody a Stablecoin (USDC) with Arells, and watch as it automatically facilitates supplications to and from Assets during market downturns protecting your investments and finances. 
- - submission: A blockchain interface app that connects users to decentralized protocols. The app itself performs no custody or transactions, custodial transactions are handled by autonomous smart contracts and AWS-based coordinations.
- - HPM/MASS/LPP (API Layer)
- - LPP Infrastructure (Blockchain Layer)
- L3 in accordance with v1.5 [get other engineer for this?]:
- Phase 0:
- - dev specifically for safety (to consistently test exploits before new LPP protocol is launched)
- Phase 1: 
- - Reference Base (and UI) Repos
- - Abstract Transaction Fees to $0~
- - Replace Transaction Fees from MASS profits (calculate previous cdVatops from new cdVatops and if +15% or more, subtract 5% into Base L3 and other 5% into Arells (should work the same as selling logic)). 
- Phase 2:
- - Txns/s need to be in 1000s-10000s per second for meme-coins to benefit (reference HPM Efficiency charts).
- HPM-Liquidity System (Brainstorm)
- - Reference V3 U*P (and UI) Repos(addresses for contract and API info)
- **remove dividedPercentageIncreases in the tokenCharts.ts to reflect maximum profits**
- Crypto Exchange/Wallet License (for iOS/Android App)








## Arells 1.5 (Sell/Export USDC) (and other token pairs)

### Test
- 1 entire token test to ensure pool match
- Create New Export Wallet Address for Selling and Exporting USDC/CBBTC
- **fix Selling Discrepancy Issue (VERY IMPORTANT)**
- Sell Test (HPMContext)
- - (start here first since taking from highest HPAP) if acVactTaa > 0.00000, subtract $sellAmount + 3% (in BTC format) before initiating vatopGroups selling algo and incrementing into soldAmounts. Then initiate sellWBTC"Function"(from Smart Contract).
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

### Pro-Natalism + Building Healthy Mind
- Daily Recommendation: 7-8~ hrs of daily sleep and a personal daily gratitude journal.
- P/T 25-30 hrs for prnts with kids (research slry). 40+ for those without (apart from Executive positions)



