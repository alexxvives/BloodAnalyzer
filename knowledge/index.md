# Knowledge index

Read this file first. Then open only the pages the task needs.

Blood Analyzer uses a slim [OXYGEN-style](https://www.linkedin.com/posts/tim-scheuer-91b005237_we-built-a-company-wide-second-brain-for-share-7474589057239568384-VvsF) memory: immutable sources, a compiled wiki, this catalog, an append-only log, and skills as the output layer. There is no local search engine (`qmd`) — the repo is small enough that this index plus ripgrep is the retrieval layer.

## Read first

| File | When |
|---|---|
| [`AGENTS.md`](../AGENTS.md) | Every task. Non-negotiables, architecture, ship rule. |
| [`wiki/product.md`](wiki/product.md) | What the product is and is not |
| [`wiki/copy-rules.md`](wiki/copy-rules.md) | No diagnosis, no invented numbers, disclaimer |
| [`data/SOURCES.md`](../data/SOURCES.md) | Any range, band, population number, or "why is this unsourced?" |
| [`data/CLINICIAN_REVIEW.md`](../data/CLINICIAN_REVIEW.md) | Review backlog and markers still missing from the catalog |
| [`knowledge/log.md`](log.md) | What changed recently and why |

## Wiki (compiled)

Agents maintain these from raw sources. Do not paste medical cutpoints here — cite `data/`.

| File | When |
|---|---|
| [`wiki/product.md`](wiki/product.md) | Positioning, stack, visual reference vs branding |
| [`wiki/copy-rules.md`](wiki/copy-rules.md) | Educational language, disclaimer, lifestyle-only |
| [`wiki/biomarker-data.md`](wiki/biomarker-data.md) | How ranges and explanations are filled |
| [`wiki/action-plan.md`](wiki/action-plan.md) | Daily routine generator: seed first, Groq second |

## Raw (immutable)

| File | When |
|---|---|
| [`raw/README.md`](raw/README.md) | What belongs in raw vs `data/` |
| [`raw/oxygen-pattern.md`](raw/oxygen-pattern.md) | The second-brain layout this repo adapted |

Medical numbers live in `/data/reference-ranges` and `/data/population-stats`, not in `raw/`.

## Skills (output layer)

| Skill | When |
|---|---|
| [`.cursor/skills/source-biomarker/SKILL.md`](../.cursor/skills/source-biomarker/SKILL.md) | Filling missing ranges, citing Mayo/guidelines, shrinking the review backlog |
| [`.cursor/skills/action-plan/SKILL.md`](../.cursor/skills/action-plan/SKILL.md) | Changing the daily routine, Groq prompts, or cue language |

## Also useful

| File | When |
|---|---|
| [`LEARNINGS.md`](../LEARNINGS.md) | Older product/UX notes (pre-log). Prefer appending to `log.md` now. |
| [`AUDIT.md`](../AUDIT.md) | Security/integrity history and the sign-off queue |
| [`lib/auth/README.md`](../lib/auth/README.md) | Auth stack honesty |
| [`DEPLOY.md`](../DEPLOY.md) | How live Worker deploys (push is not enough) |
