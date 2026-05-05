# EcoMOF-AI

EcoMOF-AI is an early-stage research prototype for MOF candidate screening, sustainability evaluation, catalysis-oriented exploration, and field-level data provenance.

It is designed for transparent candidate prioritization and research discussion. It is not a complete MOF database, validated ML prediction engine, or substitute for experimental validation.

## Live Demo

[https://linus-he.github.io/ecomof-ai/](https://linus-he.github.io/ecomof-ai/)

## Key Modules

- Overview: https://linus-he.github.io/ecomof-ai/#overview
- Performance: https://linus-he.github.io/ecomof-ai/#performance
- EcoScreen: https://linus-he.github.io/ecomof-ai/#ecoscreen
- CatalysisLab: https://linus-he.github.io/ecomof-ai/#catalysis
- MOF Library: https://linus-he.github.io/ecomof-ai/#library
- Data Quality & Provenance: https://linus-he.github.io/ecomof-ai/#data-quality-provenance
- Methodology: https://linus-he.github.io/ecomof-ai/#methodology
- Contact: https://linus-he.github.io/ecomof-ai/#contact

## Data Modes

- Demo Dataset: used to demonstrate workflow behavior, scoring displays, and UI interaction.
- Real Seed Dataset: a framework for curated real-data ingestion. Some descriptors remain pending curation and it is not a complete database.

## Data Curation Statement

EcoMOF-AI separates demo data, real-seed curation records, and field-level provenance. Demo data is used only to demonstrate workflow behavior. Real Seed Dataset provides a framework for curated real-data ingestion, but some descriptors remain pending curation. A descriptor should only be treated as curated when it has a value, unit or condition when applicable, evidence level, and field-level source record.

## Methodology and Limitations

Current scores indicate candidate priority, not final material performance. The platform does not replace experimental validation, complete industrial LCA, rigorous GCMC or IAST analysis, or validated machine-learning prediction.

Methodology: https://linus-he.github.io/ecomof-ai/#methodology

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
