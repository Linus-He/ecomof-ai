# Science Forecasts source archive

This is a read-only, curated archive, not a live feed. `index.json` carries light summaries; individual histories are loaded from `events/{source-market-id}.json`. Nobel's existing seven source/year editions remain in their original files and are linked by the unified entry.

## Grain and probabilities

- One technical record = one public Manifold binary contract. MANA is play money. Do not pool it with USD-based sources.
- Open contracts show the archived platform probability. Closed/resolved contracts show the last actual trade **strictly before** the minimum of close, resolution and capture time. Platform resolution is displayed separately. `CANCEL` is never converted to `NO`.
- History includes filled, non-redemption trades with shares and bounded `probAfter`, sorted by millisecond timestamp. Identical timestamps collapse to one observed price. No fabricated observations, settlement-price substitution or forward filling.
- Participant count and volume are source aggregates. Full pagination is requested until fewer than 1,000 rows return. Raw account identities are not published. Public files expose market metadata, aggregates and probability observations only.
- Source-rule issues are reviewed in `curation.json`, including inconsistent title/body deadlines and underspecified outcomes. Low participation is labelled independently. These flags are preserved, rather than silently repairing source rules.
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

## October 25 expansion

Seven topics now include fusion electricity, quantum error-corrected computing and perovskite photovoltaics. Six new binary contracts are independently captured; previous event snapshots are preserved. Every event retains its own observedAt boundary. Closed/unresolved contracts are not resolved editorially. Missing denominator, gate-definition and deadline details remain visible rule flags.

Institution flags use the institution location or company headquarters, as specified in each entity country.basis and country.source; they do not represent all operating sites or parent-company ownership. Oxford PV is marked UK while its German production site remains explained in the announcement. Official favicon sources and checksums are registered for new institutions.

Topic histories precede background reading, and event reading follows history, technology/criteria, announcements, references, then related events. Expanded editorial commentary accompanies existing primary links and does not turn plans, factory capacity or laboratory results into completed deliveries.

## Battery and chemistry expansion

The next pass adds four topic workbenches: sodium-ion batteries, EV batteries/grid storage, clean hydrogen/electrolysis and AI drug discovery/clinical validation. Sixteen new source contracts retain their own API capture boundary while the earlier 25 snapshots remain unchanged. Two battery additions bring the battery collection to three topics and 19 events.

Twenty-five source-backed indicators span six topics. Every row has bilingual value, reference period, scope, source ID and a kind: measurement, reported statistic, company disclosure, model estimate, development target or under-construction pipeline. These rows are independently scoped records, not a pooled benchmark. Trial primary/secondary endpoints, sample/follow-up and sponsor interests are retained. Source-rule constants such as 130/260 GWh never become observed industry statistics.

Build validation rejects broken metric-to-topic source joins, missing bilingual conditions, unknown indicator kinds and broken related-topic links. Topic coverage counts history observations and flagged contracts; it does not sum participants into a claimed unique population or label sparse sources complete. Chemistry filtering includes battery materials. Indicator CSVs retain the same source/condition fields as the table.

IEA's French country cue identifies the international agency's secretariat. Insilico Medicine Shanghai identifies the paper's author affiliation rather than a guessed global headquarters. Sources without redistributed brand icons are still cited by their own titles and URLs. All additions are based on public metadata and aggregate market histories, without account identifiers.

## Organic chemistry literature topics

Four mode=literature workbenches cover asymmetric organocatalysis, visible-light photoredox, click/bioorthogonal chemistry and PET enzymatic recycling. They add nine source-located reaction cases, 25 indicators and 13 papers/official documents. Eight curated public-market searches are recorded in organic-discovery-review.json; no directly appropriate new contracts were selected. Literature-only topics do not receive invented probabilities, zero-value markets or synthetic price histories.

Each case includes bilingual transformation, catalyst, reported conditions, outcome, scope, source IDs and source location. Source joins, unique case/metric IDs, complete fields and literature/market separation are validated at build. Reported data now uses a broad label suitable for institutional scientific summaries as well as industry statistics.

The source review keeps scope ranges distinct from single experiments, er from ee, exo/endo ratios from exo ee, lamp wattage from photon flux, mass-based PET loading from concentration per litre, and enzyme mass from catalyst mole fraction. Current-looking project pages do not replace dated historical disclosures. Experimental summaries point to original papers/SI rather than presenting a complete laboratory protocol.

The new navigation is within Science Forecasts. The independent Catalysis/Organic Acid workspace remains separate. Author affiliations follow the publication period (e.g., Berkeley for the 2000 Diels–Alder study; Princeton for the 2008 photoredox study).

## October 26: admission requires an actual trade curve

Thirteen additional binary markets add 1,782 accepted observations in nine existing topics. Ten curve-backed technical topics gain reading; eleven new source documents and 21 indicators bring the archive to 54 markets, 12,793 observations, 63 documents and 71 indicators. The four previously published literature topics and seven Nobel editions are preserved; no new curve-free topic was admitted.

`curve-admission-review.json` records accepted IDs, first/last observations, history page counts, search response hashes and excluded candidates. Empty-rule delivery/phone contracts and unrelated search matches were not used as filler. Small-participation markets are visibly labelled; having a curve does not imply liquid or reliable consensus.

`curveAdmission.mjs` runs **before any output is written**. It requires at least two distinct actual pre-cutoff timestamps, full pagination, valid probabilities, reviewed records and a curve for every non-literature technical topic. New literature-only topic IDs are rejected. The 41 original source snapshots are protected with digests over source metadata/provenance/observations, allowing authored reading to evolve without silently refreshing prices.

Use `collect-manifold.py --ids ID ... --output /tmp/your-capture` to capture a reviewed subset. Merge the new projections with preserved event source records before the build. A refresh of an earlier market requires explicit review and updated snapshot digests; do not automatically replace historical source records. Raw responses and user identities remain local to the temporary capture directory.

New interpretation keeps nuclear hydrogen output separate from reactor heat, approved German pipelines separate from operating European routes, contained V and LCE separate from other material units, NIF target gain separate from net electrical gain, and fuel utilization separate from durable removal. Company costs and product claims are labelled as company disclosures; scientific/context sources do not independently settle a platform contract.
