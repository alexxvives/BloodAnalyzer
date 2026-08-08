# LEARNINGS

Living notes from product/engineering work on Blood Analyzer. Append dated entries; don’t rewrite history.

## 2026-08-06

### Auth UX
- Signup/login works better as a **home-page modal** (`?auth=login|signup&next=…`) than full-page routes. Keep `/login` and `/signup` as redirects for bookmarks/middleware.
- Name on signup is optional noise — derive display name from the email local-part server-side.

### Form control styling
- Prefer shared `.ba-field` / `.ba-field-sm` / `.ba-select` in `app/globals.css` over per-component Tailwind border/radius stacks. Native `<select>` needs an explicit chevron (`appearance: none` + background SVG) or it looks inconsistent across browsers.

### Extraction warnings
- Don’t surface pipeline internals (“heuristic”, “PDF text layer”, OCR caveats) on the confirm screen. Users already know to review values; keep warnings for failures/unmapped markers only.

### Units: `/mmc` vs `/uL`
- Spanish labs often print cell counts as `/mmc`. **1 mmc = 1 mm³ = 1 µL**, so `/mmc` ≡ `/uL`. Remapping the unit string without scaling the number is correct for absolute counts like `4.950.000`.
- Reference data stores absolute counts (e.g. `4950000` `/uL`), not “millions” (`4.95`). If a lab prints `4.95 ×10⁶/µL`, that needs a separate scale conversion — don’t confuse the two.

### Marker aliases: MCH vs MCHC
- Spanish CBC lines:
  - `Hb Corpuscular Media (HCM)` → **MCH**
  - `C. Hb Corpuscular Media (CHCM)` → **MCHC** (the leading **C.** = concentration)
- Two separate bugs stacked:
  1. Inline parser forbids `.` in names (so dotted leaders aren’t eaten) → `C. Hb…` lines never parse. Fix: rewrite single-letter abbreviations (`C. ` → `C `) before matching.
  2. `normalizeMarkerKey` must treat `.` as a separator. Otherwise `C. Hb…` substring-matches `hb corpuscular media` → **mch**, and the MCHC row is dropped as a duplicate id.
- Also normalize Italian/OCR `corpuscolar` → `corpuscular` and split CamelCase (`HbCorpuscolar`).

### Section % rings
- Binary “% good or optimal” reads as **100%** whenever every in-lab marker only has `attention|good` bands (common for CBC). Prefer a **weighted score**: optimal=100, good=75, fair=40, attention=0.
- Rings are driven by scored statuses from the user’s confirmed values + `/data/reference-ranges` — never decorative.

### Grade bands
- Markers should expose the full attention → fair → good → optimal ladder **inside** the lab interval when possible (see hematocrit / hemoglobin). Flat “everything in lab = good” bands make rings and grades feel fake.
- Lab bounds (`labLow`/`labHigh`) stay the in/out-of-range source of truth; optimization bands are educational mid-range splits and stay cited as provisional.

### Disclaimers
- User preference: no blocking “Before you continue” gate and no hero educational blurb on the report. Keep a single short footer/aside “not medical advice” note instead of repeating the same copy.
