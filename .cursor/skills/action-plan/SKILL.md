---
name: action-plan
description: Changes the Blood Analyzer daily routine generator, Groq action-plan prompts, marker cue language, or hydration/hormone theming. Use when the user says the plan is generic, glued, estradiol-only, or medically over-claimed.
---

# Action plan skill

Read `knowledge/wiki/action-plan.md` and `knowledge/wiki/copy-rules.md` first.

## Rules

- Seed (`buildPersonalizedActionPlan`) is the source of truth. Groq is optional polish.
- Never diagnose. Never put lab values in cues.
- Rotate flagged markers. Do not hang every block on one hormone.
- Hydration → kidney markers only. No “water balances estradiol.”
- Split glued copy (`EstradiolEstradiol`, `given your X` stuffed into `food`).
- If Groq output fails those checks, ship the seed.

## After changing prompts or the builder

- Add or update tests in `lib/report/action-plan*.test.ts`
- Confirm a two-hormone panel (estradiol + free testosterone) names both in
  the summary and does not put estradiol on every water line
- Commit, push, `npm run deploy` unless the user said local-only
