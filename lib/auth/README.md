# Auth + Cloudflare storage

## Current (wired)

- **[Better Auth](https://www.better-auth.com/docs/installation)** email/password → Cloudflare **D1**
- Session cookie: `better-auth.session_token` (httpOnly via Better Auth)
- App port: `requireUser()` / `getAppSession()` in `session.ts` (routes stay stable)
- Client: `authClient` from `auth-client.ts` (`signIn.email` / `signUp.email`)
- Handler: `/api/auth/[...all]`
- **Reports** → D1 `reports` + `biomarker_results` (always `user_id`-scoped) + demographic snapshot
- **Uploads** → R2 under `users/{userId}/uploads/...`

Middleware gates `/upload`, `/report/*`, `/history`, `/app` — unauthenticated
users go to `/?auth=login&next=…`.

Password hashing still uses the existing PBKDF2 helpers so accounts created
before the Better Auth cutover can sign in.

## Env

```
BETTER_AUTH_SECRET=   # 32+ chars — required in production
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_TRUSTED_ORIGINS=
```

See [`DEPLOY.md`](../../DEPLOY.md).

## Migrations

```bash
npx wrangler d1 migrations apply blood-analyzer --local
npx wrangler d1 migrations apply blood-analyzer --remote
```

Auth tables in D1 use **snake_case** columns (`user_id`, `email_verified`, …).
`lib/auth/auth.ts` maps Better Auth’s camelCase fields to those columns — without
that mapping, sign-in fails with `no such column: account.userId`.

## Non-negotiable

Every D1 query for reports/uploads/profiles **must** include `user_id = session.userId`.
R2 keys must use `users/{userId}/...`.
Protected API routes must call `requireUser()` and return 401 when absent.
