# Arells Build Notes...

## Arells Cryptocurrency Marketplace MVP

Test Address: bc1qhxg00ztzgplpaj2774g73ct9padcyczhn8f5g6

Test Address 2: bc1qltdmeghfnxhaqr63q76lq5nldwzl3lamd2vjtj

### Home Page
- Purchase CoinGecko API

### Log In
- Email
- Password
- No Account? Sign Up
- - (automatically connects to your prior wallet created during buy/import wallet creation initiation)

### Sign Up
- Email
- Password
- Password Confirmation
- (Continue) -> Account Page

### Bitcoin Wallet Created
- **Backend - If Email is already connected to a Bitcoin Wallet and/or if not signedup/signedin, this page automatically takes you to the account page or homepage**
- "You're gonna need this wallet to buy, sell, import and export your Bitcoin"
- Address
- Private Key (copy this private key and save it offline [and do not lose it], you will need it to export and send your bitcoin, if you lose your private key, you will be unable to export and send your Bitcoin)
- Click continue only after you've copied and saved your private key 
- (Continue)-> Modal
- Modal
- - Have you copied and saved your private key? (YES)-> Ready Modal, (NO)->Close
- Ready Modal
- - Your account is now ready to buy, sell, import and export Bitcoin  (OK)-> Account Page

### Home(redirects to Account if logged in)
- Refer to (How It Works)

 #### Import
 - "Create Bitcoin Wallet Page" if no Bitcoin Address is connected to Email. If Bitcoin address connected: Modal.
 - - Modal
 - - - Copy Address Button
 - - - Import & Receive Your Bitcoin to Address:

 #### Buy
 - Connects to Plaid First, (if not connected) then takes you to "Create Bitcoin Wallet Page" if no Bitcoin Address is connected to Email.

 #### Sell
 - Connects to Plaid First, (if not connected) then takes you to "Create Bitcoin Wallet Page" if no Bitcoin Address is connected to Email.
 - **can only sell all the amount imported/purchased if profitable**

 #### Export
 - "Create Bitcoin Wallet Page" if no Bitcoin Address is connected to Email. If Bitcoin wallet created: Export page.

 #### Holding
 - Refer to notes

 #### Profits
 - **only based on the amount imported/purchased at**

 #### Amount Sold
 - shows $amount
 - (Withdraw)

 #### Log Out (Redirects to Home)

### Import
- (A) -> Account Page (B) ->Buy Page
- Import & Receive Bitcoin to Address: ...

### Buy
- Input amount, fees, bitcoin price, etc.
- (BUY) -> Modals
- Modals: 
- - Confirming Purchase
- - Purchase Complete (View Portfolio)-> Account, 
- - Transaction Failed (OK)

### Sell
- Explains amount to sell, profits, fees, etc
- **can only sell all the amount imported/purchased if profitable**
- (Confirm Sale) -> Modals
- Modals: 
- - Confirming Sale
- - Sale Complete (View Portfolio)-> Account 
- - Transaction Failed (OK)

### Export
- (A) -> Account Page (B) ->Buy Page
- Input Privat Key
- Send Bitcoin to Address: ...
- Review "How It Works" if Bitcoin Export price is lower than holding price
- (CANCEL) -> Account Page, 
- (SEND) -> Transactions Page

### Transactions
- (A) -> Account Page (B) ->Buy Page
- Sold "amount of Bitcoin" for "dollar amount"
- Bought "amount of Bitcoin" for "dollar amount"
- Withdrew "amount of Bitcoin" to "bank account"
- Sending "amount of Bitcoin" Pending (View on Block Explorer): Blockchain.com, instantly becomes Completed (View on Block Explorer)...

### Withdraw
- (A) -> Account Page (B) ->Buy Page
- shows $amount
- Are you sure you'd like to withdraw this to your bank account?
- (PROCEED) -> Transactions Page

## Arells Cryptocurrency Marketplace 1.5

### Home Page (without login)
10 years, 5 years, 1 year, 6 months, 90 days, 30 days, 7 days, 24 hours, 6 hours, 1 hours (load whichever time frame from 24 hours first, to 7 days, prioritize days then months then years in regards to the highest percentage increase).

### Log In
- Forgot Password 
