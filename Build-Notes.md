# Arells Build Notes...

## Arells v1


- *Complete show investments/ delete (why after the delete section heights up after the delete button is clicked for a section and is deleing, does it height down the investent list secton again? is it because it's not yet deleted from the back end?) investments UI... Put delete 1 minute timer back after UI completion*
- *test multiple investment deletions big numbers and small... (with page mount clearing refresh page sessions) with the "1 minute end all open to see aht it does" with the form open and not open*
- *Clean up spacing on buttons insinde view investment when forms are open/etc*

- Investment page should be styled (shadows/etc) the exact same as the home page

### Investment list (fix when heighting down, it jigs a little at the end (I don't experience this issue with the forms height downs))
- - (delete) *test this*
- - (Load More 5 per list) *test this*

### My investment numbers have thick borders and no background and circle has two black lines.

## Create a /My-Investments page (UI/UX height downs/ups/etc just like asset pages except without borders and the wrappers have the same shadow as the main wrapper from the home page and words/titles same colors as the home page (excluding the asset colors)) that has:

If no email is read1 
- (Sign In)

If email is read and no investments exist inside the email json:
- (Arells icon) <- button that takes to home page same size and dynamics/etc as the asset page icon buttons
*Main Wrapper:*
- My Investments <-title same placing/styling/etc as the "asset titles" 
- if they never lost value <- Slogan same placing/styling/etc as the asset slogans
*Add Investments Wrapper (main child wrapper):*
- Add Investments <- title same sizing styling as the "Investments" title inside asset pages except same color as the "My Investments" title....
*Add Investments Child Wrapper:*
- - (BTCicon)  (ETHicon) all Icons of assets that exist styled exactly like the "voting" buttons so each asset has its own unique color and styling that link to asset pages.

If Investments exist inside email json, replace Add Investments Wrapper with:
*Investments Wrapper (main child wrapper):*
- [total of all investments from all assets "acVatops","acVacts", etc with ] <- should be styled exactly like the "Purchased Amount, Current Amount, profits, etc" sections below the asset pages
- "Toggle liquid solid"
- [ Edit Invesmtments ]<- button that changes to [Hide Edit Investments]  acts the same way as the "show investments" button that populates a list of ALL investments invesmtents [aggregate of all the assets] 5 per row.... list that heights/scrolls down... the same as the assets pages except this time have it height up all the sections/wrappers below it.... and when hide edit investments is clicked, it heights down the sections back to their places...
- - Each Investment list is ordered the same as the assets show invesmtnets list but this time, the section that holds their information the texts/number color/styling and section that wraps them is color coded to match the asset that holds it... And also add a tiny asset icon on the top center of their corresponding sections. dont forget about the "load 5 more" button that also heights down and scrolls odown also... 
*Add Investments Wrapper (Investments Child Wrapper): only show if there's an asset/investment not shown from email json, otherwise hide*
- - Add Investments <- title same sizing styling as the "Investments" title inside asset pages except same color as the "My Investments" title....
*Add Investments Child Wrapper:*
- - - (BTCicon) or (ETHicon) or both <- only shows button if there's an asset that exists that does not exist inside email json, otherwise, dont show button and add to:
*Add More Investments Wrapper (investments CHild Wrapper below Add Investments Wrapper)*
- - - (BTCicon)(ETHicon) (should start center for one if only one asset icon button is shown and expand...) that link to asset pages... should only show based on jsons if investments were added from their assets, otherwise, 


### About:


    Arells Icon at the top center overlapping a section with the same shadow as the homepage that wrapps the asset cards that wraps this:

    Arells is a belief that investments should never lose value.
    ______________________

    This belief is powered by a ledger that shows how your investments would look if they never lost value.

    ______________________

    This ledger is powered by a new psychological and technological invention called Vavity.

    Learn more > (Vavity (V)) <links to /vavity

    All the words above (with the exception of the button) are 20 px, 800 font weight and centered.

### Vavity (take everything from vavity.info)
- Change desc to: Remove "Investment losses are a human psychology issue" just tell WHAT Vavity is... that's it - don't lecture (replace bear markets with investment losses in vavity info and readme) so Vavity solves this psychologically through technical autonomy. By eliminating investment losses etc etc (in github also..., remove "cryptocurrency" from it and make it simply (remove Bitcoin and make it general))

### Optimize-UI/UX for mobile
- Test everything........... (including inspect)
- Remove "sign in" dynamic and "1 minute timer "to test in mobile...
- - Check "view my portfolio slide up" when calendar open on multiple landscape/portrait modes...

### Sign In/Up
- Title: Sign In to Save Investments
- Integrate sign-in/up with google....
- Creates json with the email inside /users inside arells/users/ that functions exactly like the session vavity, except it never deletes any unless specifically asked for by the user...

### Metatags/ Description (all pages.tsx (dont forget my investments page) & components)
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
- Set voting blocks to 3 minutes
-  both desktop(multiple browsers)/mobile
- Test (with all links /, /bitcoin, /ethereum, /about, /vavity) on socials (DM's/etc)
- look at Analytics


## After Test
- Save VavityCodeBase (with everything that has "Vavity" from Arells) architecture Offline (for testing) and online version (for deployment) and entire vavity API (vapa-mechanism and aggregator), chart (bull/sloth), aggregator... Then update Vavity Git and vavity.info(change this or alter it)
Vavity Architecture:
Separate Vavity architecture Offline (for testing) and prepare online version (for deployment)

## Final Test
- Set voting blocks to 7 days
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
- - Look at notes for openings. 

### Day After Launch:
- Cancel Infura/Metamask
- Delete Arells Readme roadmap
Users
- Flip sloth pngs horizontally
- Remove console.logs from all files...
- Resolve Google/Bing/Yahoo Search Tab issues (Bing Webmaster Tools) (Add Unique Metatags to all recurring pages), look into favicon blurriness issue
- Prepare to launch new Voting Blocks and Winning asset (banner, shadow opacities should always match (check) etc)
- Contact CSC (TAX)

## 2 days after launch
- Start tracking after 2 days (numbers)
- After Week 1, if things look good, X-prsnl
- - Call CoingeckoAPI (research how it calls it, maybe to update the VAPA info?) every 5 seconds, not on page mount...

## 1 mnth and beyond:
- Fix long marketcap numbers/etc...
- Asset/Prices/etc sorting (default by Marketcap always)
- Wait at least 2 months to adjust plan based on feedback...
- If traction is good look at Business Plan folder
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