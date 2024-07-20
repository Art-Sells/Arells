# Arells Build Notes...

## Arells Cryptocurrency Marketplace MVP

### Wrappers
- **HPM Wrapper**
- - **Mock Up:**
- - - - Sold Amount (Date: mm/dd/yr, Bitcoin-Amount-Sold, $ Sold-Amount) (handleSell retrieves from TransactionsHelper fetchVatopGroups & saves to saveVatopGroups "Transactions" custom attribute, "soldAmount" sub attribute)
- - - - Bought Amount (Date: mm/dd/yr, Bitcoin-Amount-Bought, $ Bought-Amount) (handleBuy retrieves from TransactionsHelper retrieves from fetchVatopGroups & saves to saveVatopGroups "Transactions" custom attribute, "boughtAmount" sub attribute)
- - - - Withdrew Amount (Date: mm/dd/yr, $ Withdrew-Amount, Bank Account "arells.com/bankaccount") (handleWithdraw retrieves from TransactionsHelper, "withdrawnAmount" sub attribute)
- - - - Exported Amount (Date: mm/dd/yr, Exported Amount, Link) (handleExported retrieves from TransactionsHelper  & saves to saveVatopGroups "Transactions" custom attribute, "exportedAmount" sub attribute)
- **Possibly a plaid wraper (saves bank account/plaid info if connected)**
- - Bank Account Attribute
- - - Plaid Info?
- **Possibly a Kraken Wrapper to pull Bitcoin to Buy & Sell?**
- Change manualBitcoinPrice and manualDate in coinGeckoApi/HPMContext to automated
- Test Entire Exporting(replaceEmailwithBitcoinAddressinAPI(FrontEnd/Lambda)), Importing(replaceEmailwithBitcoinAddressinAPI(FrontEnd/Lambda)), Buying(addEmail,BitcoinAddress,PrivateKeyinAPI(FrontEnd/Lambda)), Selling(addEmail,BitcoinAddress,PrivateKeyinAPI(FrontEnd/Lambda)) and Withdrawing(addEmail,BitcoinAddress,PrivateKeyinAPI(FrontEnd/Lambda)) process  (possibly just segments out from Vatop Combinations as Vatop Combinations are Real Numbers and Vatop Groups Fake ask Gpt?)
- - Buy/Sell buttons connect to plaid (if not connected)
- - acVacts: Entire Wallet (stripe?) amount (export|sell/import/buy takes/adds here)
- - acVactTas: Entire Bitcoin Wallet amount (export|sell/import/buy takes/adds here)
- - acVactsAts: Subtracts from Entire Wallet amount
- - acVactTaAts: Subtracts from Entire Bitcoin amount

### Home(redirects to Account if logged in)
- if acVactsAts = 0 sell display none, holding display true, else opposite
- Reloads ((B)Price, (A)(B)Price, Wallet, and profits animation css) every 10 seconds from coin gecko API wrapper?
- 1 second loader for all pages

 #### (B) Price = Bitcoin Price API 

 #### Buy (Page)
 - Connects to Plaid First, (if not connected)

 #### Sell (Page)
 - Connects to Plaid First, (if not connected)
 - displayed if acVacts == 0 or if acVactsAts > 0, otherwise hidden 

 #### Holding (replaces Sell button)
 - displayed once acVactsAts <= 0, otherwsie hidden

 #### (A)(B) Price = HPAP || Bitcoin Price
 - HPAP system from HPM wrapper

 #### Wallet
 - Displays $ acVatops

 #### Profits
 - displays $ acdVatops

 #### Export (Page)

 #### Amount Sold
 - Displays "Sold Amount" from Database $, else, "$0"
 - (Withdraw)-> Withdraw Page

 #### Log Out (Redirects to Home)

### Import
- Pull Bitcoin Address From Backend

