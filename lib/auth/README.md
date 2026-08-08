# Auth + Cloudflare storage

## Current (wired)

- **Credential auth** (email/password) → Cloudflare **D1** (`user`, `account`, `session`)
- Cookie: `ba_session` (httpOnly)
- **Reports** → D1 `reports` + `biomarker_results` (always `user_id`-scoped), with demographic snapshot columns
- **Uploads** → R2 bucket `blood-analyzer-uploads` under `users/{userId}/uploads/...`
  (in-memory only when `NODE_ENV !== "production"` or `ALLOW_MEMORY_STORE=1`)

Middleware gates `/upload`, `/report/*`, `/history`, `/preview/*` — unauthenticated
users are sent to `/?auth=login&next=…` (home modal). `/login` and `/signup` remain
thin redirects for bookmarks.

## Provisioned resources

| Resource | Name | Binding |
|---|---|---|
| D1 | `blood-analyzer` | `DB` |
| R2 | `blood-analyzer-uploads` | `UPLOADS` |

Migrations:

```bash
npx wrangler d1 migrations apply blood-analyzer --local
npx wrangler d1 migrations apply blood-analyzer --remote
```

## Better Auth migration path (not installed yet)

Do **not** invent a second session system long-term. Replace
`lib/auth/credentials.ts` password/session helpers with Better Auth using the
same D1 tables where possible (`better-auth` + OpenNext Cloudflare). Keep
`getAppSession()` / `requireUser()` as the app-facing port so routes stay stable.

```bash
npm i better-auth
npx wrangler secret put BETTER_AUTH_SECRET
```

`.dev.vars`:

```
BETTER_AUTH_SECRET=dev-only-change-me
BETTER_AUTH_URL=http://localhost:3000
```

This migration is gated in `AUDIT.md` (sign-off item S1).

## Non-negotiable

Every D1 query for reports/uploads/profiles **must** include `user_id = session.userId`.
R2 keys must use `users/{userId}/...`.
Protected API routes must call `requireUser()` and return 401 when absent —
never invent a synthetic user id for writes.
