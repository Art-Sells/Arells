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
- (Continue) -> Modal
- - Modal:
- - Account Created (OK)-> Account Page

### (A)(B)Wallet Created
- **Backend** 
- - If Email is already connected to a Bitcoin Wallet and/or if not signedup/signedin, this page automatically takes you to the account page or homepage**
- - Store Address within Account Email Database & Do Not Reveal Address here 
- - (YES) button from Modal saves Bitcoin Addres to Account Email
- **Frontend**
- Private Key (copy/save your private key offline, you will need it to export and send your bitcoin, [do not lose it])
- For security reasons, we do not save your private key online so before you hit continue, copy/save this private key offline.
- (Continue)-> Modal
- Modal
- - Have you copied and saved your private key? Without it, you will be unable to export and send your Bitcoin(YES)-> Ready Modal, (NO)->Close
- Ready Modal
- - Your account is now ready to buy, sell, import and export Bitcoin  (OK)-> Account Page

### Home(redirects to Account if logged in)
- Refer to (How It Works)

 #### Import (Page)
 - - Modal: Create (A)(B) Wallet
 - - - You need a wallet to Import/Receive Bitcoin (Create)-> (A)(B) Wallet Created Page
 - - Modal
 - - - Copy Address Button 
 - - - Import & Receive Your Bitcoin to Address: Address pulled from Database

 #### Buy (Page)
 - **Possibly A Wrapper including the modal** Connects to Plaid First, (if not connected), then Modal: Create Bitcoin Address if no Bitcoin Address is connected to Email.
 - - Modal: Create (A)(B) Wallet
 - - - You need a wallet to Buy & Sell Bitcoin (Create)-> (A)(B) Wallet Created Page

 #### Sell (Page)
 - **Possibly A Wrapper including the modal** Connects to Plaid First, (if not connected), then Modal: Create Bitcoin Address if no Bitcoin Address is connected to Email.
 - - Modal: Create (A)(B) Wallet
 - - - You need a wallet to Buy & Sell Bitcoin (Create)-> (A)(B) Wallet Created Page

 #### Export (Page)
 - "Create Bitcoin Wallet Page" if no Bitcoin Address is connected to Email. If Bitcoin wallet created: Export page.

 #### Holding
 - Refer to notes

 #### Profits
 - **only based on the amount imported/purchased at**

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
- - Transaction Failed (OK)

### Sell
- Explains amount (A)(B) to sell, profits, fees, etc
- **can only sell all the amount imported/purchased if profitable**
- (Confirm Sale) -> Modals
- Modals: 
- - Confirming Sale
- - Sale Complete (View Account)-> Account 
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