### Export
**Pull handleExport from HPMContext and edit saveVatopGroups import for success and error modal handling.**
- (A(arells-circle)) -> Account Page (B(bitcoin-logo)) ->Buy Page
- (W) Wallet: Displays acVatops.
- (B) Amount: Displays acVactTas.
- Export Amount Input: (tel no * or #) see HPMTester
- Export Address Input: (tel no * or #) see HPMTester
- Exporting
- (B) 0.00998 (decimals in Bitcoin format tel with no * or # (see Bitcoin Page))
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

### Buy
**Pull handleBuy from HPMContext & BoughtAmountContext and edit saveVatopGroups import for success and error modal handling.**
- (B) Price
- Amount Input (in $) (tel no * or #) see HPMTester
- fees (total * .03 goes to our Arells Stripe Account?)
- total (from input) see HPMTester
- (BUY) -> Modals
- Modals: 
- - Confirming Purchase 3 Second delay
- - Purchase Complete (confirming purchase modal = false, (see HPMTester)) -> View Transactions
- - Purchase Failed, check Bank Account for sufficient funds (View Connected Bank Account) -> Bank Account
- - Enter information (if one or more fields are empty)
- Reloads modules every 5 minutes (price animation css) from coin gecko API wrapper?

### Sell
**Pull handleSell from HPMContext sellAmountContext and edit saveVatopGroups import for success and error modal handling.**
if acVactsAts < or = 0 && acVatops > 0 display:
- (B) Holding Amount
- - Wallet: acVatops
if acVatops < or = 0:
- No Amount Available to Sell
else:
- (B) Amount Available To Sell
- - Wallet: displays acVactsAts
- - Profits: displays acdVatops
- - Sell Amount Input: (tel no * or #) see HPMTester
- - Sell: see HPMTester
- - (Confirm Sale) -> Modals
- - - Modals: 
- - - - Confirming Sale...3 Second delay
- - - - Sale Complete (confirming sale modal = false) (see HPMTester) (View Transactions) -> Transactions
- - - - Transaction Failed (confirming sale modal = false) (OK)
- - - - Enter information (if one or more fields are empty)
- Reloads modules every 10 seconds (price, wallet, and profits animation css) from coin gecko API wrapper?

### Transactions
**From Transactions Attribute (API)**
- (A(arells-circle)) -> Account Page (B(bitcoin-logo)) ->Buy Page
- (Calendar) 06/21/24 (mm/dd/yr) (pulls from "Transactions Dates" from Database)
- (B) Sold: 0.0087 (pulls from "Sold Amount" database) 
- - (Cash Register) for: $ 
- (B) Bought: 0.0087 (pulls from "Bought Amount" database) 
- - (Cash Register) for: $
- (Vault) Withdrew: $ (pulls from "Withdrew Amount" database) 
- - (Bank) to: (Plaid Bank Logo Button? from Plaid Wrapper?)->Bank Account
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

### After Full API/Wrapper Testing
- Buy CoinGecko API and implement 10 second interval for Bitcoin Price checking maybe through HPM Context?

### Important
- Create separate Wallet to handle where we get our 3% fee... (Stripe?)
- Delete all Console Logs in LogIn/SignUp/Account/Buy/Sell/Export/HPMContext
- Encrypt Bitcoin Private Key (after confirmation), then Decrypt. Decrypt Private Key After Log In to connect to Account...

### Other (if Time Permits)
- Account/Withdraw/Sell/Buy/Transactions/BankAccount/Confirm (if not logged in) Revert To Home
- Contact us (Account/Home): Email
- resolve endless useEffectLoads (from HPMContext)

## Arells Cryptocurrency Marketplace 1.5

### Home/Account
- Contact us: Email

### Sign Up
- Verify Email *important*
- Add noreply@arells.com to Amazon SES Identities
- - - Test to see if "Confirmation Code Exists" error works...

### Confirm
- - - Ensure Private Key is Encrypted (if successful)
- - - HPM Vatop Groups saved as tables within api/user?

### Log In
- - if email already exists but is unconfirmed -> Confirm Page
- Forgot Password 
- Add 2FA for Buying/Selling and first Logging In.

### Bank Account
- Change Bank Account (Plaid Connect? from Plaid Wrapper?)

### Transactions
- Add Imported

#### Misc

##### Home Page:
10 years, 5 years, 1 year, 6 months, 90 days, 30 days, 7 days, 24 hours, 6 hours, 1 hours (load whichever time frame from 24 hours first, to 7 days, prioritize days then months then years in regards to the highest percentage increase).

## Code Name: Project Omega

### Problem: AI is on track to displace many jobs.

### Solution: A marketplace that creates new jobs for people in a AI job displacing world.


