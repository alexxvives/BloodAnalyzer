# OXYGEN / LLM-wiki pattern (adapted)

Source: [Tim Scheuer, LinkedIn, 2026](https://www.linkedin.com/posts/tim-scheuer-91b005237_we-built-a-company-wide-second-brain-for-share-7474589057239568384-VvsF), describing a GTM knowledge repo after Karpathy’s LLM wiki idea.

The five steps, mapped onto this product (not a GTM second brain):

1. **`/raw`** — immutable sources. Here: this folder. Lab intervals stay in `/data`.
2. **`/wiki`** — short compiled pages (product, copy rules, biomarker data, action plan).
3. **`index.md` + `log.md`** — catalog every agent reads first; append-only change history.
4. **Search** — skipped. No `qmd`. Ripgrep + the index is enough at this repo size.
5. **`/skills`** — output layer (`.cursor/skills/source-biomarker`, `action-plan`).

Do not clone a company-wide Obsidian vault into this repo. Do not dump
transcripts or PII. Health data stays in D1/R2, never in the wiki.
