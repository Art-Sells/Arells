# Arells Build Notes...

## Arells Cryptocurrency Marketplace MVP

Test Address: bc1qhxg00ztzgplpaj2774g73ct9padcyczhn8f5g6

Test Address 2: bc1qltdmeghfnxhaqr63q76lq5nldwzl3lamd2vjtj

### Wrappers
- **Possibly a plaid wraper**
- **HPM Wrapper (see Readme for building mechanisms example)**

### Home Page
- If Log In = true, go to /Account

### Home(redirects to Account if logged in)
- if holding, sell display none, holding display true.
- Reloads ((B)Price, (A)(B)Price, Wallet, and profits animation css) every 5 seconds from coin gecko API wrapper?

 #### (B) Price = Bitcoin Price API 

 #### Buy (Page)
 - Connects to Plaid First, (if not connected)

 #### Sell (Page)
 - Connects to Plaid First, (if not connected)
 - displayed if acVacts == 0 or if acVactsAts(see Readme acVactsAts section) > 0, otherwise hidden 

 #### Holding (replaces Sell button)
 - displayed once acVactsAts(see Readme acVactsAts section) = 0, othersie hidden

 #### (A)(B) Price = Holding Price
 - Holding Price = HPAP, if the Bitcoin price rises above the HPAP, then Holding Price = Bitcoin Price

 #### Wallet
 - Displays acVacts if the acVacts + (acVacts * .03) > acVatops, otherwise displays acVatops. else "$0"

 #### Profits
 - displays acdVatops if positive, else "$0"

 #### Export (Page)

 #### Amount Sold
 - Displays "Sold Amount" from Database $, else, "$0"
 - (Withdraw)-> Withdraw Page

 #### Log Out (Redirects to Home)

### Import
- Pull Bitcoin Address From Backend

