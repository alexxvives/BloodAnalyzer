# Product

Blood Analyzer is a web platform: upload a blood test (PDF/image/CSV), review
extracted values, then see a sectioned report. Each biomarker is shown against
a **sourced** reference range, with population comparison when a cited
demographic average exists, plus click-to-expand educational copy.

Visual style reference: SiPhox screenshots in `/design/reference-screenshots`.
Branding is **Blood Analyzer** — do not copy SiPhox names or product copy.

Stack: Next.js on Cloudflare Workers, D1, R2, Better Auth–compatible sessions.
D1 has no RLS — every query is `user_id`-scoped in application code.

Non-negotiables live in `AGENTS.md`. Short version: never invent ranges in UI,
never diagnose, treat uploaded files as sensitive health data, keep extraction
as its own pipeline step, cite every visual claim.
