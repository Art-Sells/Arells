# Arells Build Notes...

## Arells Cryptocurrency Marketplace MVP

## Arells 1.0

### Testing
- Test Import
- - MASS(Market Automated Supplication System).json created when Import button first clicked
- - - aBTC(ArellsBTC){created in MASS and incremented from the total BTC amount}
- - - BTC amount incremented into aBTC first then swapped into USDC
- - - - if aBTC > acVactTas then "handleImportAmount" = aBTC - acVactTas (3 second useEffect)
- - - - - Sell (incorporate into handleSell: swap $sellAmount in $ from WBTC to USDC (while subtracting $sellAmount from aBTC))
- - - soldAmounts == aUSDC(ArellsUSDC){created in MASS and updated based on soldAmounts}
- - - USDC == aUSDC + acVactDas
- - - - if acVactDas > 1, swap WBTC equivalent into USDC
- - - - if acVactTaa > 0.00001 || $1.00, swap USDC equivalent into WBTC
- - - acVactDas == aUSDC (Arells USDC)
- Test aWBTC to aUSDC trading/swapping based on MASS & FA(Fee Arbitration)
- - FA:
    1. If Bitcoin price ≥ cpVact + 0.5(FA): cVact in USDC is traded for WBTC.
	2. If Bitcoin price ≤ cpVatop + 0.5(FA): cVactTa in WBTC is traded for USDC.
- Import & Sell (without HPM) Bitcoin to WBTC(Polygon), WBTC<-swap->USDC(Polygon). Import (Polygon USDC wallet created (when Import clicked)) Encrypt/Decrypt Wallet Key (like Bitcoin).
- Testnet (with HPM (Increase/Decrease Bitcoin Price)) WBTC/USDC trading/swapping based on MASS & FA(Fee Arbitration)
- - FA:
    1. If acVactTaa < 0.0001, then trade remaining acVactTaa in USDC WBTC for USDC 
	2. If aUSDC < USDC, then trade remaining USDC for WBTC  200 - 500 = 300

### Account
- Set A/B (Wallet to load 3-4 seconds?)
- (If Bitcoin wallet has more than a certain amount), then hide "Import Bitcoin to Sell" and show "Sell, Withdraw boxes"
- Sell (Polygon USDC wallet created (only once)) Encrypt/Decrypt Wallet Key (like Bitcoin)
- Withdraw (USDC)

#### Import (Page)
- Import Bitcoin to ensure your investments never lose value
- import fee: $0.01 - $0.5~


### Sell
**Test to see if it'll sell if over amount?**
- (B) Amount Available To Sell
- - amount: displays acVactsAts
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

### Withdraw
- Withdraw and send your USDC into another exchange
- USDC (Polygon) Address
- Amount
- Amount to Send
- Send

#### Test Amplify/S3 Login


### Other (if Time Permits)
- Remove all "2 second delay for buttons"
- Fix (signOut /sign-up/log-in issue) loading  after button click success stays true forever... add "await"?
- Fix (View Account) slowness issue (Add Preparing Account loading we time out at least 2 seconds before this loads)
- emailConfirmed attribute
- - if null, emailUnConfirmed(true){}, emailConfirmed(false){};
- - if true, opposite
- Send Confirmation (Link) look into Hosted UI in AWS Copgnito for custom UI interface Emails, etc..

### Last Resort
- Create separate Wallet to handle where we get our 3% fee...
- Remove console.logs from all components, hide "wallettester" and "hpmtester" from main
- Resolve Google/Bing/Yahoo Search Tab issues (Bing Webmaster Tools) (Add Unique Metatags to all recurring pages)


## Arells 2.0 (and beyond):

Create Separate GitHub Repo for HPM System







































## Arells 1.5 - 2

### Important:
- Update Blockchain.info API to Amplify (IP) API
- Emails (Bitcoin Available to Sell)
- Resolve "HPMContext" errors that show "cannot find email, Error fetching Bitcoin Price, etc etc" from console.log if pages don't need them...
- Delete all Console Logs in LogIn/SignUp/Account/Buy/Sell/Export/HPMContext
- Sign up for 2 more Exchange APIs then begin aggregating our own Cryptocurrencies (set into plan)…

### Testing
- Test Export process... 
- - handleExport (add try, awaits and catch to ensures the entire process is successful before updating backend information)

### Account
- Import
- Export

### Sell
**Pull handleSell from HPMContext sellAmountContext and edit saveVatopGroups import for success and error modal handling.**
if acVactsAts <= 0 && acVatops > 0 display:
-  (A)(B) Holding Amount
- - Wallet: acVatops
if acVatops <= 0:
- No Amount Available to Sell
else:

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

### Withdraw
**From Sold Amount Attribute (API)**
- (A(arells-circle)) -> Account Page (B(bitcoin-logo)) ->Buy Page
- Displays "Sold Amount" from Database $
- (Bank) to: (Plaid Bank Logo Button? from Plaid Wrapper?)->Bank Account
- (Withdraw) -> Modal
- - Modal:
- - - (Bank) Withdrawing 
- - -  (Check) Withdraw Complete (View Transactions adds Date (logs new Date in "Transaction Dates" database), (B) and link to Bank Account to "Withdrew Amount in Database")-> Transactions
- - - (X) Withdraw Failed, check Bank Account Connection (View Connected Bank Account) -> Bank Account

### Bank Account
- (A) -> Account Page (B) ->Buy Page
- Plaid info from Plaid Wrapper?

### Import
- Pull Bitcoin Address From Backend
- - acVactTas <- add a useEffect that constantly updates based on Total Bitcoin Amount from Bitcoin Wallet

### Export
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

### KYC/AML
- Add this to Plaid API

### UserContextWrapped
- if logged in for more than 5 minutes without use, automatically sign out and take to homepage.

### Home/Account
- Account/Withdraw/Sell/Buy/Transactions/BankAccount/Confirm (if not logged in) Revert To Home
- Contact us (Account/Home): Email
- Clean up Lagging Pages
- Contact us: Email

### Sign Up
- Verify Email *important*
- Add noreply@arells.com to Amazon SES Identities
- - Test to see if "Confirmation Code Exists" error works...

### Confirm
- - - Ensure Private Key is Encrypted (if successful)

### Buy
- - Purchase Failed, check Bank Account for sufficient funds (View Connected Bank Account) -> Bank Account
- - Purchase Complete (confirming purchase modal = false, (see HPMTester)) -> View Transactions

### Sell
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
- Add Imported

#### Misc
- fix "bitcoinAmount" API misswording issue within Withdraw Amount JSON.
- Amazon EC2 Maintenance restructure...

##### Home Page:
10 years, 5 years, 1 year, 6 months, 90 days, 30 days, 7 days, 24 hours, 6 hours, 1 hours (load whichever time frame from 24 hours first, to 7 days, prioritize days then months then years in regards to the highest percentage increase).

## Code Name: Project Omega

### Problem: AI is on track to displace many jobs.

### Solution: A marketplace that creates new jobs for people in a AI job displacing world.


