# Arells Build Notes...

## Arells v1

### Clean Up Cursor storage (monthly):
- find ~/Library/Application\ Support/Cursor/snapshots/roots -mindepth 1 -mtime +2 -delete
- find ~/Library/Application\ Support/Cursor/User/globalStorage -mindepth 1 -mtime +2 -delete


### Sign In/Up
- ✅ Domain verified (arells.com)
⏳ Request SES production access (do this now)
⏳ Set up environment variables in your local and Amplify environments
⏳ Test email sending once production access is approved:
⏳ Configure IAM permissions for SES (SendEmail, SendRawEmail)
// This works immediately - no email setup required
await ses.sendEmail({
  Source: 'noreply@arells.com',  // SES allows this!
  Destination: { ToAddresses: ['user@example.com'] },
  Message: {
    Subject: { Data: 'Welcome!' },
    Body: { Text: { Data: 'Thanks for signing up...' } }
  }
}); 
- *Can possibly create custom html?*



Then do the below:
Here is a concrete map of the repo and a split of what I can implement vs what you must set up, aligned with how your app is built today.

What the codebase already gives us
About “card” width: The main bordered block is about-card at 350px with shadow-border-wrap and nested myinv-accent-border sections (AboutPageClient.tsx + Home.css).
My Investments look: myinv-page myinv-page--accent, --page-accent-tint, rotating --myinv-accent-color, shadow-border-wrap / myinv-shell, and the guest loader is asset-loader-overlay myinv-loader-overlay with the toggle clone (MyInvestmentsPageClient.tsx).
Portfolio data: Still users/{encodeURIComponent(email)}/VavityAggregate.json via existing user APIs. Today any client can send any email; real email/password auth only makes sense if we tie those APIs to a logged-in session (same idea as we discussed for Google).
Routes you asked for
Route	Role
/signin	Email + password; errors; success → /my-investments; link to /signup
/signup	Email + password + verify password; errors; then loader → “Verification email sent…”
/verified/...	After user clicks link in email → “Email Verified” + View Portfolio → /my-investments
Note on verified/{email}: A raw address in the path is awkward (@, +, length). A robust approach is /verified/[token] (opaque token in email) while the page copy still matches your spec (“Email Verified”). If you insist on the email visible in the URL, we can use /verified/[encodedEmail] with encodeURIComponent so routing works. The link in the email will use whatever origin the request came from (localhost:3000, https://arells.com, https://test.d1gnzirfh2jgi9.amplifyapp.com, etc.) via Host / Origin on the server when the signup API runs.

What I can do in this repo (files to add/change)
New app routes (App Router)

src/app/signin/page.tsx (+ metadata)
src/app/signup/page.tsx (+ metadata)
src/app/verified/[token]/page.tsx (or [email] if you lock that in)
New client components (to mirror About + My Investments behavior)

e.g. src/components/Auth/SignInPageClient.tsx
e.g. src/components/Auth/SignUpPageClient.tsx
e.g. src/components/Auth/VerifiedPageClient.tsx
Shared shell: same patterns as About/My Inv — documentElement / body --app-bg, myinv-page, optional initial loader, about-card width 350px + shadow-border-wrap + myinv-accent-border for the “double border” form block; inputs styled like your asset/my-inv inputs using var(--myinv-accent-color) / tints so they track the accent.
CSS

src/app/css/Home.css (or a small Auth.css imported from these pages only): form layout, error states tinted by accent (separate classes for error vs success), signup success panel, verified page inner card.
API routes (src/pages/api/...)

auth/register — validate email format, password match, email not already registered; hash password (bcrypt); write a small user auth record to S3 (e.g. users/{encodedEmail}/Auth.json with passwordHash, verified: false, verificationToken + expiry) without touching VavityAggregate.json; trigger verification email.
auth/verify — GET or POST with token from link; set verified: true; optional one-time token invalidation.
auth/login — if unverified, return a clear error; if bad password / unknown user, return errors your UI maps to “email doesn’t exist” vs “password doesn’t match” (see security note below).
auth/logout — clear session cookie.
auth/session (optional) — tell the client if someone is logged in.
Session

After successful login: httpOnly, Secure, SameSite cookie (e.g. signed JWT or encrypted session id) storing normalized email; stop trusting localStorage as the source of truth for identity.
UserContext.tsx

Remove the sign-in modal and openSignIn / signInOpen / draft email flow (or reduce to “redirect to /signin” only if anything still references it).
Hydrate email / isSignedIn from /api/auth/session (or from cookie-backed endpoint) instead of only localStorage.
MyInvestmentsPageClient.tsx, VavityBitcoin.tsx, VavityEthereum.tsx

Replace onClick={openSignIn} with <Link href="/signin"> (or router.push('/signin')) for both Sign In to Save Investments and My Investments sign-in.
User portfolio APIs (fetchUserVavityAggregator, saveUserVavityAggregator, addUserVavityAggregator)

Require a valid session and force session.email === requested email (or ignore body email and use session only). Otherwise password auth is pointless.
Dependencies

e.g. bcrypt (or bcryptjs), jsonwebtoken or jose, and an email SDK (@aws-sdk/client-ses or whatever you choose).
Email HTML

Template with Arells logo (hosted absolute URL to your site or CDN), title “Arells Verification”, body “Click this link to verify your e-mail”, link built as
{origin}/verified/{token} (or encoded email if you require that).
Security / UX detail (so you’re not surprised)
Saying “email doesn’t exist” vs “wrong password” helps attackers enumerate accounts. Many products use one message: “Invalid email or password.” You asked for distinct messages; I can implement exactly what you specified, with a short comment that it’s weaker on privacy.




- Creates json with the email inside /users inside arells/users/ that functions exactly like the session vavity, except it never deletes any unless specifically asked for by the user...
- Test asset pages add investment/sign in to save investent section loader
- - if signed in.... the sign in to save investments button should dissapear in my assets and the view my portfolio and view my investments in home should shoq... see how it looks

### Metatags/ Description (all pages.tsx (signin/signup/vavity inluded) (dont forget my investments page) & components)
- Alter: Descriptions & BannerImages (make images for promotions with bordered section like the asset page below it wrapping: If investments never lost value (bold)), add same color scheme on top behind logos.
- - If investments never lost value (Bitcoin/Ethereum - If investments never lost value)
- Refactor (optimize with Cursor) Meta-tags {show AI and ask it why it displays home page ps and not meta tags}?
- - (with vavity.info) Submit to Google Search Console: Submit your sitemap and request indexing
- - Create a sitemap.xml: Helps Google discover all pages
- - Add a robots.txt: Allows crawlers to access your site
- - Build backlinks: Share your site to get it indexed faster

### enviroments
- Add to Amplify

### Analytics
- Build own analytics page to test for humans/bots that gets session/user-email from arellsusers/users or arellsusers/sessions
- - (current) session creations (browswer/unique IP addresses), retention graph....
- - UniqueUsers/SessionDurations (more than 5 seconds = human)
- - Scrolls/button-clicks(which-assets)/asset-events = human
- - save/update .json info every second to ext Dsk (then every day save/update cold)

### Test Online 
- both desktop(multiple browsers)/mobile sessions(page mount, 1 minute delete, my investments page (delete sessions to try again and again)) and email
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
- Delete Arells Readme roadmap
Users
- Remove console.logs from all files...
- Resolve Google/Bing/Yahoo Search Tab issues (Bing Webmaster Tools) (Add Unique Metatags to all recurring pages), look into favicon blurriness issue
- check (sign in with google) https://console.cloud.google.com/auth/scopes?authuser=2&chat=true&project=arells-492319&supportedpurview=project 
- - info@arells.com
- Prepare to launch new assets (components/api-pointers/css-styles (match similar colors (make sure you're 1-2 points out of the hex, not exact colors)))basically and duplicate and change asset names and colors...
- Contact CSC (TAX)

## 2 days after launch
- Start tracking after 2 days (numbers)
- After Week 1, if things look good, X-prsnl
- - Call CoingeckoAPI (research how it calls it, maybe to update the VAPA info?) every 5 seconds, not on page mount...
- Prepare for WACA transition (LTP folder)

## 1 mnth and beyond:
- Fix long marketcap numbers and summary section (sometimes not saving the number info on state so it can height up after investment deletions, which causes a pop-up)....
- (Sort)MarketCap/etc sorting (default by Marketcap always)
- Wait at least 2 months to adjust LTP based on feedback...
- - If traction is good look at LTP folder post WACA
- - increase CG API limit? (track)
- - Compare Retention rate (in bear markets WoM only (percentages)) : Projections (with current trajectory) with/without (WoW percentage comparisons)
- Figure out way to save .JSON info into another very secure section (possibly offline for added security)

### 3 mnths and beyond
- Add legal disclaimer at the bottom of each asset, and add Terms of Service "sign up" (by signing up you a agree to our terms of service)
- Start process of building Featured/Sponsored section (with analytics, CTR, etc)... do not launch until at least 200k MAU

### iOS & Android App (after 1-2 years?)
- iOS App (night/dark mode automatic (website) setting that reads your settings)
- - Tagline: If investments never lost value
- - Desc: This is how your investments would look If investments never lost value.
- - submission: An accounting ledger that shows how investments would look If investments never lost value. 