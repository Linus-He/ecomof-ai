# EcoMOF-AI

EcoMOF-AI is a research prototype for transparent MOF screening, adsorption-performance interpretation, sustainability comparison, and catalysis-oriented evidence structuring. It is designed for exploratory scientific workflows where every score, label, and visualization must keep its data boundary visible.

Live site: https://linus-he.github.io/ecomof-ai/

## 1. Project Motivation

MOF screening tools often compress structural descriptors, adsorption labels, sustainability proxies, and literature evidence into a single rank without showing where the data came from or where it is missing. EcoMOF-AI takes the opposite approach: it keeps candidate prioritization useful while exposing data mode, curation status, descriptor provenance, and validation gaps.

The current application is not a publication-grade predictor. It is a browser-based decision-support prototype for comparing candidate records, organizing evidence, and identifying what must be measured or curated next.

## 2. Key Features

- **Data Provenance**: field-level source popovers and dataset notes identify whether values are curated, pending, inferred, demo-only, or source-record placeholders.
- **Curation Badge**: cards and tables keep curated, pending, and missing descriptor states visible instead of silently imputing final evidence.
- **Real/Demo Mode**: data-mode controls separate Open MOF Seed, Real Seed, and Demo workflows so demo records do not masquerade as real evidence.
- **Interactive Isotherms**: Performance includes a pure-SVG adsorption isotherm chart with multiple gases, temperatures, adsorption/desorption line styles, grid axes, and hover tooltips.
- **Adsorption Filters**: gas, temperature, pressure, minimum uptake, BET area, pore volume, gas pair, and selectivity filters update the Performance adsorption board in real time.
- **Scoring Diagnostics**: reusable scoring utilities and the global scoring workbench show candidate rankings, descriptor weights, evidence distribution, and explanation panels.
- **Catalysis Evidence Workspace**: CatalysisLab preserves a dedicated organic-acid sub-workspace with graph/rule-network evidence, pending queues, and validation-roadmap language.
- **CSD Structure Atlas**: the MOF Library searches the 15,906-record non-commercial CSD MOF Collection, downloads one CIF on demand, and derives unit-cell-aware coordination polyhedra in the browser.

## 3. Data Curation Status

Current bundled datasets:

- Open MOF Seed candidates: 50 records in `public/data/open_mof_seed_candidates.json`.
- Real Seed framework candidates: 11 records in `public/data/mof_candidates_real_seed.json`.
- Demo candidates: 6 records in `public/data/mof_candidates_demo.json`.
- Curated adsorption seed records: 5 records in `src/data/realSeedData.ts`, all marked `DataMode: real` and all containing isotherm points.

The CSD MOF CIF files are not bundled into this application repository. They
are published separately at
[`Linus-He/ecomof-csd-mof-data`](https://github.com/Linus-He/ecomof-csd-mof-data)
under **CC BY-NC-SA 4.0** for open, non-commercial research. The frontend loads
its searchable index and individual CIF files from that repository's GitHub
Pages site. The application code and the CSD-derived data therefore keep
separate provenance and licensing boundaries.

Adsorption curation coverage in the new typed seed file is 5/5 records with at least one isotherm curve. Descriptor coverage is not complete for every scientific use case: detailed digitized source tables, full uncertainty, feed composition, fitted pure-component models, and final IAST recalculation remain known gaps. The UI labels incomplete or non-comparable conditions rather than hiding them.

## 4. Tech Stack

- Vite
- React
- TypeScript
- Vitest
- React Testing Library
- jsdom
- Recharts for existing legacy charts
- 3Dmol.js for browser-side CIF rendering
- quickhull3d for derived coordination-polyhedron surfaces
- Pure SVG for the new isotherm chart to avoid adding another heavy chart dependency

## 5. Getting Started

```bash
npm install
npm run dev
npm run build
npm test
```

To regenerate the separate CSD MOF public package from an authenticated local
download:

```bash
npm run build:csd-public -- \
  --source /path/to/CSD_MOF_Collection \
  --archive /path/to/CSD_MOF_Collection.zip \
  --output /path/to/ecomof-csd-mof-data
```

Additional checks:

```bash
npm run typecheck
npm run visual:check
npx depcheck
```

A CI workflow template is provided at [`docs/ci-workflow-template.yml`](./docs/ci-workflow-template.yml). It can be copied to `.github/workflows/ci.yml` when a workflow-scoped token or the GitHub Web UI is available, and runs `npm test`, `npm run typecheck`, `npm run build`, and `npm run visual:check`.

## 6. Project Structure

```text
.
├── .github/workflows/        # GitHub Pages deployment and CI
├── public/data/              # JSON seed datasets served by Vite/GitHub Pages
├── src/
│   ├── components/           # UI, tabs, charts, catalysis, scoring, layout
│   ├── components/IsothermChart.tsx
│   ├── data/realSeedData.ts  # Typed real adsorption seed records
│   ├── scoring/              # Descriptor registry, weighting, ranking engines
│   ├── types/mof.ts          # Shared MOF adsorption data interfaces
│   ├── utils/                # Scoring, prediction, units, provenance helpers
│   └── __tests__/            # Vitest coverage
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 7. Architecture Decisions

**CSR + Hash Router**

EcoMOF-AI is deployed on GitHub Pages, so client-side rendering with hash-based deep links keeps routes stable without server rewrites. Existing links such as `#performance`, methodology anchors, and module-specific deep links remain portable.

**Typed MOF Data Model**

The `MOFData` model separates structure descriptors, adsorption isotherm points, selectivity metadata, heat of adsorption, descriptor curation status, and source DOI. Isotherm uptake is normalized internally to `mmol/g`; unit conversion helpers support `mmol/g`, `cm³/g (STP)`, `mg/g`, and `wt%`.

**Avoiding a Heavy Isotherm Library**

The new isotherm chart uses pure SVG because the required chart grammar is small: grouped curves, grid axes, tooltip points, and adsorption/desorption line styles. This keeps the adsorption board inspectable and avoids another visualization dependency.

**Evidence-Bound UI**

Real Seed and Open MOF Seed records can be useful before they are complete, but the UI must surface missing descriptors and method differences. Scores are prioritization signals, not claims of validated material performance.

## 8. Limitations

- Scores and rankings are decision-support cues, not validated MOF performance predictions.
- Adsorption data are curated from literature under varying temperature, pressure, activation, and measurement conditions.
- Selectivity values must be compared by method; IAST, Henry, breakthrough, and ideal selectivity are not interchangeable.
- The browser app does not replace GCMC, IAST fitting, breakthrough modeling, complete LCA, or experimental validation.
- Some seed data remain incomplete or condition-specific and should be replaced with digitized primary-source tables before publication use.

## 9. Future Roadmap

- Static generation or hybrid rendering for faster first load while preserving GitHub Pages compatibility.
- Larger verified MOF adsorption dataset with digitized pure-component isotherms and source-level uncertainty.
- User-uploaded candidate records with schema validation and private/local-only review mode.
- Full IAST workflow from fitted isotherms with feed composition and comparable condition controls.
- Broader CI checks for visual regression, deep-link coverage, and dataset schema validation.

## 10. How to Cite

GitHub citation metadata is provided in [`CITATION.cff`](./CITATION.cff).

Suggested citation:

```text
EcoMOF-AI contributors. EcoMOF-AI: A transparent research prototype for MOF candidate screening, gas adsorption evidence curation, sustainability comparison, and catalysis-oriented data provenance. GitHub Pages, 2026. Available at: https://linus-he.github.io/ecomof-ai/
```
