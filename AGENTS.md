<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

## Agent memory

Read [`knowledge/index.md`](knowledge/index.md) first. Append notable
decisions to [`knowledge/log.md`](knowledge/log.md). Sourcing or filling
biomarker gaps: follow [`.cursor/skills/source-biomarker/SKILL.md`](.cursor/skills/source-biomarker/SKILL.md)
and finish every sourceable marker in the backlog, not one example.

## Project

A web platform where a user uploads a blood test (PDF/image/CSV), and gets a
visual, sectioned report: each biomarker shown against its reference range
(attention / fair / good / optimal), plotted against the population average
for the user's demographic (age + sex), with click-to-expand explanations
and recommended actions for out-of-range results. Visual style reference:
SiPhox (see `/design/reference-screenshots`). Product branding is **Blood Analyzer**
— SiPhox is a visual reference only; do not copy their branding or product copy.

## Non-negotiables

1. **Never hardcode medical reference ranges or population averages in
   component code.** They live in a versioned, sourced data layer
   (`/data/reference-ranges/`), each entry tagged with its source
   (LOINC code, lab consensus range, citation). If a range is unknown or
   unsourced, the UI must show "range not available" — never a guessed number.
2. **No diagnosis, no clinical claims.** Copy describes what a marker
   measures and general lifestyle-level suggestions ("commonly linked to
   iron intake — consider discussing with your doctor"), never "you have X."
   Every report includes a persistent, non-dismissible-on-first-view
   disclaimer that this is not medical advice.
3. **PII / health data handling is the highest-priority security concern
   in this repo.** Uploaded files and parsed results are sensitive health
   data. Stack: Cloudflare Workers + D1 + R2 + Better Auth.
   **D1 has no Postgres-style RLS** — every query MUST be scoped by the
   authenticated `user_id` in application code. R2 object keys MUST be
   user-scoped. Any deviation from encryption-at-rest expectations, scoped
   access, or auth requirements needs explicit sign-off, not silent
   implementation.
4. **Extraction (PDF/image → structured values) must be a separate,
   inspectable pipeline step**, not folded into the UI code. The user
   must be able to see and correct what was extracted before it's saved.
5. **Every visual claim needs a data source.** Population-average
   comparisons must state where that average comes from (which dataset,
   what demographic slice) — shown in the info popover, not hidden.
   If benchmark data is missing, show "benchmark data not yet available"
   rather than inventing a number.

## Architecture

- `/app` — routes/pages
- `/components/report` — shared `ReportView` + `BiomarkerCard` /
  `BiomarkerDetailPanel` driven by `buildReportSections` + `PANEL_CATALOG`
  (data-driven sections — not per-panel bespoke React components)
- `/components/ui` — primitives (`RangeBar`, `InfoPopover`,
  `PopulationComparisonView` via `BiomarkerChart` barrel)
- `/lib/extraction` — file parsing (PDF/image/CSV → raw values), isolated,
  testable, swappable; UI only displays/edits results
- `/lib/scoring` — maps a raw value + demographic → status
  (attention/fair/good/optimal), pure functions, unit tested
- `/data/reference-ranges` — versioned JSON/YAML, source-cited, NOT
  colocated with UI code
- `/data/population-stats` — same rule: sourced, versioned, cited
- Cloudflare: D1 for structured data, R2 for uploads, credential sessions on
  D1 today (Better Auth–compatible schema; library migration is opt-in — see
  `lib/auth/README.md` and `AUDIT.md` sign-off queue)

## Conventions

- Every biomarker card is driven by a single typed schema
  (`Biomarker` in `/lib/types`) — no per-marker bespoke components.
- Status colors are a single design-token mapping, defined once
  (`attention`, `fair`, `good`, `optimal`), reused everywhere — never
  inline hex codes per component. Visual reference also uses dual badges:
  Lab in/out-of-range + optimization grade.
- Cards use a **vertical** segmented range gauge; detail panels use a
  **horizontal** gauge (see SiPhox screenshots).
- All charts (position-in-range, population comparison) use one charting
  library (**Recharts**), wrapped in shared UI (`BiomarkerChart` /
  `RangeBar` / `PopulationComparisonView`) — don't mix chart libraries.
- Ask before irreversible architecture decisions (swapping Cloudflare stack,
  changing chart library, Better Auth cutover).
- **Ship after every completed change:** commit, `git push` to origin, and
  `npm run deploy`. There is no CI — push alone does not update the live
  Worker. Do not wait to be asked.

## Before marking any task "done"

- Run and pass unit tests on `/lib/scoring` (range math is the part
  that's actually dangerous to get wrong)
- Check the report renders correctly with: a fully-normal panel, a panel
  with missing markers, a panel with out-of-range values in every category
- Confirm no reference range or population number was invented inline —
  trace it back to `/data/reference-ranges` or `/data/population-stats`
