# Blood Analyzer — full platform review prompt

Copy everything below the line into a fresh agent chat (or PR review) when you want a thorough style + logic audit.

---

You are reviewing **Blood Analyzer**, a Next.js app where users upload a blood test (PDF/image/CSV), confirm extracted values, and see a sectioned educational report (biomarkers vs sourced reference ranges + population benchmarks). Visual reference: SiPhox screenshots in `/design/reference-screenshots` — **do not copy SiPhox branding or product copy**. Product name is **Blood Analyzer**.

Read and obey `/AGENTS.md` non-negotiables before proposing changes:
1. Never hardcode medical ranges/averages in UI — only `/data/reference-ranges` and `/data/population-stats`, source-cited.
2. No diagnosis / clinical claims in copy.
3. Health data is highest-priority security (Cloudflare Workers + D1 + R2; credential sessions today, Better Auth migration gated). D1 queries must be `user_id`-scoped; R2 keys user-scoped.
4. Extraction is a separate inspectable pipeline with mandatory human confirm.
5. Missing sourced data → honest empty states (“range not available” / “benchmark data not yet available”), never invent numbers inline.

## Goals of this review

Produce a prioritized findings list (P0 / P1 / P2) covering **visual polish**, **UX logic**, **data honesty**, and **product gaps**. Then propose a concrete implementation plan. Prefer fixing real bugs over drive-by refactors.

## Must-investigate issues (known / reported)

1. **Side menu scroll coupling** — page scrolling should never move the sidebar. Sidebar should stay fixed; only main content scrolls. Verify on `/report/draft` with a long report, collapsed + expanded, desktop + mobile drawer.
2. **Landing polish** — home marketing landing exists (`app/page.tsx` + `MarketingShell`). Review brand-first hero, CTA to upload/start, and Log in / Sign up modal paths (`?auth=login|signup`).
3. **Confirm-screen labels** — extracted Spanish fragments like “A la primera hora” must show canonical marker names (e.g. ESR), not raw PDF snippets.
4. **Grades N/A / population empty states** — audit which markers still lack `sourced: true` ranges or population means; extend the data layer with citations, never invent in components.
5. **Extraction quality** — re-test with a real Spanish lab PDF (text layer). Confirm CBC, chemistry, vitamins, hormones map correctly; filter reference-range prose.
6. **App chrome consistency** — collapsible sidebar on all authenticated/app pages; landing/auth pages may use a different chrome (no dense app nav in the hero).

## Style review checklist

- Brand-first first viewport on landing (Blood Analyzer as hero-level signal).
- Avoid generic AI-slop aesthetics (purple gradients, cream+terracotta clichés, emoji clutter, pill soup).
- Use existing tokens in `app/globals.css` (`accent`, status colors, sidebar). No inline hex for status.
- Cards only where they aid interaction; report sections should feel clinical-warm and scannable (SiPhox-inspired layout, original brand).
- Motion: 2–3 intentional transitions max on landing; keep report calm.
- Desktop + mobile: landing, upload, confirm, draft report, auth screens.
- Typography: Fraunces display + DM Sans body already configured — keep consistency.

## Logic / architecture checklist

- Upload → `/api/extract` → confirm → draft report flow is coherent; empty/error states honest.
- Scoring + population comparison are pure and unit-tested (`/lib/scoring`).
- Confirm screen lists mapped markers with editable values; unmapped noise should not flood the table.
- Demographic (age/sex) influences sex-specific ranges; default demographic should match typical upload or be clearly editable.
- Disclaimer present and non-dismissible on first report view.
- No secrets committed; local lab PDFs with PII stay gitignored.

## Auth / product gaps to design (even if stubbed)

- `/login` and `/signup` pages (email + password UI at minimum; OAuth optional later).
- Post-auth home vs marketing landing split.
- Session stub → Better Auth + D1 migration path noted, not silently reinvented.
- Upload storage stub → R2 user-scoped keys called out where incomplete.

## Deliverables

1. **Findings table**: severity, area (UI / extraction / data / security / a11y), evidence (route/file), recommendation.
2. **Top 5 fixes** to implement immediately.
3. **Landing + auth wire plan** (routes, components, copy constraints).
4. **Optional**: implement P0/P1 fixes in-repo following AGENTS.md; run `npm test` and smoke `/upload` + `/report/draft`.

## Out of scope unless asked

- Real clinician review of reference ranges.
- Vision OCR for scanned PDFs/photos.
- Production Cloudflare deploy / secrets setup.

Start by reading `AGENTS.md`, `app/layout.tsx`, `components/layout/AppShell.tsx`, `components/report/ReportView.tsx`, `components/upload/UploadFlow.tsx`, `lib/extraction/*`, and `data/SOURCES.md`. Then browse the running app (`npm run dev`) on `/`, `/upload`, `/report/draft`.
