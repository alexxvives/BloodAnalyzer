# Blood Analyzer

Web platform for visualizing blood test results against sourced reference ranges.
Educational tooling — **not medical advice**.

See [AGENTS.md](./AGENTS.md) for architecture and non-negotiables.  
See [AUDIT.md](./AUDIT.md) for the cleanup audit, phased plan, and sign-off queue.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Cloudflare Workers via OpenNext (`@opennextjs/cloudflare`)
- D1 + R2 with credential sessions (Better Auth–compatible schema; library migration gated — see [`lib/auth/README.md`](./lib/auth/README.md))
- Dev may use in-memory stores when bindings are unbound; production fails closed unless `ALLOW_MEMORY_STORE=1`

## Try the flow

1. `npm run dev`
2. Sign up / log in from the home page (`?auth=login`)
3. Open [/upload](http://localhost:3000/upload) — CSV or text-layer PDF
4. Confirm/edit values + age/sex → saved report at `/report/{id}`
5. Component gallery (dev): [/preview/biomarker-cards](http://localhost:3000/preview/biomarker-cards)

## Develop

```bash
npm install
npm run dev
npm test
```

Apply D1 migrations (local):

```bash
npx wrangler d1 migrations apply blood-analyzer --local
```

Cloudflare preview (Workers runtime):

```bash
npm run preview
```

## Design reference

Curated SiPhox UI screenshots live in [`design/reference-screenshots/`](./design/reference-screenshots/) (PNG only).
Visual language only — do not copy branding or product copy.

## Data

Reference ranges and population stats must be cited. Until then, UI shows
"range not available" / "benchmark data not yet available". Track citation
status in [`data/SOURCES.md`](./data/SOURCES.md).
