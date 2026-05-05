# EcoMOF-AI

EcoMOF-AI is an early-stage research prototype for MOF candidate screening, sustainability evaluation, catalysis-oriented exploration, and field-level data provenance.

It is designed for transparent candidate prioritization and research discussion. It is not a complete MOF database, validated ML prediction engine, or substitute for experimental validation.

## Live Demo

[https://linus-he.github.io/ecomof-ai/](https://linus-he.github.io/ecomof-ai/)

## What can you do here?

- **Screen MOF candidates** — Rank candidates by adsorption performance, sustainability, or catalysis fit. Scores express candidate priority, not validated predictions.
- **Inspect descriptor completeness** — See which fields are curated, which are pending, and what evidence level each descriptor carries.
- **Trace data provenance** — Know where each descriptor comes from: source type, database reference, measurement condition, and curation state.

## For different users

- **MOF researchers** — Early-stage candidate prioritization with field-level data provenance and transparent scoring assumptions. Results require independent experimental validation.
- **LCA researchers** — Sustainability-oriented screening with eco-score components, limitations, and candidate comparisons — not a replacement for full industrial LCA.
- **ML / informatics researchers** — Explore the descriptor curation framework, data mode separation, and provenance tracking as a foundation for future data ingestion. Not a trained predictive model.
- **Students / portfolio** — Interact with a real-world prototype showing MOF screening workflow, scoring transparency, and explicit data limitations.
- **Potential collaborators** — Review the platform's current scope, data structure, and methodology before discussing data submissions or joint development.

## Key Modules

- Overview: https://linus-he.github.io/ecomof-ai/#overview
- Performance: https://linus-he.github.io/ecomof-ai/#performance
- EcoScreen: https://linus-he.github.io/ecomof-ai/#ecoscreen
- CatalysisLab: https://linus-he.github.io/ecomof-ai/#catalysis
- MOF Library: https://linus-he.github.io/ecomof-ai/#library
- Data Quality & Provenance: https://linus-he.github.io/ecomof-ai/#data-quality-provenance
- Methodology: https://linus-he.github.io/ecomof-ai/#methodology
- Validation & Evidence: https://linus-he.github.io/ecomof-ai/#validation-evidence
- Contact: https://linus-he.github.io/ecomof-ai/#contact

## Data Modes

- Demo Dataset: used to demonstrate workflow behavior, scoring displays, and UI interaction.
- Real Seed Dataset: a framework for curated real-data ingestion. Some descriptors remain pending curation and it is not a complete database.

## Data Curation Statement

EcoMOF-AI separates demo data, real-seed curation records, and field-level provenance. Demo data is used only to demonstrate workflow behavior. Real Seed Dataset provides a framework for curated real-data ingestion, but some descriptors remain pending curation. A descriptor should only be treated as curated when it has a value, unit or condition when applicable, evidence level, and field-level source record.

## Methodology and Limitations

Current scores indicate candidate priority, not final material performance. The platform does not replace experimental validation, complete industrial LCA, rigorous GCMC or IAST analysis, or validated machine-learning prediction. **EcoMOF-AI is not a validated prediction engine** and has not undergone peer review or independent scientific validation.

Methodology: https://linus-he.github.io/ecomof-ai/#methodology

## Validation & Evidence

EcoMOF-AI is an early-stage research prototype. The platform explicitly tracks:

- Descriptor completeness (value, unit/condition, evidence level, source record)
- Data mode separation — demo data is not mixed with real-seed data
- Field-level source type consistency (literature, database, estimated, pending)
- Scoring formula transparency — all weights and dimensions are auditable

Future validation plans include benchmarking against literature-reported screening results, cross-validation with GCMC simulation data, and comparison of eco-score components with published LCA data.

Scores and rankings should not be cited as validated computational predictions. All results require independent experimental and computational verification before use in scientific conclusions.

Validation & Evidence: https://linus-he.github.io/ecomof-ai/#validation-evidence

## Citation

GitHub citation metadata is provided in [`CITATION.cff`](./CITATION.cff).

Suggested citation:

```text
He, W. EcoMOF-AI: An early-stage research prototype for MOF candidate screening, sustainability evaluation, catalysis-oriented exploration, and field-level data provenance. GitHub Pages, 2026. Available at: https://linus-he.github.io/ecomof-ai/
```

BibTeX:

```bibtex
@misc{he2026ecomofai,
  author = {He, Wenhao},
  title = {EcoMOF-AI: An Early-Stage Research Prototype for MOF Candidate Screening, Sustainability Evaluation, Catalysis-Oriented Exploration, and Field-Level Data Provenance},
  year = {2026},
  url = {https://linus-he.github.io/ecomof-ai/},
  note = {Early-stage research prototype}
}
```

## Local Development

```bash
npm install
npm run dev
npm run build
```

## Deployment

The project uses Vite + React and is deployed to GitHub Pages with the base path `/ecomof-ai/`. Deep links use URL hashes so GitHub Pages can serve the SPA reliably.

## Contact / Collaboration

- Contact form: https://linus-he.github.io/ecomof-ai/#contact
- GitHub: https://github.com/Linus-He/ecomof-ai
