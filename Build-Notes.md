# Arells Build Notes...

## Arells Cryptocurrency Marketplace MVP

Test Address: bc1qhxg00ztzgplpaj2774g73ct9padcyczhn8f5g6

Test Address 2: bc1qltdmeghfnxhaqr63q76lq5nldwzl3lamd2vjtj

### Wrappers
- **CoinGecko API wrapper** purchase CoinGecko API?
- **Possibly a connect wallet & log in/sign up account wrapper** that automatically connects to your prior wallet with Address and Private Key pulled from backend once logged in.
- **Possibly a plaid wraper**
- **HPM Wrapper (see Readme for building mechanisms example)**

### Home Page
- If Log In = true, go to /Account

### Log In
- **connect wallet wrapper initiated**

### Sign Up
- Modal:
- - Account Created (View Account)-> Creates Bitcoin Wallet **Backend: saves Address to Email and encrypts private key and saves it on backend** then takes you to Homepage with wallet connected **connect wallet wrapper initiated**

### Home(redirects to Account if logged in)
- if holding, sell display none, holding display true.
- Reloads modules every 5 minutes (create price, wallet, and profits animation css) from coin gecko API wrapper?

 #### Price = Bitcoin Price API 

 #### Buy (Page)
 - Connects to Plaid First, (if not connected)

 #### Sell (Page)
 - Connects to Plaid First, (if not connected)
 - displayed once a cVatop + (cVatop * .03) > the cVact, othersie hidden

 #### Holding (replaces Sell button)
 - displayed once a cVatop + (cVatop * .03) < the cVact, othersie hidden

 #### (A)(B) Price = Holding Price
 - Holding Price = HPAP, if the Bitcoin price rises above the HPAP, then Holding Price = Bitcoin Price

 #### (A)(B) Value
 - Displays acVacts if the acVacts + (acVacts * .03) > acVatops, otherwise displays acVatops.

 #### Export (Page)

 #### Profits
 - displays acdVatops if positive, else ...

 #### Amount Sold
 - shows $amount
 - (Withdraw)-> Withdraw Page

 #### Log Out (Redirects to Home)


### Import
- Pull Bitcoin Address From Backend

