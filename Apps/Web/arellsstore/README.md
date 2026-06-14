Part of the **Arells** monorepo — see the repository root `README.md`. **Arells is on a mission to ensure investments never lose value.**

---

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Deploy on Amplify — cache bust after CSS/UI changes

Next.js ships CSS and JS as hashed files under `_next/static/` with `Cache-Control: public, max-age=31536000, immutable`. Each deploy gets new hashes; HTML is not cached as aggressively.

**Safari (especially iPhone)** often keeps an old CSS bundle until you force a fresh load. After deploying UI/CSS changes:

| Browser | Action |
|---------|--------|
| iPhone Safari | Close the tab and reopen the site, or Settings → Safari → Clear History and Website Data |
| Mac Safari | **Cmd+Option+R** (empty cache and hard reload) |
| Chrome | **Cmd+Shift+R** / **Ctrl+Shift+R** |

**Verify:** open a private/incognito window, or in Web Inspector → Network check that `_next/static/css/<hash>.css` matches the hash in a fresh fetch of the page HTML (not a hash from an earlier deploy).

Amplify build logs also print a reminder after `next build` (see `amplify.yml`).
