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


 #### Buy (Page)
 - Connects to Plaid First, (if not connected)

 #### Sell (Page)
 - Connects to Plaid First, (if not connected)
 - displayed once a cVatop + (cVatop * .03) > the cVact, othersie hidden

 #### Holding (replaces Sell button)
 - displayed once a cVatop + (cVatop * .03) < the cVact, othersie hidden

 #### (A)(B) Price = Holding Price
 - Holding Price dependent on highest cVatop

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
- (A) -> Account Page (B) ->Buy Page
- Import & Send your Bitcoin to Address: (Copy) button
- - Modal:
- - - Bitcoin Address Copied (OK)

### Export
- (A) -> Account Page (B) ->Buy Page
- Enter Address to Export & Send your Bitcoin: ...
- Review "How It Works" if Bitcoin Export price is lower than holding price
- (CANCEL) -> Account Page, 
- (SEND) -> Transactions Page
- - Modal:
- - - Bitcoin Successfuly Exported (View Transactions)-> Transactions-
- - - Export Failed (OK)
- Reloads modules every 5 minutes (price, wallet, and losses animation css) from coin gecko API wrapper?

### Buy
- Input (B) amount, fees, bitcoin price, etc.
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
- - Sell (Input Amount To Sell)
- - (Confirm Sale) -> Modals
- - - Modals: 
- - - - Confirming Sale... Amount To Sell - Arells Fees
- - - - Sale Complete (subtracts first from cVact 1, then 2, 3, etc and deletes those cVacts & cVatops from the database)(View Transactions) -> Transactions
- - - - Transaction Failed (OK)
- Reloads modules every 5 minutes (price, wallet, and profits animation css) from coin gecko API wrapper?


### Transactions
- (A) -> Account Page (B) ->Buy Page
- Sold "amount of Bitcoin" for "dollar amount" with "profits"
- Bought "amount of Bitcoin" for "dollar amount"
- Withdrew "dollar amount" to "bank account"
- Sending "amount of Bitcoin" Pending (View on Block Explorer): Blockchain.com, instantly becomes Completed (View on Block Explorer)...

### Withdraw
- (A) -> Account Page (B) ->Buy Page
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


