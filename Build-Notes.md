# Arells Build Notes...

## Arells v1

### Clean Up Cursor storage (monthly):
- find ~/Library/Application\ Support/Cursor/snapshots/roots -mindepth 1 -mtime +2 -delete
- find ~/Library/Application\ Support/Cursor/User/globalStorage -mindepth 1 -mtime +2 -delete


- ok i need you to brainstorm this.... 

in phase one (everywhere) add: Share advertising revenue with supporters & believers.

phase two (everywhere) add: Share infastructure revenue with phase one supporters & believers.

and also like a Multi Level Marketing company... those who get people to sign in/up, get a bigger percentage that they can see...

this means we have to create a new page called "my-portfolio" designed from top to bottom exactly like the my-investments page (even with the ability to see if a user is signed in or not/etc if signed in then it shows, if not then it shows what the "my investments" page shows)

the my portfolio button in "verify email" and the my portfolio button in the assets page links to /my-portfolio 

and the "sign in to learn more" words everywhere change to "sign in to get involved"

and the "verify email" page....

after the we are currently in phase one of our mission:

replace the phase one/two blocks with one block that says:

View porfolio to see how you can financially benefit.

and in the the my-portfolio page:

the title "my porfolio" with no slogan at the top and centered just like the my investments title but in liquid mode (forever) and just like the summary from my investments is wrapped in double borders, wrap this also in double borders:

My Financial Benefits: <(styled same as purchased value from my-investments)
0% <-bold numbers styles same as purchase value numbers from my investments (calculate this number from "my financial benefits" page (will add details about how later)) and below the number, styled the same as the UTC words from metrics: of User Ad Revenue

Add this in another bordered section: 
Sign-up your friends/family to financially benefit from our mission to ensure your investments never lose value by using this link: "share" <button links to https://arells.com (but connects their e-mail to the sharing link so if the person they shared with signs up using that link, it adds them to the user that shared the links MLM)

Add a new bordered section inside the "get your friends and family" underneath the share button that says

About My Financial Benefits:
Your financial benefits will be derived from our advertising revenue once we have 100,000~ Weekly Active Users (WAU).

Estimated weekly User Advertising Advertising revenue from 100,000~ WAU: 
$3,000-$7,000 <- bold letters styled the same as purchased value numbers from my-investments

(learn more) - button links to /my-financial-benefits

and below the my financial benefits bordered section, create another bordered section styled/ double-bordered just like the "My Assets" section and and in place of the "My Assets" title it "Weekly Active Users"
 and inside the double borders, in big bold black numbers same stylings as the summary purchase value numbers from y -investments, list the WAU from metrics

and below that number, list in the same style as purchased value title from my investments page "Users to gain until Financial Benefits activated:" and subtract the WAU from 100,000 and list it in the same stylings as the purchased valye numbers.

and below the "Weekly Active Users" section, add another bordered section styled the same as My Assets bordered section titled "Add Investments" in place of "My Assets" title and inside the bordered section, add a button "view my investments" that links to: /my-investments

and inside the /my-financial-benefits page, styled it the same as the "/my-portfolio" page

the "my portfolio" title will be replaced with "my financial benefits"

and below that a double bordered section and inside it, add these words:

Your Financial Benefits will be derived from the 65% of advertising revenue (User Ad Revenue (UAR)) Arells generates, Arells will keep 35%.

Out of the 65%, you currently will get (add the dollar amount bold styled the same as purchased value numbers from my -investments dependent on how many users they signed up) from weekly User Advertising Revenue 
of $3,000-$7,000 <- (bold letters styled the same as purchased value numbers from my-investments) based on 100,000~ WAU (Weekly Active Users)

This means the more people you sign up and are active, the more advertising revenue you receive.

Below that bordered section, add another double bordered section styled also the same as My Assets section from my-investments

in place of the "My Assets" title with "Leaderboard"
and below it inside the double bordered section a table with 3 columns/rows ordered from most users signed up to least number of user signed up

1st column (list of emails):
User <- title
1. e-mail name (at)..... com (dot out the email link and leave the .com or .ru /etc)
2. repeat
3. repeat

2nd column (list of users signed up per email)
Users Signed-up and Active Weekly < title
- xxxx <- numbers of users signed up and are active based on WAU from metrics
- repeat
- repeat

3rd column (percentage they will get from ad revenue)
% Arells will share from $5k-$10k Weekly Ad Revenue
- xxxx% 
- repeat
- repeat

And in the my-investments page

replace "currently in" and phase one button with "view my portfolio" button  that links to /my-portfolio styled the same as the "view more assets" buttom from /index 

- *(about buton accent color flicker and toggle accent color issues [take pic for reference to fix])*
-*update indexing after main submission, check google after a week*

## 3-4 weeks after launch
- - Call CoingeckoAPI (research how it calls it, maybe to update the VAPA info?) every 5 seconds, not on page mount...
- Continue resolving Metrics Page UI
- Prepare for WACA transition (LTP folder)

## 2 months and beyond (adjust below if needed based on traction):
- 50-100 users, check retention/WAU
- Wait at least 2 months to adjust LTP (contact us for larger Re') based on feedback...
- - If traction is good look at LTP folder post WACA
- - increase CG API limit? (track)
- - Compare Retention rate (in bear markets WoM only (percentages)) : Projections (with current trajectory) with/without (WoW percentage comparisons)
- Figure out way to save .JSON info into another very secure section (possibly offline for added security)

### 3 months and beyond
- Add legal disclaimer at the bottom of each asset, and add Terms of Service "sign up" (by signing up you agree to our terms of service)
- check (sign in with google) https://console.cloud.google.com/auth/scopes?authuser=2&chat=true&project=arells-492319&supportedpurview=project 
- - info@arells.com
- - sign in with google (xx is already an email etc etc, link?, can they sign in normally using gmail/email through normal sign in process? investigate)
- Check CSC (TAX)
- Fix
- - Eth card under 400 px (or so, margin bottom changes?)
- - Sometimes when i click the toggle, and i hover out and then release the hold (on desktop), the clicker sometimes thinks I still havenn't releaded the hold so when i hover over the toggle it still thinks I'm clicked... its not only after i click agian does the toggle clicker release
- - long marketcap numbers
- - summary section (double check this issue on web/mobile before implementing, might have been resolved?) my-investments+asset pages date-buttons/toggle always triggers resizing of purchased/current value sections regardless of the size of the numbers , while the date-buttons/toggle in asset pages don’t… investigate....
- - favicons on mobile (TTL?) remove all fall back icons?
- - Research to see if can delete ArellsImages from s3
- (Sort)MarketCap/etc sorting (default by Marketcap always)
- Start process of building Featured/Sponsored section (with metrics, CTR, etc)... do not launch until at least 200k MAU

### iOS & Android App (after 1-2 years?)
- iOS App (night/dark mode automatic (website) setting that reads your settings)
- - Tagline: If investments never lost value
- - Desc: This is how your investments would look If investments never lost value.
- - submission: An accounting ledger that shows how investments would look If investments never lost value. 