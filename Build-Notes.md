# Arells Build Notes...

## Arells Cryptocurrency Marketplace MVP

Test Address: bc1qhxg00ztzgplpaj2774g73ct9padcyczhn8f5g6

Test Address 2: bc1qltdmeghfnxhaqr63q76lq5nldwzl3lamd2vjtj

### Wrappers
- **CoinGecko API wrapper** purchase CoinGecko API?
- **Possibly a connect wallet & log in/sign up account wrapper** that automatically connects to your prior wallet with Address and Private Key pulled from backend once logged in.
- **Possibly a plaid wraper**

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
 - Holding Price dependent on highest cpVatop

 #### (A)(B) Value
 - Displays acVacts if the acVacts + (acVacts * .03) > acVatops, otherwise displays acVatops.

 #### Export (Page)

 #### Profits
 - acVacts - acVatops = Profits (Only displays if positive)

 #### Amount Sold
 - shows $amount
 - (Withdraw)-> Withdraw Page

 #### Log Out (Redirects to Home)


### Import
- Pull Bitcoin Address From Backend

### Export
- (A(arells-circle)) -> Account Page (B(bitcoin-logo)) ->Buy Page
- (A)(B) Wallet: Displays acVacts if the acVacts + (acVacts * .03) > acVatops, otherwise displays acVatops.
- (B) Amount: Displays all Bitcoin available.
- Export Amount Input: back-end takes from highest cVact(cpVatop), if cpVatop(cpVact)1 matches cpVatop(cpVact)2, then take from cpVatop1 first then cpVatop2, etc and deletes the cVatops/cVacts if needed (see Readme)
- Export Address Input:
- Exporting: 0.00998 
- You will lose "$": combines and displays Export Amount Inputs of the cVacts - cVatops = Losses, otherwise, display none.
- (CANCEL) -> Account Page, 
- (SEND) -> Transactions Page
- - Modal:
- - - Exporting (2 second delay) back-end takes from highest cVact(cpVatop), if cpVatop(cpVact)1 matches cpVatop(cpVact)2, then take from cpVatop1 first then cpVatop2, etc and delete the cVatops/cVacts if needed (see Readme)
- - - Successfuly Exported (View Transactions)-> Transactions-
- - - Export Failed (OK)
- Reloads modules every 5 minutes (price, wallet, and losses animation css) from coin gecko API wrapper?

### Buy
- (B) Price
- Amount Input (in $)
- fees
- (BUY) -> Modals
- Modals: 
- - Confirming Purchase
- - Purchase Complete (View Portfolio)-> Account, 
- - Purchase Failed, check Bank Account for sufficient funds (View Connected Bank Account) -> Bank Account
- Reloads modules every 5 minutes (price animation css) from coin gecko API wrapper?

### Sell
- "Amount Holding" displays acVatops if the acVatops + (acVatops * .03) < acVacts, otherwise it is hidden.
- "Amount Available To Sell" displays acVacts if the acVacts + (acVacts * .03) > acVatops, otherwise everything below is hidden.
- - Profits: acVacts - acVatops = Profits
- - Sell: takes from lowest cVact(cpVatop), if cpVatop(cpVact)1 matches cpVatop(cpVact)2, then take from cpVatop1 first then cpVatop2, etc.
- - (Confirm Sale) -> Modals
- - - Modals: 
- - - - Confirming Sale... Amount To Sell - Arells Fees
- - - - Sale Complete (subtracts first from cVact 1, then 2, 3, etc and deletes those cVacts & cVatops from the database)(View Transactions) -> Transactions
- - - - Transaction Failed (OK)
- Reloads modules every 5 minutes (price, wallet, and profits animation css) from coin gecko API wrapper?


### Transactions
- (A(arells-circle)) -> Account Page (B(bitcoin-logo)) ->Buy Page
- Sold "amount of Bitcoin" for "dollar amount" with "profits"
- Bought "amount of Bitcoin" for "dollar amount"
- Withdrew "dollar amount" to "bank account"
- Sending "amount of Bitcoin" Pending (View on Block Explorer): Blockchain.com, instantly becomes Completed (View on Block Explorer)...

### Withdraw
- (A(arells-circle)) -> Account Page (B(bitcoin-logo)) ->Buy Page
- shows $amount
- Are you sure you'd like to withdraw this to your bank account?
- (PROCEED) -> Transactions Page
- - Modal:
- - - Withdraw Complete (View Transactions)-> Transactions
- - - Withdraw Failed, check Bank Account Connection (View Connected Bank Account) -> Bank Account

### Bank Account
- (A) -> Account Page (B) ->Buy Page
- Plaid info?

## Arells Cryptocurrency Marketplace 1.5

### Home Page (without login)

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


