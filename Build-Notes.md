# Arells Build Notes...

## Arells v1

### Optimize-UI/UX for mobile
- Test everything........... (including inspect)
- Make the section in assets holding all the sections maximum height dynamic and the sections inside them width 100% so they resize smoothly without major changes to the UI
- - After Asset UI, test Toggle Animation and Resetting Investments with Inspect right scrolls...
- - Check "view my portfolio slide up" when calendar open on multiple landscape/portrait modes, the dollar sign in the my assets page... My investments page If no Email, If email is read and no investments exist inside the email json, If Investments exist inside email json
- Remove "sign in" dynamic and "1 minute timer "to test in mobile...


### Sign In/Up
- Title: Sign In to Save Investments
- Integrate sign-in/up with google....
- Creates json with the email inside /users inside arells/users/ that functions exactly like the session vavity, except it never deletes any unless specifically asked for by the user...
- *remove the flag that stops the 1 minute and on page mount delete flags for sessions in all pages ...*

### Metatags/ Description (all pages.tsx (vavity inluded) (dont forget my investments page) & components)
- Add unique favicons (and add to online tests)
- Alter: Descriptions & BannerImages (make images for promotions top asset icon, with bordered section like the asset page below it wrapping: If investments never lost value (bold)), add same color scheme on top behind logos.
- - If investments never lost value (Bitcoin/Ethereum - If investments never lost value)
- Refactor (optimize with Cursor) Meta-tags {show AI and ask it why it displays home page ps and not meta tags}?
- - (with vavity.info) Submit to Google Search Console: Submit your sitemap and request indexing
- - Create a sitemap.xml: Helps Google discover all pages
- - Add a robots.txt: Allows crawlers to access your site
- - Build backlinks: Share your site to get it indexed faster

### Analytics
- G4 analytics to test for humans/bots
- - UniqueUsers/SessionDurations (more than 5 seconds = human)
- - Scrolls/button-clicks(which-assets)/asset-events = human
- In notion:
- - Users
- - - (current) session creations (browswer/unique IP addresses), retention graph....
- - - chart
- - save/update .json info every second to ext Dsk (then every day save/update cold)

### Test Online 
- both desktop(multiple browsers)/mobile
- Test (with all links /, /bitcoin, /ethereum, /about, /vavity) on socials (DM's/etc)
- look at Analytics

## After Test
- Save VavityCodeBase (with everything that has "Vavity" from Arells) architecture Offline (for testing) and online version (for deployment) and entire vavity API (vapa-mechanism and aggregator), chart (bull/sloth), aggregator... Then update Vavity Git and vavity.info(change this or alter it)
Vavity Architecture:
Separate Vavity architecture Offline (for testing) and prepare online version (for deployment)

## Final Test
- Remove typos from Arells/Vavity readmes, and UI
- - In notion:  
- - Users
- - - (current) number of sessions (unique users?) created/interacted/etc
- - - Growth chart
- - - MAU Chart
- - - Retention chart

#### Update Links
- Email/X-Twitter/LinkedIn+crunchbase+CSC(company-type: Financial Technology (remove blockchain services or anything blockchain))/: If investments never lost value

### After Launch
- - Review notes on phone

### Day After Launch:
- Cancel Infura/Metamask
- Delete Arells Readme roadmap
Users
- Flip sloth pngs horizontally
- Remove console.logs from all files...
- Resolve Google/Bing/Yahoo Search Tab issues (Bing Webmaster Tools) (Add Unique Metatags to all recurring pages), look into favicon blurriness issue
- Prepare to launch new assets (components/api-pointers/css-styles)basically and duplicate and change asset names and colors...
- Contact CSC (TAX)

## 2 days after launch
- Start tracking after 2 days (numbers)
- After Week 1, if things look good, X-prsnl
- - Call CoingeckoAPI (research how it calls it, maybe to update the VAPA info?) every 5 seconds, not on page mount...
- Prepare for WACA transition (LTP folder)

## 1 mnth and beyond:
- Fix long marketcap numbers and jitter issues at the end of summary height down....
- (Sort)MarketCap/Volume/etc sorting (default by Marketcap always)
- Wait at least 2 months to adjust LTP based on feedback...
- - If traction is good look at LTP folder post WACA
- - increase CG API limit? (track)
- - Compare Retention rate (in bear markets WoM only (percentages)) : Projections (with current trajectory) with/without (WoW percentage comparisons)
- Figure out way to save .JSON info into another very secure section (possibly offline for added security)

### 3 mnths and beyond
- Start process of building Featured/Sponsored section (with analytics, CTR, etc)... do not launch until at least 200k MAU

### iOS & Android App (after 1-2 years?)
- iOS App (night/dark mode automatic (website) setting that reads your settings)
- - Tagline: If investments never lost value
- - Desc: This is how your investments would look If investments never lost value.
- - submission: An accounting ledger that shows how investments would look If investments never lost value. 