### Export
- (A(arells-circle)) -> Account Page (B(bitcoin-logo)) ->Buy Page
- (W) Wallet: Displays acVacts if the acVacts + (acVacts * .03) > acVatops, otherwise displays acVatops.
- (B) Amount: Displays all Bitcoin available.
- Export Amount Input: back-end takes from highest cVact(cpVatop), if cpVatop(cpVact)1 matches cpVatop(cpVact)2, then take from cpVatop1 first then cpVatop2, etc and deletes the cVatops/cVacts if needed (see Readme)
- Export Address Input:
- Exporting
- (B) 0.00998 (decimals in Bitcoin format tel with no * or # (see Bitcoin Page))
- Total exported wallet value: "$" = combines cVacts from input
- You will lose "$": combines and displays Export Amount Inputs of the cdVatops if negative, otherwise, display none.
- (CANCEL) -> Account Page, 
- (EXPORT) -> Modal
- - Modal:
- - - Exporting (3 second delay) back-end takes from highest cVact(cpVatop), if cpVatop(cpVact)1 matches cpVatop(cpVact)2, then take from cpVatop1 first then cpVatop2, etc and delete the cVatops/cVacts if needed (see Readme)
- - - Successfuly Exported (exporting modal = false, adds Date (logs new Date in "Transaction Dates" database), (B) and link to Block Exporer to "Exported Amount in Database") (View Transactions)-> Transactions-
- - - Export Failed (exporting modal = false)(OK) (if export amount isn't lesser or equal to Bitcoin Wallet amount or other address)
- - - Check Address (exporting modal = false)(if Bitcoin Address is not in right format (refer to Bitcoin Page))
- - - Enter information (exporting modal = false) (if one or more fields are empty)
- - - Send more Bitcoin (exporting modal = false) (refer to Bitcoin Page for fee limit)
- Reloads modules every 5 minutes (price, wallet, and losses animation css) from coin gecko API wrapper?
- all prices and wallet values structured like so: 1,000,000.00, Bitcoin Amount based on how many Sats?

### Buy
- (B) Price
- Amount Input (in $) format tel with no * or # 
- fees (total * .03 goes to our Arells Bitcoin Wallet)
- total (from input)
- (BUY) -> Modals
- Modals: 
- - Confirming Purchase 3 Second delay
- - Purchase Complete (View Transactions)-> Transactions, 
- - Purchase Failed (confirming purchase modal = false, adds Date (logs new Date in "Transaction Dates" database), $, and (B) to "Bought Amount in Database"), check Bank Account for sufficient funds (View Connected Bank Account) -> Bank Account
- Reloads modules every 5 minutes (price animation css) from coin gecko API wrapper?
- all prices and wallet values structured like so: 1,000,000.00

### Sell
- (B) Amount Available To Sell" displays acVacts if the acVacts + (acVacts * .03) > acVatops, otherwise everything below is hidden.
- - Profits: displays acdVatops if positive, else ...
- - Sell Amount Input: $ format tel with no * or # 
- - Sell: takes from lowest cVact(cpVatop), if cpVatop(cpVact)1 matches cpVatop(cpVact)2, then take from cpVatop1 first then cpVatop2, etc.
- - (Confirm Sale) -> Modals
- - - Modals: 
- - - - Confirming Sale...3 Second delay
- - - - Sale Complete (confirming sale modal = false) (subtracts first from cVact 1, then 2, 3, etc and deletes those cVacts & cVatops from the database, adds Date (logs new Date in "Transaction Dates" database), $, and (B) to "Sold Amount in Database") (View Transactions) -> Transactions
- - - - Transaction Failed (confirming sale modal = false) (OK)
- Reloads modules every 5 minutes (price, wallet, and profits animation css) from coin gecko API wrapper?
- all prices and wallet values structured like so: 1,000,000.00 Bitcoin Amount based on how many Sats?


### Transactions
- (A(arells-circle)) -> Account Page (B(bitcoin-logo)) ->Buy Page
- (Calendar) 06/21/24 (mm/dd/yr) (pulls from "Transactions Dates" from Database)
- (B) Sold: 0.0087 (pulls from "Sold Amount" database) 
- - (Cash Register) for: $ 
- (B) Bought: 0.0087 (pulls from "Bought Amount" database) 
- - (Cash Register) for: $
- (Vault) Withdrew: $ (pulls from "Withdrew Amount" database) 
- - (Bank) to: (Plaid Bank Logo Button?)->Bank Account
- (^-circle) Exporting: 0.00043 (if loading useEffect from Block Explorer)| (B) Exported: 0.00323 (if completed useEffect) (pulls from "Exported Amount" database) 
- - (App) To: (View On Block Explorer)-> Block Explorer Link
- all values structured like so: 1,000,000.00, Bitcoin Amount based on how many Sats?

### Withdraw
- (A(arells-circle)) -> Account Page (B(bitcoin-logo)) ->Buy Page
- (Cash Register) Amount $
- (Bank) to: (Plaid Bank Logo Button?)->Bank Account
- (Withdraw) -> Modal
- - Modal:
- - - (Bank) Withdrawing 
- - -  (Check) Withdraw Complete (View Transactions adds Date (logs new Date in "Transaction Dates" database), (B) and link to Bank Account to "Withdrew Amount in Database")-> Transactions
- - - (X) Withdraw Failed, check Bank Account Connection (View Connected Bank Account) -> Bank Account
- all values structured like so: 1,000,000.00

### Bank Account
- (A) -> Account Page (B) ->Buy Page
- Plaid info?

## Arells Cryptocurrency Marketplace 1.5

### Home Page (without login)
- Add transactions button

### Sign Up
- Verify Email *important*

### Log In
- Forgot Password 
- Add 2FA for Buying/Selling and first Logging In.

#### Misc

##### Home Page:
10 years, 5 years, 1 year, 6 months, 90 days, 30 days, 7 days, 24 hours, 6 hours, 1 hours (load whichever time frame from 24 hours first, to 7 days, prioritize days then months then years in regards to the highest percentage increase).

## Code Name: Project Omega

### Problem: AI is on track to displace many jobs.

### Solution: A marketplace that creates new jobs for people in a AI job displacing world.


