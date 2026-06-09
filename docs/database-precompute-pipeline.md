# Database Precompute Pipeline (V2.0-F planning)

This document describes the planned background precompute pipeline for large-scale
CoRE/QMOF-like database integration in EcoMOF-AI.

**V2.0-F is pipeline planning + a local dry-run only. It is not full verified
database screening, and it does not connect to or download any external database.**

## Why a background pipeline

CoRE/QMOF-like databases are large. Scoring them is a precompute or background-script
task that must run **outside the browser main thread**. The browser front end only
consumes lightweight, precomputed artifacts:

- `manifest.json`
- summary files
- precomputed Top-N preview
- a selected index part (loaded on demand)
- detail records (loaded on demand)

The front end never statically imports the full database index, never loads all parts
or detail records at once, and never runs full database scoring in the main thread.
These boundaries (the V2.0-D worker boundary and V2.0-E metadata gate) are unchanged.

## Pipeline stages

1. **Raw database records** — source records ingested from a database snapshot
   (a small 50–200 record sample first; full integration is later work).
2. **Metadata normalization** — normalize field names, units, and identifiers into the
   internal record shape. Missing fields stay missing; no value is fabricated.
3. **Metadata verification gate** — apply the V2.0-E metadata gate
   (`src/utils/databaseIndex/metadataVerification.js`): classify each record as
   `verified_metadata` / `partial_metadata` / `preview_only` / `blocked` from DOI,
   source link, license, citation, and descriptor provenance status. Records missing
   key metadata cannot become verified recommendations.
4. **Descriptor completeness check** — count complete / partial / missing-critical
   descriptor coverage. Records without critical descriptors cannot be scored.
5. **OACS/DMRS dry-run scoring** — run the existing OACS/DMRS logic as an audit dry-run.
   **The OACS/DMRS formulas are not modified.** Dry-run output is a diagnostic, not a
   calibrated or final recommendation.
6. **Precomputed Top-N index** — emit a small Top-N preview plus index parts and detail
   stubs (see `docs/precomputed-index-schema.md`).
7. **Selected part / detail-on-demand** — the front end loads one selected part and
   individual detail records only when the user requests them.
8. **Browser preview boundary** — the browser consumes manifest / summary / Top-N /
   selected part / detail-on-demand only. No full-database load, no main-thread scoring.
9. **No final recommendation boundary** — every artifact carries
   `notFinalRecommendation: true`. Preview and dry-run output are never presented as
   full verified database screening or a final recommendation.

## Dry-run script

`scripts/precompute-database-score-dry-run.mjs` implements stage 3–4 as an offline
dry-run over existing local preview fixtures:

- reads existing small fixtures (the precomputed Top-N preview and a selected index
  part) — it does **not** download CoRE/QMOF or load the full database;
- calls the V2.0-E metadata verification utility;
- counts `verified` / `partial` / `previewOnly` / `blocked`;
- counts descriptor completeness (`complete` / `partial` / `missingCritical`);
- writes an audit summary to
  `public/data/database_precompute/precompute_dry_run_summary.json`;
- never goes to the network and never generates a final recommendation.

Run it with:

```bash
node scripts/precompute-database-score-dry-run.mjs
```

## Boundaries (must remain true)

- V2.0-F is pipeline planning + dry-run, **not** full verified screening.
- Full database scoring must run **outside the browser main thread** (background script /
  precompute job).
- The front end consumes only manifest / summary / Top-N / selected part /
  detail-on-demand.
- The **OACS/DMRS formulas are not modified**.
- Database integration starts from a **50–200 record** small sample (V2.0-G), not the
  full database.
