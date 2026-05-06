# EcoMOF-AI

EcoMOF-AI is an early-stage research prototype for MOF candidate screening, sustainability evaluation, catalysis-oriented exploration, and field-level data provenance.

It is designed for transparent candidate prioritization and research discussion. It is not a complete MOF database, validated ML prediction engine, or substitute for experimental validation.

## Live Demo

[https://linus-he.github.io/ecomof-ai/](https://linus-he.github.io/ecomof-ai/)

## What can you do here?

- **Screen MOF candidates** — Rank candidates by adsorption performance, sustainability, or catalysis fit. Scores express candidate priority, not validated predictions.
- **Review gas separation conditions** — Inspect condition-aware gas adsorption and separation records with gas ratio, temperature, pressure, method, source status, and isotherm availability.
- **Inspect descriptor completeness** — See which fields are curated, which are pending, and what evidence level each descriptor carries.
- **Trace data provenance** — Know where each descriptor comes from: source type, database reference, measurement condition, and curation state.

## For different users

- **MOF researchers** — Early-stage candidate prioritization with field-level data provenance and transparent scoring assumptions. Results require independent experimental validation.
- **LCA researchers** — Sustainability-oriented screening with eco-score components, limitations, and candidate comparisons — not a replacement for full industrial LCA.
- **ML / informatics researchers** — Explore the descriptor curation framework, data mode separation, and provenance tracking as a foundation for future data ingestion. Not a trained predictive model.
- **Students / portfolio** — Interact with a real-world prototype showing MOF screening workflow, scoring transparency, and explicit data limitations.
- **Potential collaborators** — Review the platform's current scope, data structure, and Methods & Evidence notes before discussing data submissions or joint development.

## Key Modules

- Overview: https://linus-he.github.io/ecomof-ai/#overview
- Performance: https://linus-he.github.io/ecomof-ai/#performance
- GasSep: https://linus-he.github.io/ecomof-ai/#gassep
- EcoScreen: https://linus-he.github.io/ecomof-ai/#ecoscreen
- CatalysisLab: https://linus-he.github.io/ecomof-ai/#catalysis
- MOF Library: https://linus-he.github.io/ecomof-ai/#library
- Data Quality & Provenance: https://linus-he.github.io/ecomof-ai/#data-quality-provenance
- Methods & Evidence: https://linus-he.github.io/ecomof-ai/#methodology
- Validation & Evidence: https://linus-he.github.io/ecomof-ai/#validation-evidence
- Benchmark References: https://linus-he.github.io/ecomof-ai/#benchmark-references
- Contact: https://linus-he.github.io/ecomof-ai/#contact

## Data Modes

- **Demo Dataset**: used to demonstrate workflow behavior, scoring displays, and UI interaction. Not for scientific interpretation.
- **Real Seed Dataset**: a framework for curated real-data ingestion. Real Seed does not mean a complete database — it represents the curation framework, not a finished data source. Pending descriptors should not be treated as curated facts.

The data mode toggle is available in Performance, EcoScreen, CatalysisLab, and MOF Library views.

## Data Access Layer

The current version uses static JSON files from `public/data`. Data fetching is wrapped in a data service to keep the app API-ready. Future versions may replace static JSON with REST APIs, database-backed services, or offline model inference outputs. No live backend API is required for the current prototype.

当前版本仍使用 `public/data` 中的静态 JSON；数据访问已通过 data service 封装，以便未来接入 REST API、数据库服务或离线模型推理结果。当前原型不依赖实时后端 API。

## Candidate Comparison

Candidate Comparison allows users to compare selected MOF candidates across descriptor completeness, key descriptors, evidence levels, and provenance coverage. It is intended for transparent decision support and should not be treated as a final material performance conclusion.

候选材料对比功能用于比较所选 MOF 在描述符完整性、关键描述符、证据等级和溯源覆盖方面的差异。该功能用于透明决策支持，不代表最终材料性能结论。

## GasSep

GasSep organizes condition-aware gas adsorption and separation records. Selectivity and uptake values should be interpreted with gas ratio, temperature, pressure, method, and source context. The current version does not perform IAST, GCMC, or breakthrough simulation.

GasSep 用于整理带条件说明的气体吸附与分离记录。选择性和吸附量需要结合气体比例、温度、压力、方法和来源共同解读。当前版本不执行 IAST、GCMC 或穿透曲线模拟。

## CatalysisLab

CatalysisLab organizes task-oriented MOF catalysis records, with CO₂ conversion highlighted as a priority curation direction. The module tracks reaction tasks, product targets, catalyst roles, active-site hypotheses, reaction conditions, activity/selectivity metrics, stability notes, and evidence status. It does not claim experimentally validated catalytic performance.

CatalysisLab 用于整理面向任务的 MOF 催化记录，并将 CO₂ 转化作为重点整理方向。该模块关注反应任务、目标产物、催化剂角色、活性位点假设、反应条件、活性/选择性指标、稳定性说明和证据状态，不代表已完成实验验证的催化性能结论。

## Data Curation Statement

EcoMOF-AI separates demo data, real-seed curation records, and field-level provenance. Demo data is used only to demonstrate workflow behavior. Real Seed Dataset provides a framework for curated real-data ingestion, but some descriptors remain pending curation.

A descriptor is treated as curated only when it includes all of:
- value
- unit or condition when applicable
- evidence level
- field-level source record

## Evidence Levels

Evidence levels indicate the current curation state of a descriptor. They do not claim full validation.

- **High**: curated value with source and condition where applicable
- **Medium**: value available but condition or source detail may require review
- **Low**: preliminary or incomplete record
- **Pending**: not yet curated

High does not mean experimentally verified. All results require independent experimental and computational verification.

## Field-level Provenance

Each curated descriptor in the Real Seed Dataset can carry a field-level source record including: source type (literature / database / estimated / pending), database name or DOI, measurement condition, evidence level, curation note, and limitations.

In expanded MOF Library records and in Performance / CatalysisLab real-seed candidate cards, click the ⓘ icon next to a descriptor to view its provenance details. If no provenance record exists, the field shows "Source pending" and should not be read as a verified value.

## Benchmark References

Benchmark references are used for contextual interpretation only and are not direct prediction baselines. UiO-66, ZIF-8, and MIL-53(Al) are shown as familiar research-context anchors for stability, classical ZIF comparison, and flexible-framework behavior. EcoMOF-AI does not claim validated performance superiority over these materials.

Benchmark References: https://linus-he.github.io/ecomof-ai/#benchmark-references

## Descriptor Conditions

Descriptors such as CO₂ uptake, water stability, surface area, and pore volume depend on units, test conditions, evidence level, and source records. If condition metadata is missing, the descriptor should remain condition pending rather than being treated as fully curated.

## Future Scale-up Fields

Scale-up descriptors such as precursor availability, ligand cost class, solvent concern, synthesis temperature, activation condition, energy-intensity notes, and scale-up concern are planned future curation targets. They are not complete in the current prototype and are not part of the current scoring weights.

Future versions may explore MOF-specific representation models such as MOFTransformer for offline feature extraction or candidate-prioritization support. This is future work only; any model-based output would require task-specific validation, applicability-domain checks, and uncertainty reporting before being used as research evidence.

## Methods & Evidence and Limitations

Current scores indicate candidate priority, not final material performance. The platform does not replace experimental validation, complete industrial LCA, rigorous GCMC or IAST analysis, or validated machine-learning prediction. **EcoMOF-AI is not a validated prediction engine** and has not undergone peer review or independent scientific validation.

Methods & Evidence: https://linus-he.github.io/ecomof-ai/#methodology

## Validation & Evidence

EcoMOF-AI is an early-stage research prototype. The platform explicitly tracks:

- Descriptor completeness (value, unit/condition, evidence level, source record)
- Data mode separation — demo data is not mixed with real-seed data
- Field-level source type consistency (literature, database, estimated, pending)
- Scoring formula transparency — all weights and dimensions are auditable

Future validation plans may include contextual comparison against literature-reported screening discussions, cross-checking with independently generated simulation data, and comparison of eco-score components with published LCA data where available.

Scores and rankings should not be cited as validated computational predictions. All results require independent experimental and computational verification before use in scientific conclusions.

Validation & Evidence: https://linus-he.github.io/ecomof-ai/#validation-evidence

## Citation

GitHub citation metadata is provided in [`CITATION.cff`](./CITATION.cff).

Suggested citation:

```text
Linus-He. EcoMOF-AI: An early-stage research prototype for MOF candidate screening, sustainability evaluation, catalysis-oriented exploration, and field-level data provenance. GitHub Pages, 2026. Available at: https://linus-he.github.io/ecomof-ai/
```

BibTeX:

```bibtex
@misc{linushe2026ecomofai,
  author = {{Linus-He}},
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

## SEO / Sharing

The project uses hash deep links for GitHub Pages compatibility. `robots.txt` and `sitemap.xml` provide lightweight sharing and structure hints, but hash links do not fully solve SPA search-engine indexing limits.

## Contact / Collaboration

- Contact form: https://linus-he.github.io/ecomof-ai/#contact
- GitHub: https://github.com/Linus-He/ecomof-ai
