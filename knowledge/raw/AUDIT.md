# Blood Analyzer — Architecture & Cleanup Audit

**Date:** 2026-08-08  
**Scope:** Inefficiencies, non-standardization, improvements, legacy cleanup.  
**Constraints:** Obeys `AGENTS.md`. No invented reference ranges. No clinical copy changes. No Better Auth / chart-library / OCR / medical-data sign-off items without explicit approval (see [Sign-off queue](#sign-off-queue--do-not-implement-without-approval)).

---

## Executive summary

Architecture is coherent: extraction in `/lib/extraction`, scoring in `/lib/scoring`, sourced data in `/data/*`, D1 report queries `user_id`-scoped. Unit tests are healthy (80 passing, ~1.3s).

Biggest issues were health-data integrity and auth honesty — not style:

1. `/api/action-plan` was unauthenticated.
2. Demographics were never persisted (saved/history scored as male/30).
3. R2 upload keys were dropped on confirm.
4. Action-plan code used `labStatus: "out"|"in"` while scoring emits `"out_of_range"|"in_range"`.
5. Repo carried a ~15MB SiPhox HTML/`_files` dump; AGENTS.md drifted from the real ReportView + credential-auth stack.

This document is the checklist. Phases A–F are the cleanup track. The **sign-off queue** is intentionally last.

---

## Critical path (as of audit)

```
UploadFlow (client)
  → POST /api/extract          [requireUser + R2/memory put + extractFromFile]
  → confirm (edit markers + demographic)
  → POST /api/reports          [requireUser + saveReport]
  → /report/{id}  (preferred)  OR  /report/draft (sessionStorage fallback)
  → ReportView → buildReportSections → scoreBiomarker / compareToPopulation
  → History ← GET /api/reports/history
```

Extractors in production pipeline: CSV, PDF text (`unpdf`), image stub (empty).  
`mockDocumentExtractor` was dead (not in `DEFAULT_EXTRACTORS`).

---

## Findings

| Sev | Cat | Evidence | Recommendation | Status |
|---|---|---|---|---|
| P0 | security | `app/api/action-plan/route.ts` ignored session; no `requireUser` | Gate with `requireUser` + 401 | Tracked in Phase A |
| P0 | integrity | Demographic never saved; history/`[id]` used `DEFAULT_DEMOGRAPHIC` male/30 | Persist age/sex on report; stop inventing defaults | Tracked in Phase B |
| P0 | integrity | Extract returns `upload.key`; confirm omitted `sourceFileKey` | Thread key through save | Tracked in Phase B |
| P1 | bug | Action plan used `labStatus === "out"`; scoring uses `out_of_range` | Normalize to `LabRangeStatus` | Tracked in Phase C |
| P1 | security | Middleware missed `/history`; cookie presence only | Protect `/history`; align docs | Tracked in Phase A |
| P1 | security | `getAppSession()` returned `anonymous-dev` userId | Null / opt-in; never default write id | Tracked in Phase A |
| P1 | security | Silent memory fallback when D1/R2 unbound | Fail closed in production | Tracked in Phase D |
| P1 | AGENTS #5 | Population `dataset`/`sourceRefs` not shown; unavailable → silent `null` | Cite sources; show “benchmark data not yet available” | Tracked in Phase E |
| P1 | docs | Better Auth claimed; package not installed; Checkpoint 7 stale | Doc honesty | Tracked in Phase F |
| P1 | dup | Confirm → draft path discarded `report.id` | Redirect to `/report/{id}` | Tracked in Phase B |
| P2 | dead-code | SiPhox HTML/`_files`/PDF ~15.5MB; orphan UI; mock extractor; dup favicon | Delete / gitignore | Tracked in Phase F |
| P2 | perf | Client ships full markers/stats JSON via `ReportView` | Server-built report DTO | **Sign-off queue** |
| P2 | standards | AGENTS names LipidPanel / PopulationChart; code is ReportView + PopulationComparisonView | Update AGENTS | Tracked in Phase F |
| P2 | incomplete | Image extractor empty stub | OCR later | **Sign-off queue** |

### What already looked solid

- No hardcoded medical ranges in components.
- Status colors via tokens / CSS vars.
- Recharts only inside `PopulationComparison.tsx`.
- D1 report SQL user-scoped; R2 keys `users/{userId}/uploads/...`.
- Package deps all used; tests fast.

---

## Delete / keep / archive

| Item | Verdict | Risk |
|---|---|---|
| `design/.../SiPhox Health.html` + `_files/**` | **delete** | none |
| `design/.../SiPhox Health.pdf` | **delete** (or local-only) | low |
| `design/.../*.png` | **keep** as `ref-01`…`ref-12` | — |
| `lib/extraction/mock-document-extractor.ts` | **delete** | none |
| `components/ui/StatusSwatch.tsx` | **delete** | none |
| `components/ui/InfoPopover.tsx` | **keep + wire** (AGENTS #5) | — |
| Duplicate favicon (`app/` vs `public/`) | **one source of truth** | none |
| `fixtures/sample-lab.csv` | move under extraction fixtures or delete | none |
| `app/preview/**` + `lib/mock/demo-biomarkers.ts` | **keep for now** (dev gallery) | low if deleted later |
| `app/login`, `app/signup` | **keep** (redirect stubs) | — |
| `scripts/*` | **keep** | — |
| `.cursor/` | **gitignore** | none |
| `prompts/*` | **keep** (refresh stale bits) | — |

---

## Standards (source of truth)

| Convention | Source of truth |
|---|---|
| Biomarker / lab status types | `lib/types/biomarker.ts` |
| Status colors | `lib/status-tokens.ts` + `app/globals.css` |
| Scoring | `lib/scoring/index.ts` |
| Report assembly | `lib/report/build-report.ts` + `panel-catalog.ts` |
| Charts | `components/ui/BiomarkerChart.tsx` barrel |
| Extraction | `lib/extraction/pipeline.ts` |
| Auth port | `requireUser()` / `getAppSession()` in `lib/auth/session.ts` |
| D1/R2 scoping | `lib/db/d1-report-repository.ts`, `lib/storage/uploads.ts` |
| Empty copy | “range not available” / “benchmark data not yet available” |
| Citations | `data/SOURCES.md` |
| Auth UX | `/?auth=login\|signup` (see `LEARNINGS.md` in this folder) |

---

## Phased cleanup plan

### Phase A — Auth / security hotfix
- [x] `requireUser` on `/api/action-plan`
- [x] Protect `/history` in middleware
- [x] Stop inventing writable `anonymous-dev` identity
- [x] Align auth README redirect docs

### Phase B — Persist integrity + unify navigation
- [x] Persist demographic on reports (migration)
- [x] Thread `sourceFileKey` from extract → confirm → save
- [x] After save, navigate to `/report/{id}` (draft as fallback only)
- [x] History / saved report use stored demographic (no silent male/30 for scored views when known)

### Phase C — labStatus normalization
- [x] Action plan + builder + card use `out_of_range` / `in_range`
- [x] Fix tests that seeded `"out"` / `"in"`

### Phase D — Bindings fail-closed
- [x] Production: refuse extract/reports when D1/R2 missing
- [x] Keep memory stores for unit tests / explicit local fallback

### Phase E — AGENTS #5 population disclosure
- [x] Show benchmark empty copy when unavailable
- [x] Surface population `dataset` / `sourceRefs` (InfoPopover or equivalent)

### Phase F — Dead code, gitignore, docs honesty
- [x] Delete SiPhox HTML/`_files`/PDF dump; keep PNGs
- [x] Gitignore design dump patterns + `.cursor/`
- [x] Delete mock extractor, StatusSwatch; dedupe favicon
- [x] Update AGENTS.md / README / Checkpoint comments / prompts drift
- [x] Client imports name-map directly (not extraction barrel)

### Later / optional (small)
- [ ] Index reference ranges once per `build-report` loop
- [ ] Lighter history summary endpoint for AppShell nav
- [ ] Decide keep/delete preview gallery

---

## Sign-off queue — status after 2026-08-08 implementation pass

| # | Item | Status |
|---|---|---|
| S1 | Better Auth + D1 | **Done** — `lib/auth/auth.ts`, `/api/auth/[...all]`, client `authClient`; PBKDF2 retained for existing hashes |
| S2 | OCR / image extractor | **Deferred** — costs money at volume (Workers AI / OpenAI / Document AI). Stub remains |
| S3 | Server-built report DTO | **Done** — `buildReportViewModel` + `/api/reports/build` + `ReportLoader` |
| S4 | Clinician review / panel completeness | **Process only** — `data/CLINICIAN_REVIEW.md`. No invented ranges |
| S5 | Chart library swap | **Kept Recharts** — not Haikei/Watermelon; timelines use `BiomarkerTrendChart` |
| S6 | Section components + home polish | **Done lightly** — `ReportSectionBlock` + `/app` home (existing design system; no UI-kit dependency) |
| S7 | Delete preview gallery | **Done** — removed `/preview` + `lib/mock/demo-biomarkers` |
| S8 | Production deploy | **Docs ready** — `DEPLOY.md` + `.dev.vars.example`. Live `npm run deploy` needs your Cloudflare login/secrets |

### New product (approved)

- **`/app` home** — per-biomarker progress timelines across uploads (`HomeView` + `buildBiomarkerTrends`)

---

## Out of scope (this audit)

- Visual/UX polish (`prompts/ux-ui-review.md`)
- Full platform feature review (`prompts/platform-review.md`)
- Inventing or changing clinical ranges/copy
- One-shot mega-refactor of the whole app

---

## Remote

Canonical remote: https://github.com/alexxvives/BloodAnalyzer.git
