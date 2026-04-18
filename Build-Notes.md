# Arells Build Notes...

## Arells v1

### Clean Up Cursor storage (monthly):
- find ~/Library/Application\ Support/Cursor/snapshots/roots -mindepth 1 -mtime +2 -delete
- find ~/Library/Application\ Support/Cursor/User/globalStorage -mindepth 1 -mtime +2 -delete


## Final Test


### Account


#### (link test)
- Test with DMs and private public links on twitter/discord/text-message*
- Look at metrics again...


### Launch
- Review notes on phone and launch

### Day After Launch:
- check (sign in with google) https://console.cloud.google.com/auth/scopes?authuser=2&chat=true&project=arells-492319&supportedpurview=project 
- - info@arells.com
- - sign in with google (xx is already an email etc etc, link?, can they sign in normally using gmail/email through normal sign in process? investigate)
- Prepare to launch new assets (components/api-pointers/css-styles (match similar colors (make sure you're 1-2 points out of the hex, not exact colors)))basically and duplicate and change asset names and colors...
- Continue resolving Metrics Page UI
- Contact CSC (TAX)

## 2 days after launch
- Start tracking after 2 days (numbers)
- After Week 1, if things look good, X-personal
- - Call CoingeckoAPI (research how it calls it, maybe to update the VAPA info?) every 5 seconds, not on page mount...
- Prepare for WACA transition (LTP folder)

## 1 month and beyond:
- Fix
- - Sometimes when i click the toggle, and i hover out and then release the hold (on desktop), the clicker sometimes thinks I still havenn't releaded the hold so when i hover over the toggle it still thinks I'm clicked... its not only after i click agian does the toggle clicker release
- - long marketcap numbers
- - summary section (double check this issue on web/mobile before implementing, might have been resolved?) my-investments+asset pages date-buttons/toggle always triggers resizing of purchased/current value sections regardless of the size of the numbers , while the date-buttons/toggle in asset pages don’t… investigate....
- - favicons on mobile (TTL?) remove all fall back icons?
- - Research to see if can delete ArellsImages from s3
- (Sort)MarketCap/etc sorting (default by Marketcap always)
- Wait at least 2 months to adjust LTP (contact us for larger Re') based on feedback...
- - If traction is good look at LTP folder post WACA
- - increase CG API limit? (track)
- - Compare Retention rate (in bear markets WoM only (percentages)) : Projections (with current trajectory) with/without (WoW percentage comparisons)
- Figure out way to save .JSON info into another very secure section (possibly offline for added security)

### 3 months and beyond
- Add legal disclaimer at the bottom of each asset, and add Terms of Service "sign up" (by signing up you agree to our terms of service)
- Start process of building Featured/Sponsored section (with metrics, CTR, etc)... do not launch until at least 200k MAU

### iOS & Android App (after 1-2 years?)
- iOS App (night/dark mode automatic (website) setting that reads your settings)
- - Tagline: If investments never lost value
- - Desc: This is how your investments would look If investments never lost value.
- - submission: An accounting ledger that shows how investments would look If investments never lost value. 