# EcoMOF-AI

**EcoMOF-AI is a research-oriented MOF decision-support prototype integrating screening, LCA/LCC, and robustness analysis.**

EcoMOF-AI is staged deliberately: performance and chemistry first, broader cost, lifecycle, and robustness comparison later.

**EcoMOF-AI 是一个面向科研的 MOF 决策支持原型，集成吸附筛选、热力学解释、生命周期评价（LCA）、生命周期成本（LCC）与稳健性分析，用于早期候选材料的比较与研究假设生成。**

[Live demo / 在线工具](https://Linus-He.github.io/ecomof-ai/)

## Scope

EcoMOF-AI is not presented as a finished publication-grade scientific platform. Current outputs are intended for early-stage screening, workflow demonstration, and research hypothesis generation. They do not replace experiment, GCMC, strict IAST, or full inventory-linked industrial LCA.

## Staged Workflow

- **Stage 1 — Scientific Screening**: performance, chemistry/stability cues, applicability, and interpretation.
- **Stage 2 — Feasibility Boundaries**: rough cost, availability, supply, and use-scale sanity checks.
- **Stage 3 — Secondary Comparison**: preliminary LCA/LCC and sensitivity for shortlisted candidates.
- **Future Stage 4 — Engineering Evaluation**: process-route design, scale-up economics, and engineering-grade LCA/LCC.

## Current Features

- **Screening**: MOF presets, gas-system selection, direct descriptor input, CIF parsing scaffold, batch mode, and optional FastAPI backend connection.
- **Adsorption output**: predicted uptake, apparent/Henry/IAST-style screening selectivity, confidence and applicability notes.
- **Thermodynamics**: predicted multi-temperature isotherms, beta Qst interpretation, CSV isotherm upload, and Langmuir fitting scaffold.
- **Feasibility**: coarse linker availability, cost-band, precursor rarity, and scale-sensitivity checks.
- **LCA / LCC**: shortlist-oriented characterization, normalization, cost breakdown, price provenance, currency display switching, and performance-environment-cost tradeoff.
- **Sensitivity**: shortlist robustness checks, scenario analysis, parameter sweeps, decision stability, and uncertainty-style views.
- **Validation**: manifest-driven metric display, parity/residual plots, benchmark notes, and applicability warnings for the screening layer.
- **Data Sources**: dedicated provenance page separating structures, adsorption labels, LCA inventory, LCC assumptions, isotherms, and validation manifests.

## Data Contracts

The project separates data into traceable layers:

- `data/mof_structures.csv`: MOF identity, topology, PLD/LCD, BET, pore volume, void fraction, density, OMS, CIF/source metadata.
- `data/adsorption_labels.csv`: gas pair, temperature, pressure, loading, Henry constants, selectivity, method, source reference, quality flag.
- `data/lca_inventory.csv`: material, solvent, energy, water, waste, cost, uncertainty, price source, assumptions, and replacement route.
- `data/isotherms.csv`: pressure-loading-temperature points for isotherm fitting, Henry/IAST preparation, and Qst workflows.

Static browser copies live in `public/data/*.json`. These are seed records and schemas, not complete scientific databases.

## Backend

```bash
cd backend
python -m pip install -r requirements.txt
python train_model.py
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Key endpoints include `/predict`, `/health`, `/models/manifest`, `/database/structures`, `/database/adsorption-labels`, `/database/lca-inventory`, `/descriptors/schema`, `/isotherms/schema`, `/isotherms/fit`, and `/report/template`.

## Development

```bash
npm install
npm run dev
npm run build
```

## Roadmap

- Replace seed adsorption labels with verified NIST, literature, or GCMC labels.
- Import CoRE/QMOF CIFs and compute descriptors with Zeo++/RASPA/pymatgen-style tooling.
- Train separate models by gas pair and expose uncertainty plus applicability-domain diagnostics.
- Replace proxy LCA/LCC records with citable inventory and price databases.
- Implement strict IAST and research-grade Qst from real multi-temperature pure-component isotherms.

## Contact

- GitHub: [@Linus-He](https://github.com/Linus-He)
- Email: square.hwh@gmail.com
