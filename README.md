# Blood Analyzer

Web platform for visualizing blood test results against sourced reference ranges.
Educational tooling — **not medical advice**.

See [AGENTS.md](./AGENTS.md) for architecture and non-negotiables.  
See [AUDIT.md](./AUDIT.md) for cleanup status and remaining decisions.  
See [DEPLOY.md](./DEPLOY.md) for Cloudflare Workers deploy.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Cloudflare Workers via OpenNext (`@opennextjs/cloudflare`)
- D1 + R2 + **Better Auth** (email/password)
- Production fails closed without D1/R2 bindings

## Try the flow

1. Copy `.dev.vars.example` → `.dev.vars` and set `BETTER_AUTH_SECRET`
2. `npm install && npm run dev`
3. Apply migrations: `npx wrangler d1 migrations apply blood-analyzer --local`
4. Sign up from the home page (`?auth=signup`)
5. Open [/app](http://localhost:3000/app) — biomarker progress home
6. [/upload](http://localhost:3000/upload) — CSV or text-layer PDF → confirm → saved report

## Develop

```bash
npm install
npm run dev
npm test
```

Cloudflare preview / deploy:

```bash
npm run preview
npm run deploy
```

## Design reference

Curated SiPhox UI screenshots: [`design/reference-screenshots/`](./design/reference-screenshots/) (`ref-01.png` … `ref-12.png`).
Visual language only — do not copy branding or product copy.

## Deploy / Cloudflare URL

**Live:** https://blood-analyzer.alexxvives.workers.dev  

Redeploy with `npm run deploy`. See [DEPLOY.md](./DEPLOY.md).

## Data

Reference ranges and population stats must be cited. UI shows
"range not available" / "benchmark data not yet available" when missing.
Track status in [`data/SOURCES.md`](./data/SOURCES.md) and clinician process in
[`data/CLINICIAN_REVIEW.md`](./data/CLINICIAN_REVIEW.md).
