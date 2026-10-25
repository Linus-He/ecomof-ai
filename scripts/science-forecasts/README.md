# Science Forecasts source archive

This is a read-only, curated archive, not a live feed. `index.json` carries light summaries; individual histories are loaded from `events/{source-market-id}.json`. Nobel's existing seven source/year editions remain in their original files and are linked by the unified entry.

## Grain and probabilities

- One technical record = one public Manifold binary contract. MANA is play money. Do not pool it with USD-based sources.
- Open contracts show the archived platform probability. Closed/resolved contracts show the last actual trade **strictly before** the minimum of close, resolution and capture time. Platform resolution is displayed separately. `CANCEL` is never converted to `NO`.
- History includes filled, non-redemption trades with shares and bounded `probAfter`, sorted by millisecond timestamp. Identical timestamps collapse to one observed price. No fabricated observations, settlement-price substitution or forward filling.
- Participant count and volume are source aggregates. Full pagination is requested until fewer than 1,000 rows return. Raw account identities are not published. Public files expose market metadata, aggregates and probability observations only.
- Six source-rule issues are reviewed in `curation.json`, including inconsistent title/body deadlines and underspecified outcomes. Low participation is labelled independently. These flags are preserved, rather than silently repairing source rules.
- Dates in the underlying contracts are substantive deadlines. Administrative capture timestamps stay in provenance/downloads rather than article headers.

## Evidence and discovery

`topics.json` contains independently written bilingual definitions and summaries, plus links to primary institutional material. A paper, an institutional measurement and a company announcement are distinguished from a market outcome. Company icons are official website icons, not generated logos; asset sources and checksums accompany the entity records.

`source-audit.json` records the reviewed contract list, source-response hashes, history pagination/counts, cutoffs and discovery queries. Search scope is a curated pass, not an exhaustive claim about every prediction platform. Dedicated industrial MOF contracts were not verified in that pass. Protein-assisted capture and olivine weathering are explicitly separate pathways, not proxies for MOF odds.

## Refresh

Use the public [Manifold API documentation](https://docs.manifold.markets/api). The scripts need no account, API key or trading action.

1. `python3 scripts/science-forecasts/collect-manifold.py` captures selected market metadata and fully paginated trade records in `/tmp/science-forecasts-source/`. It writes a public, identity-free `collected.json` projection and private-to-the-local-run raw responses for inspection.
2. Review each current source rule against the bilingual `curation.json`; new contracts require explicit topic, stage, institution and evidence joins. A refresh does not make previous editorial review automatically current.
3. `node scripts/science-forecasts/build.mjs --input /tmp/science-forecasts-source/collected.json` validates and publishes the projection and audit. Checked-in `assets.json` provides official icon provenance; already downloaded icons are reused.
4. Run the component/data tests, typecheck, build, browser checks, and update the release log before committing.

Builds do not refresh these sources over the network. This preserves a reviewable snapshot and avoids exposing third-party API availability to page entry.

## Event explanation and company evidence

Every technical event has a bilingual brief, a technology-context reference, a three-item evidence checklist, an industry pathway and a visible primary-source bibliography. `contexts.json` owns shared scientific explanation; `curation.json` owns event-specific interpretation and remaining conditions. Related market prices are displayed separately without pooling or a synthetic technology-success score.

The history reader uses actual UTC calendar coordinates, selected-window statistics, a keyboard-accessible observation index, scoped table/export, and a labelled optional focused vertical scale. Recent ranges default to the last actual trade; the archive-boundary anchor preserves empty windows and reveals inactivity. No boundary prices or intermediate observations are interpolated into the data.

Company/source-date comparisons exclude the whole publication day where the time of day is unknown and use actual trades no more than seven days before/after that day. Missing sides remain missing; material published after the historical cutoff is subsequent context. A report issue date is **not** assumed to be the public-release date. Price differences are descriptive and are not attributed causally to a company or announcement.

Scientific figures use `scripts/scientific-figures/` and checked-in SVGs. They distinguish recorded molecular graphs, computed conformers and authored schematics. The same mechanism supplies the annual Nobel learning examples. Proprietary undisclosed chemistry and atomic coordinates are not invented.
