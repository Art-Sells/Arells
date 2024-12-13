# Arells Build Notes...

## Arells Cryptocurrency Marketplace MVP

## Arells 1 (Import/Custody Bitcoin)

### Testing


- Testnet (with HPM (Increase/Decrease Bitcoin Price)) WBTC/USDC supplicating based on MASS & FA(Fee Arbitration)
- - - Create a createMASSusdc section that activates "createMASS" function from smartContract within the createMASS function and add a new body to create an address ansection where i can see MASS WBTC Wallet Balance (my wallet balance) (separate from Bitcoin Balance), and USDC Balance
- - Search if Polygon POS Wallet exists in Cognito, then Create Polygon POS wallet address (and encrypt key) (check MASSProvider for checking reference and SignUp.tsx for cognito reference and (decrypter) (add console.logs to ensure it decrypts the private key correctly)) (automatically activates a "fund wallet" when "Import" clicked that pulls my Address and PrivateKey and funds a wallet 0.005 MATIC)
- - Import: BTC amount (imported and minted into WBTC) aBTC updated (not incremented) based on BTC amount (look at handleImport function in amountToImport as referencce for mint(function)) ***Multiply aBTC and acVactTas * 10000000 (or convert to SATS)  before import (look at test/index.js for refference)*** if (Import dimensions are met, await the mint function to go through before completing import)
- - MASSsmartContract(WrapMassContractProvider):
- - - Add Console.logs to MASSarchitecture & MASSsmartContract before test (check NOV30 GitHubFile)
- - - supplicateUSDCintoWBTC(MASSsmartContract) (amount & bitcoinPrice taken from HPMContext cVactTaa (converts cVactTaa(in WBTC) format into USDC format, and swaps that amount from USDC into WBTC)) ***Multiply cVactTaa * 10000000 (or convert to SATS) (look at test/index.js for reference)***
- - - supplicateWBTCintoUSDC(MASSsmartContract) (amount & bitcoinPrice taken from HPMContext cVactDa (converts cVactDa(in USDC) format into WBTC format, and swaps that amount from WBTC into USDC)) ***Multiply USDC * 100 (or convert to cents) (look at test/index.js for reference)***
- - - When swap initiated, subtract (PolygonPOS)swapping fee (same as handleSell function but without incrementing into “soldAmounts”) from cVact (show HPMContext and MASSsmartContract to GPT for help)
- - - if cVactDa < $0.01, cancel (exit) MASS
- Send 1 USDC to deployed Smart Contract Addresses

### After Test
- deploy to polygon mainnet and refactor hardhat config and signer.tsx


### Account
- Set A/B (Wallet to load 3-4 seconds?)
- (If Bitcoin wallet has more than a certain amount), then hide "Import Bitcoin to ensure your investments never lose value" and show "Sell, Withdraw boxes"

#### Import (Page)
- Import Bitcoin to ensure your investments never lose value

#### After Completion: Amplify/S3 Login
- Ensure that NEXT_PUBLIC is not invoked!
- Delete MASS address info from MASStester

#### Metatags/ Description (Home)
- Alter: "Import Small Amounts of Bitcoin, ensure that they never lose value."

### Other (if Time Permits)
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

### Last Resort
- Remove console.logs (and console.errors/warn) from all wrappers(userContext, HPMContext & MASSContext), hide "masstester" "wallettester" and "hpmtester" from main
- Resolve Google/Bing/Yahoo Search Tab issues (Bing Webmaster Tools) (Add Unique Metatags to all recurring pages)






























## Arells 1.5 (Export BTC)

**If initial Bitcoin amount is less than USDC amount, then "buy" equivalent BTC before exporting so for example: You start with 0.00121 BTC worth $200 when Bitcoin is at $60,000. To maintain the same value ($205), when the price of Bitcoin falls to $10,000, you buy Bitcoin using your $205 in USDC. At $10,000 per Bitcoin, you would get: $205 / $10,000 = 0.0205 BTC.**

### Testing
- Export Test (similar to sell except)
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
- Check "M-I" folder

### Testing
- Test Export process... 
- - handleExport (add try, awaits and catch to ensures the entire process is successful before updating backend information)

### Export (Bitcoin)
**Pull handleExport from HPMContext and edit saveVatopGroups import for success and error modal handling.**
- (A(arells-circle)) -> Account Page (B(bitcoin-logo)) ->Buy Page
- (W) Wallet: Displays acVatops.
- (B) Amount: Displays acVactTas 7 decimals long maximum
- Export Amount Input: (tel no * or #) see HPMTester
- Export Address Input: (tel no * or #) see HPMTester
- Exporting
- (B) 0.00998 (decimals in Bitcoin format tel with no * or # (see Bitcoin Page) 7 decimals long maximum)
- Total exported wallet value: see HPMTester
- You will lose: see HPMTester
- (CANCEL) -> Account Page, 
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


