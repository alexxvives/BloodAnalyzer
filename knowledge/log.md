# Log

Append-only. Newest at the top. Do not rewrite old entries.

## 2026-08-23

- Catalog search for previously ungraded calculated markers. Sourced VLDL (Quest 319 / Mayo LMPP <30 mg/dL), UIBC (Labcorp 18–60 sex-specific), FAI (Labcorp 146688 sex/age), BUN:creatinine (Quest 296 adults 6–22), and transferrin (Mayo TRSF 200–360). Still ungraded after named-page search: TG:HDL (Quest 37848 is See Laboratory Report; papers disagree), LDL:ApoB, AST:ALT, % free T, remaining hormone/thyroid ratios, female cycle-phase estradiol/FSH/LH.
- Removed SiPhox screenshot dump (`design/reference-screenshots`), one-off marker patch scripts, debug extract scripts, and review prompt files. Repo layout is app / components / lib / data / knowledge.
- Adapted a slim OXYGEN layout (`knowledge/raw`, `knowledge/wiki`, index, log, skills). No qmd — ripgrep is the search layer. Added an `action-plan` skill.
- Action plan: hormone theme; rotate cues; hydration no longer pins water to estradiol; Groq rewrite is quality-gated and falls back to the personalized seed.
- Report overview: removed the “72% vs 77% (−5 pts vs average)” line under overall score.
- Sourced TC:HDL (Quest 7600 <5.0), LDL:HDL (Quest 19543 sex-specific tiers), and eAG (ADA/ADAG formula on existing A1C bands). Added educational copy for every catalog marker, including ratios that stay ungraded (LDL:ApoB, TG:HDL, hormone/thyroid ratios).
- Sourced ApoB:ApoA1 from Mayo APOAB (sex-specific Lower/Average/Higher Risk). INTERHEART cited for epidemiology only. No NHANES median yet.
- Sourced TSH (Mayo STSH 0.3–4.2), morning cortisol (Mayo CORT a.m. 7–25), folate (Mayo FOL ≥4), hs-CRP (AHA/CDC 2003 tertiles), Lp(a) (ACC/AHA 2018 ≥50). Removed unpublished TSH 0.4–2.5 and folate >20 interiors.
- Added this index/log plus a `source-biomarker` skill so agents batch-source every named-page marker instead of stopping at one example.
- Still cannot grade without inventing: female cycle-phase estradiol/FSH/LH (no cycle day), female PSA (Mayo N/A), remaining calculated ratios (TG:HDL, LDL:ApoB, T:C, cortisol:DHEA-S, % free T, free T3:T4, TSH:T4, AST:ALT). Electrolytes still not in the catalog.
