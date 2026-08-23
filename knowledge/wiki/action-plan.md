# Action plan

The daily routine is a **biomarker-aware seed** (`buildPersonalizedActionPlan`)
with an optional Groq rewrite.

1. Group flagged markers into themes (lipids, glucose, kidney, iron, liver,
   vitamins, **hormones**, rhythm, inflammation, maintenance).
2. Rotate `given your …` cues across the day. Two flagged markers must not
   collapse onto one name.
3. Hydration cues attach only to kidney markers (urea, creatinine, eGFR,
   uric acid). If those are absent, recommend water without a sex-hormone cue.
4. Groq may rewrite `food` actions. If it glues marker+why, concatenates
   names (`EstradiolEstradiol`), or hangs every line on one marker, **discard
   the rewrite and ship the seed**.
5. If Groq is missing or errors, ship the seed. The seed is personalized, not
   a placeholder.

Prompts: `lib/report/action-plan.ts`. Language helpers:
`lib/report/action-plan-language.ts`. Skill: `.cursor/skills/action-plan`.
