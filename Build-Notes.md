# Arells Build Notes...

## Arells v1

### Clean Up Cursor storage (monthly):
- find ~/Library/Application\ Support/Cursor/snapshots/roots -mindepth 1 -mtime +2 -delete
- find ~/Library/Application\ Support/Cursor/User/globalStorage -mindepth 1 -mtime +2 -delete

### enviroments
- Add to Amplify

### Test Online 
- *Clean up Mobile UI*
- both desktop(multiple browsers)/mobile sessions(page mount, 1 minute delete, my investments page (delete sessions to try again and again)) and email
- Test (with all links /, /bitcoin, /ethereum, /about, /vavity) on socials (DM's/etc)
- Test with j4747477@outlook.com emal
- look at Metrics

## After Test
- Save VavityCodeBase (with everything that has "Vavity" from Arells) architecture Offline (for testing) and online version (for deployment) and entire vavity API (vapa-mechanism and aggregator), chart (bull/sloth), aggregator... Then update Vavity Git and vavity.info(change this or alter it)
Vavity Architecture:
Separate Vavity architecture Offline (for testing) and prepare online version (for deployment)

## Final Test
- Remove typos from Arells/Vavity readmes, and UI
- Remove console.logs (leave conosle.errors/warns) from all files...
- Delete Arells Readme roadmap
- *Deploy to main and Test Entire structure with DMs and private public links on twitter/etc*
- - In metrics:  
- - Users
- - - (current) number of sessions (unique users?) created/interacted/etc
- - - Growth chart
- - - MAU Chart
- - - Retention chart
- - Google Search Console: submit https://arells.com/sitemap.xml, then use URL inspection on /, /signin, /signup after deploy.

#### Update Links/Images/Descriptions
- Email/X-Twitter/LinkedIn+crunchbase+CSC(company-type: Financial Technology (remove blockchain services or anything blockchain))/: If investments never lost value

### Launch
- Review notes on phone and launch

### Day After Launch:
- check (sign in with google) https://console.cloud.google.com/auth/scopes?authuser=2&chat=true&project=arells-492319&supportedpurview=project 
- - info@arells.com
- Prepare to launch new assets (components/api-pointers/css-styles (match similar colors (make sure you're 1-2 points out of the hex, not exact colors)))basically and duplicate and change asset names and colors...
- Contine resolving Metrics Page UI
- Contact CSC (TAX)

## 2 days after launch
- Start tracking after 2 days (numbers)
- After Week 1, if things look good, X-prsnl
- - Call CoingeckoAPI (research how it calls it, maybe to update the VAPA info?) every 5 seconds, not on page mount...
- Prepare for WACA transition (LTP folder)

## 1 mnth and beyond:
- Fix long marketcap numbers and summary section (on first page min asset pages sometimes not saving the number info on state so it can height up after investment deletions, which causes a pop-up, in my investments page it sometimes doesn't smoothly fade in and out numbers like in asset pages after button clicks..)....
- (Sort)MarketCap/etc sorting (default by Marketcap always)
- Wait at least 2 months to adjust LTP based on feedback...
- - If traction is good look at LTP folder post WACA
- - increase CG API limit? (track)
- - Compare Retention rate (in bear markets WoM only (percentages)) : Projections (with current trajectory) with/without (WoW percentage comparisons)
- Figure out way to save .JSON info into another very secure section (possibly offline for added security)

### 3 mnths and beyond
- Add legal disclaimer at the bottom of each asset, and add Terms of Service "sign up" (by signing up you a agree to our terms of service)
- Start process of building Featured/Sponsored section (with metrics, CTR, etc)... do not launch until at least 200k MAU

### iOS & Android App (after 1-2 years?)
- iOS App (night/dark mode automatic (website) setting that reads your settings)
- - Tagline: If investments never lost value
- - Desc: This is how your investments would look If investments never lost value.
- - submission: An accounting ledger that shows how investments would look If investments never lost value. 