### Export
- (A(arells-circle)) -> Account Page (B(bitcoin-logo)) ->Buy Page
- (W) Wallet: Displays acVacts if the acVacts + (acVacts * .03) > acVatops, otherwise displays acVatops.
- (B) Amount: Displays acVatopTas.
- Export Amount Input: back-end takes cVactTa from the Vatop Group with the highest cpVatop, otherwise starts from the lowest Vatop Group #, delete the Vatop Group if its cVact = 0 
- Export Address Input:
- Exporting
- (B) 0.00998 (decimals in Bitcoin format tel with no * or # (see Bitcoin Page))
- Total exported wallet value: "$" = combines cVacts from input
- You will lose "$": combines and displays Export Amount Inputs of the cdVatops if negative, otherwise, display none.
- (CANCEL) -> Account Page, 
- (EXPORT) -> Modal
- - Modal:
- - - Exporting (3 second delay) back-end takes cVactTa from the Vatop Group with the highest cpVatop, otherwise starts from the lowest Vatop Group #, delete the Vatop Group if its cVact = 0 
- - - Successfuly Exported (exporting modal = false, adds Date (logs new Date in "Transaction Dates" database), (B) and link to Block Exporer to "Exported Amount in Database") (View Transactions)-> Transactions-
- - - Export Failed (exporting modal = false)(OK) (if export amount isn't lesser or equal to Bitcoin Wallet amount or other address)
- - - Check Address (exporting modal = false)(if Bitcoin Address is not in right format (refer to Bitcoin Page))
- - - Enter information (exporting modal = false) (if one or more fields are empty)
- - - Send more Bitcoin (exporting modal = false) (refer to Bitcoin Page for fee limit)
- Reloads modules every 5 minutes (price, wallet, and losses animation css) from coin gecko API wrapper?
- all prices and wallet values structured like so: 1,000,000, Bitcoin Amount based on how many Sats?

### Buy
- (B) Price
- Amount Input (in $) format tel with no * or # 
- fees (total * .03 goes to our Arells Bitcoin Wallet)
- total (from input)
- (BUY) -> Modals
- Modals: 
- - Confirming Purchase 3 Second delay
- - Purchase Complete (creates new Vatop Group with all corresponding info)(confirming purchase modal = false, adds Date (logs new Date in "Transaction Dates" database), $, and (B) to "Bought Amount in Database") -> View Transactions
- - Purchase Failed, check Bank Account for sufficient funds (View Connected Bank Account) -> Bank Account
- - Enter information (if one or more fields are empty)
- Reloads modules every 5 minutes (price animation css) from coin gecko API wrapper?
- all prices and wallet values structured like so: 1,000,000
- all fees and totality values structured like so: 1,000,000.00

### Sell
- (B) Amount Available To Sell
- - Wallet: displays acVactsAts(see Readme acVactsAts section), if > 0 otherwise display "$ 0" while hiding everything below with: No Amount Available to Sell (Buy)-> Buy Page
- - Profits: displays acdVatops if >= 1, else "$0"
- - Sell Amount Input: $ format tel with no * or # 
- - Sell: takes cVact amount from the Vatop Group with the lowest cpVatop, if more than 1 Vatop Group has similar cpVatops, take from the cVact from the lowest Vatop Group #, deletes the Vatop Group if its cVact = 0 (see Readme).
- - (Confirm Sale) -> Modals
- - - Modals: 
- - - - Confirming Sale...3 Second delay
- - - - Sale Complete (confirming sale modal = false) (takes cVact amount from the Vatop Group with the lowest cpVatop, if more than 1 Vatop Group has similar cpVatops, take from the cVact from the lowest Vatop Group #, deletes the Vatop Group if its cVact = 0 (see Readme), adds Date (logs new Date in "Transaction Dates" database), $, and (B) to "Sold Amount in Database") (View Transactions) -> Transactions
- - - - Transaction Failed (confirming sale modal = false) (OK)
- - - - Enter information (if one or more fields are empty)
- Reloads modules every 5 minutes (price, wallet, and profits animation css) from coin gecko API wrapper?
- all prices and wallet values structured like so: 1,000,000 Bitcoin Amount based on how many Sats?
- all fees and totality values structured like so: 1,000,000.00


### Transactions
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
- all values structured like so: 1,000,000, Bitcoin Amount based on how many Sats?

### Withdraw
- (A(arells-circle)) -> Account Page (B(bitcoin-logo)) ->Buy Page
- Displays "Sold Amount" from Database $
- (Bank) to: (Plaid Bank Logo Button? from Plaid Wrapper?)->Bank Account
- (Withdraw) -> Modal
- - Modal:
- - - (Bank) Withdrawing 
- - -  (Check) Withdraw Complete (View Transactions adds Date (logs new Date in "Transaction Dates" database), (B) and link to Bank Account to "Withdrew Amount in Database")-> Transactions
- - - (X) Withdraw Failed, check Bank Account Connection (View Connected Bank Account) -> Bank Account
- all values structured like so: 1,000,000

### Bank Account
- (A) -> Account Page (B) ->Buy Page
- Plaid info from Plaid Wrapper?
- Change Bank Account (Plaid Connect? from Plaid Wrapper?)

### Other
- Change Metadata Sharing Wrapper Slogan: "Always Sell Bitcoin For Profits"
- Encrypt Bitcoin Private Key (after confirmation), then Decrypt. Decrypt Private Key After Log In to connect to Account...
- Account/Withdraw/Sell/Buy/Transactions/BankAccount/Confirm (if not logged in) Revert To Home

### If time permits:
- Clean up Console errors and all Console Logs...

## Arells Cryptocurrency Marketplace 1.5

### Home Page (without login)
- Add transactions button


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

#### Misc

##### Home Page:
10 years, 5 years, 1 year, 6 months, 90 days, 30 days, 7 days, 24 hours, 6 hours, 1 hours (load whichever time frame from 24 hours first, to 7 days, prioritize days then months then years in regards to the highest percentage increase).

## Code Name: Project Omega

### Problem: AI is on track to displace many jobs.

### Solution: A marketplace that creates new jobs for people in a AI job displacing world.


