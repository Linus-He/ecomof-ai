# Nobel Chemistry annual readings

Official award facts: https://api.nobelprize.org/v1/prize.json?category=chemistry

## Rebuild and verify

- `npm run build:nobel-chemistry`: rebuild the checked-in annual files from the official snapshot and authored readings.
- `npm run verify:nobel-sources`: read official annual sources and retain URL, retrieval date, size and SHA-256 in `source-audit.json`. Full article copies stay in a temporary cache, outside the published site.
- `node scripts/nobel/build-nobel-chemistry.mjs --live`: refresh the official award snapshot before rebuilding. A newly announced awarded year deliberately fails until its sourced reading is authored. Publishing is a separate step; no automatic monitoring is configured.

The regular production build rebuilds this archive. All 118 awarded years between 1901 and 2026 contain the same six-part Chinese reading: overview, background, principles/mechanism with annotated equations, applications, significance, and development/limits. Eight non-awarded years are identified separately. English interface controls and official English originals are available; detailed historical commentary is currently Chinese.

`historical-readings.tsv` is authored editorial content with ten fields: year, theme, background, principle, equation, equation note, applications, significance, development, and related official year. Source types are distinguished: popular information, press release, or historical presentation speech. Related-year links describe research connections, not necessarily direct historical descent or a claim of the latest 2026 research. These are concise educational accounts, not exhaustive reviews.

The builder requires coverage of every awarded year, rejects duplicate/empty records and validates equation rendering with KaTeX. It preserves original award attribution when multiple discoveries share a year. Equations explicitly identify simplified examples, model limits and omitted chemistry; they are not presented as verbatim Nobel equations or complete laboratory procedures.

Full official original texts are linked below each reading, not copied into this website. 2025/2026 use local original Nobel Prize Outreach portrait assets with attribution; historical editions use official individual laureate portraits, preserving the same typography, credits and left alignment.

Each page loads only the selected year's JSON after Explore. Editing the year does not load or replace the article. Homepage metadata is a tiny separate file; the full archive is never bundled into the homepage.

Every awarded year also has a sourced research/industry section. `annual-research.tsv` contains the year-specific connection; `research-catalog.json` contains the verified papers, institutions, company roles and brand assets. `research-source-audit.json` retains citation metadata. A shared contemporary paper may be relevant to several historical discoveries; the connection is authored separately and is not a claim that the paper won that historical prize. The expanded MOF edition is maintained in `2025-editorial.json`.

Official person portraits and credits are collected by `python3 scripts/nobel/collect-portraits.py` and validated against award order and names. Portrait files are local; ownership credits remain visible.

The separate Prediction Markets page loads one year at a time from `public/data/nobel-odds/`. Refresh with `python3 scripts/nobel/collect-polymarket.py` and `node scripts/nobel/enrich-polymarket.mjs`. The collector uses Gamma for discovery and CLOB price-history for pre-announcement samples. A year needs a verified cutoff. Post-cutoff prices and settlement values are excluded. Missing individual markets are not assigned a zero probability. `candidate-profiles.tsv` supplies brief bilingual research focuses and primary profile links; annual laureates come from the official Nobel record.

Administrative retrieval/publication dates stay in provenance metadata and are not rendered. Award years and bibliography years remain visible.

Candidate institutions are frozen per market year in `candidate-affiliations.tsv`; they are not inferred from today’s profile when a historical edition loads. `candidate-organizations.json` records the real institution marks, asset origins and checksums. The name-adjacent badge links to the official profile used to verify the affiliation. One primary institution is shown; emeritus appointments and joint affiliations are not an exhaustive employment history. New market years require their own verified mapping before enrichment succeeds.
