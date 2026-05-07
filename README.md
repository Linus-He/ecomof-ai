# EcoMOF-AI

## Project Overview

EcoMOF-AI is an early-stage research prototype for MOF candidate screening, sustainability evaluation, gas separation records, and catalysis-oriented data structuring.

Scores and rankings are used for transparent candidate prioritization and research discussion. They are not validated material-performance predictions.

## Live Demo

[https://linus-he.github.io/ecomof-ai/](https://linus-he.github.io/ecomof-ai/)

## Key Modules

- **Overview**: entry point for the staged MOF decision-support workflow.
- **EcoScreen**: sustainability-aware candidate screening and evidence-aware ranking.
- **GasSep**: condition-aware gas adsorption and separation records.
- **CatalysisLab**: CO₂ conversion pathways, biomass-assisted CO₂/HCO₃⁻ case templates, data normalization, record preview, and rule-assisted candidate prioritization.
- **MOF Library**: MOF records with descriptor completeness and field-level provenance.
- **Methods & Evidence**: scoring formulas, data boundaries, evidence notes, and limitations.

## CatalysisLab

CatalysisLab organizes CO₂ conversion records by product pathway, including C1 products, C2+ products, organic-acid-related products, cyclic carbonates, and CO₂-assisted upgrading.

The module is schema-first: it displays pathway context, reaction conditions, product distribution fields, evidence status, and source status without publishing private values or claiming validated catalytic performance.

## GasSep

GasSep organizes gas adsorption and separation records with condition context such as gas ratio, temperature, pressure, method, source status, and isotherm availability.

The current prototype does not perform IAST, GCMC, or breakthrough simulation.

## Data Intake & Collaboration

EcoMOF-AI supports collaboration-oriented data structuring for catalyst records, reaction conditions, product metrics, characterization evidence, mechanism notes, and source status.

Private or unpublished data should only be represented as approved public records, anonymized demos, or schema-only templates.

## Catalysis Data Normalization

Catalysis experiment sheets are treated as raw records that need normalization before visualization, comparison, or future exploratory modeling.

Suggested tables include `catalyst_records`, `reaction_conditions`, `product_metrics`, and `evidence_records`. The current site does not provide public upload, backend storage, or live API ingestion.

## Case Study Templates

EcoMOF-AI can represent collaboration-oriented catalysis cases as schema-only templates before public data release.

A biomass-assisted CO₂/HCO₃⁻ conversion template can organize reaction conditions, product distribution, mechanism evidence, confidentiality mode, and ML-ready fields without publishing private values.

## Limitations

- Scores indicate candidate priority, not final material performance.
- Demo data is for workflow demonstration and should not be interpreted as scientific evidence.
- Real-seed records may contain pending descriptors and source gaps.
- ML-ready fields do not mean a trained predictive model is available.
- Experimental validation, complete LCA, rigorous GCMC/IAST analysis, and uncertainty reporting remain outside the current prototype.

## Citation

GitHub citation metadata is provided in [`CITATION.cff`](./CITATION.cff).

Suggested citation:

```text
EcoMOF-AI contributors. EcoMOF-AI: An early-stage research prototype for MOF candidate screening, sustainability evaluation, catalysis-oriented exploration, and field-level data provenance. GitHub Pages, 2026. Available at: https://linus-he.github.io/ecomof-ai/
```

## Local Development

```bash
npm install
npm run dev
npm run build
```

## Deployment

The project uses Vite + React and is deployed to GitHub Pages with the base path `/ecomof-ai/`. Deep links use URL hashes so GitHub Pages can serve the SPA reliably.
