# Precomputed Index Schema (V2.0-F planning)

This document defines the artifacts that the background precompute pipeline
(see `docs/database-precompute-pipeline.md`) will emit. The browser front end
consumes these artifacts only; it never loads the full database or runs full
scoring in the main thread.

**This is a planning schema for V2.0-F. It does not imply that a full database
has been integrated or that full verified screening has been performed.**

## Artifact layout

```
database_index/
  manifest.json            # entry point: versions, sources, file pointers, parts list
  summary.json             # aggregate counts and coverage
  top_candidates.json      # small precomputed Top-N preview
  parts/
    part_001.json          # one index part (loaded on demand)
    part_002.json
    ...
  details/
    <recordId>.json        # one detail record (loaded on demand)
    ...
```

## `manifest.json`

| field | meaning |
| --- | --- |
| `formulaVersion` | OACS/DMRS formula version used for dry-run scoring (unchanged formulas) |
| `metadataGateVersion` | version of the metadata verification gate applied |
| `sourceDataset` | source database name (e.g. `CoRE MOF`, `QMOF`) |
| `sourceVersion` | snapshot/version identifier of the source dataset |
| `datasetMode` | always `database_index_preview` for the front end |
| `recordsScanned` | number of source records scanned |
| `recordsEligible` | records eligible for verified recommendation (passed metadata gate) |
| `recordsBlocked` | records blocked by the metadata gate or hard gates |
| `parts` | list of index part file pointers |
| `notFinalRecommendation` | always `true` |
| `boundary` | human-readable boundary statement |

## `summary.json`

Aggregate counts consumed by the workbench summary cards:

- metadata counts: `verified` / `partial` / `previewOnly` / `blocked`
- descriptor completeness: `complete` / `partial` / `missingCritical`
- provenance coverage summary
- `notFinalRecommendation: true`

## `top_candidates.json`

A small precomputed Top-N preview. Each candidate carries `frameworkId`,
`displayName`, `oacsPreview`, `dataQualityStatus`, metadata verification status,
`detailRef`, and `notFinalRecommendation: true`.

## `parts/*.json`

One index part per file, each holding a bounded list of records with descriptor and
provenance summaries. Loaded one part at a time, on demand.

## `details/*.json`

One detail record per file, loaded only when the user opens a candidate's detail.

## Audit section

Every artifact includes an audit block:

| field | meaning |
| --- | --- |
| `runId` | precompute run identifier |
| `formulaVersion` | OACS/DMRS formula version (unchanged) |
| `metadataGateVersion` | metadata gate version |
| `sourceDataset` / `sourceVersion` | provenance of the scanned data |
| `recordsScanned` / `recordsEligible` / `recordsBlocked` | gate outcome counts |
| `notFinalRecommendation` | always `true` |
| `boundary` | "Precompute/preview only. Not full verified database screening." |
