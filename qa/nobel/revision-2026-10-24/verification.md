# Nobel annual readings revision — 2026-10-24

Result: passed for the requested implementation and responsive checks.

## Scope and evidence

- 126 annual records from 1901–2026: 118 awarded editions with six-part Chinese readings; eight explicit non-awarded years.
- Official source retrieval metadata: `scripts/nobel/source-audit.json` (118 records, checked 2026-10-24). Each reading links its actual source type: popular science, press release or historical presentation speech.
- Full originals remain on NobelPrize.org, linked below each reading. Editorial models and additional equations are not represented as verbatim Nobel text.
- The development sections are concise source-backed research connections and limitations, not an exhaustive or continuously updated literature review.

## Layout and browser checks

- `2025-desktop.png`: full browser capture at a 1440 × 1000 CSS viewport. Heading reduced to 40px; selector reduced to 48px tall; shared page background measured `rgb(255, 255, 255)`.
- The laureate text and following reading both start at x=82.507 CSS px. No sudden centered inset.
- `2025-mobile.png`: 390 × 844 CSS viewport; document scroll width 384px (scrollbar excluded), equal leading left edges, bounded formula scrollers.
- `2026-narrow.png`: 320 × 844 CSS viewport; document scroll width 314px, selector width 250px, no horizontal page overflow.
- `1901-mobile.png`: earliest edition uses the same section order and annotated equation treatment, with the correct official presentation-speech link.
- Browser interaction checked 2025 → 1901 → 1916 → 2026 → 2025. Non-awarded 1916 shows no invented laureates or reading. Explore retains deferred loading. Browser error log empty.

The original requested adjustment screenshots were visible in the conversation but their temporary files are no longer on disk. Earlier implementation captures under `qa/nobel/` preserve the previous large masthead and centered body; final captures and measured geometry establish the requested changes. This check does not claim pixel-identical reproduction of the missing source files.

## Content and build validation

- Builder rejects missing annual editorials, non-awarded-year commentary, empty fields, duplicate years, missing source references, and invalid KaTeX.
- Each awarded edition has an overview plus background, principles/mechanism, applications, significance and development/limits. Reaction examples distinguish separate discoveries sharing an award; simplified equations explicitly state limits.
- Relevant home, navigation, component and data suites: 13 files / 33 tests passed; final component/data checks add and pass slow-response cancellation coverage.
- Typecheck, production build and whitespace checks passed after the final fixes.
- Unrelated existing worktree deletions and audit artifacts were preserved. No commit, push or deployment was performed.
