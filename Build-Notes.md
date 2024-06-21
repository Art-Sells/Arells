# Arells Build Notes...

## Arells Cryptocurrency Marketplace MVP

Test Address: bc1qhxg00ztzgplpaj2774g73ct9padcyczhn8f5g6

Test Address 2: bc1qltdmeghfnxhaqr63q76lq5nldwzl3lamd2vjtj

### Home Page
- Purchase CoinGecko API
- If Log In = true, go to /Account

### Log In
- **Possibly a connect wallet wrapper** that automatically connects to your prior wallet with Address and Private Key pulled from backend.

### Sign Up
- Modal:
- - Account Created (View Account)-> Creates Bitcoin Wallet **Backend: saves Address to Email and encrypts private key and saves it on backend** then takes you to Homepage with wallet connected **connect wallet wrapper initiated**

### Home(redirects to Account if logged in)
- if holding, sell display none, holding display true.

 #### (B) Price

 #### Import (Modal)
 - - Modal
 - - - Copy Address Button 
 - - - Import & Receive Your Bitcoin to Address: Address pulled from Database

 #### Buy (Page)
 - **Possibly a plaid connect wrapper including the modal** Connects to Plaid First, (if not connected)

 #### Sell (Page)
 - **Possibly a plaid connect rapper including the modal** Connects to Plaid First, (if not connected)

  #### Holding (replaces Sell button)
 - The holding is initiated only once a corresponding Vatop + (Vatop * 3%) <> the corresponding Vact
 - Vatop = Value At Time of Purchase
 - - Example:
 - - - $500 worth of Bitcoin at $60,000 is purchased: Vatop #1 = $500
 - - - $600 worth of Bitcoin at $54,000 is purchased: Vatop #2 = $600
 - Vact = Value At Current Time
 - - Example:
 - - - $500 worth of Bitcoin at $60,000 falls to $450 as Bitcoin falls to $54,000: Vact #1 = $450
 - - - $600 worth of Bitcoin at $54,000 rises to $611 as Bitcoin rises to $55,000: Vact #2 = $611

 #### (A)(B) Price
 - Only displays Highest Token Purchased Price (HTPP) if (B) price decreases.

  #### (A)(B) Value
 - Combines and displays all Vatops.

 #### Export (Page)

 #### Profits
 - Vact - Vatop = Profits (Only displays if positive)

 #### Amount Sold
 - shows $amount
 - (Withdraw)-> Withdraw Page

 #### Log Out (Redirects to Home)

### Import
- (A) -> Account Page (B) ->Buy Page
- Import & Receive Bitcoin to Address: Address pulled from Database

### Buy
- Input (B) amount, fees, bitcoin price, etc.
- (BUY) -> Modals
- Modals: 
- - Confirming Purchase
- - Purchase Complete (View Portfolio)-> Account, 
- - Purchase Failed, check Bank Account for sufficient funds (View Connected Bank Account) -> Bank Account

### Sell
- "Amount Holding" displays and combines the Vatops + (Vatops * 3%) if the Vatops + (Vatops * 3%) < Vacts, otherwise it is hidden.
- "Amount Available To Sell" displays and combines the Vatops + (Vatops * 3%) if the Vatops + (Vatops * 3%) > Vacts, otherwise everything below is hidden.
- - Profits: Vact - Vatop = Profits (Only displays if positive)
- - Sell (Input Amount To Sell)
- - (Confirm Sale) -> Modals
- - - Modals: 
- - - - Confirming Sale... Amount To Sell - Arells Fees
- - - - Sale Complete (View Transactions)-> Transactions
- - - - Transaction Failed (OK)

### Export
- (A) -> Account Page (B) ->Buy Page
- Send Bitcoin to Address: ...
- Review "How It Works" if Bitcoin Export price is lower than holding price
- (CANCEL) -> Account Page, 
- (SEND) -> Transactions Page
- - Modal:
- - - Bitcoin Successfuly Exported (View Transactions)-> Transactions-
- - - Export Failed (OK)

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
10 years, 5 years, 1 year, 6 months, 90 days, 30 days, 7 days, 24 hours, 6 hours, 1 hours (load whichever time frame from 24 hours first, to 7 days, prioritize days then months then years in regards to the highest percentage increase).

### Log In
- Forgot Password 

### Add 2FA for Buying/Selling and first Logging In.
