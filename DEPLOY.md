# Deploy (Cloudflare Workers + D1 + R2)

Blood Analyzer deploys via OpenNext → Cloudflare Workers.

## Prerequisites

1. Cloudflare account + `npx wrangler login`
2. D1 database `blood-analyzer` and R2 bucket `blood-analyzer-uploads` (already named in `wrangler.jsonc`)
3. Secrets / vars

## Secrets & vars

```bash
# Required for Better Auth (32+ chars)
openssl rand -base64 32
npx wrangler secret put BETTER_AUTH_SECRET

# Optional — AI action plans
npx wrangler secret put GROQ_API_KEY
```

In `wrangler.jsonc` (or dashboard vars):

```jsonc
"vars": {
  "BETTER_AUTH_URL": "https://YOUR_WORKER.workers.dev",
  "BETTER_AUTH_TRUSTED_ORIGINS": "https://YOUR_CUSTOM_DOMAIN"
}
```

Local `.dev.vars` (gitignored):

```
BETTER_AUTH_SECRET=dev-only-change-me-32chars-minimum!!
BETTER_AUTH_URL=http://localhost:3000
GROQ_API_KEY=
```

## Migrations

```bash
npx wrangler d1 migrations apply blood-analyzer --local
npx wrangler d1 migrations apply blood-analyzer --remote
```

## Deploy

```bash
npm run deploy
```

Preview worker locally:

```bash
npm run preview
```

## Notes

- The live Worker URL:
  https://blood-analyzer.alexxvives.workers.dev
- `BETTER_AUTH_URL` in `wrangler.jsonc` must match that URL (set for production).
- Production **fails closed** without D1/R2 (no silent memory PHI store).
- Set `ALLOW_MEMORY_STORE=1` only for explicit non-prod overrides.
- After deploy, create a test account via `/?auth=signup` and upload a CSV/PDF.
- Windows deploys: `npm run deploy` applies a symlink→copy patch for OpenNext
  (`scripts/patch-opennext-windows.mjs`). Enabling Windows Developer Mode is better long-term.
